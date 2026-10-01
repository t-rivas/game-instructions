'use strict';

// Only manually agreed awards are stored. Replay stops at the first winning
// entry; later entries remain in history so a correction can restore them.
function createTrucoScore() {
  let names = ['', ''], target = 30, started = false, locked = false, entries = [];
  const positive = value => Number.isSafeInteger(value) && value > 0;
  const validNames = values => Array.isArray(values) && values.length === 2 &&
    values.every(name => typeof name === 'string' && name.trim()) &&
    values[0].trim().toLowerCase() !== values[1].trim().toLowerCase();
  const validEntry = entry => entry && [0, 1].includes(entry.side) && positive(entry.points) &&
    ['', 'truco', 'envido', 'flor', 'other'].includes(entry.label);
  // Check even excluded entries, since later corrections can reactivate them.
  const safeHistory = history => [0, 1].every(side => {
    let total = 0;
    return history.filter(entry => entry.side === side).every(entry => {
      total += entry.points;
      return Number.isSafeInteger(total);
    });
  });
  function snapshot() {
    const totals = [0, 0];
    let winner = null, winningIndex = null;
    const history = entries.map((entry, index) => {
      const counted = winner === null;
      if (counted) {
        totals[entry.side] += entry.points;
        if (totals[entry.side] >= target) { winner = entry.side; winningIndex = index; }
      }
      return {...entry, counted};
    });
    return {names:[...names], target, started, locked, entries:history, totals, winner, winningIndex, finished:winner !== null};
  }
  return {
    configure(values, goal) {
      if (locked || !validNames(values) || !positive(goal)) return false;
      names = values.map(name => name.trim()); target = goal; started = true; return true;
    },
    rename(values) {
      if (!validNames(values)) return false;
      names = values.map(name => name.trim()); return true;
    },
    award(side, points, label = '') {
      const entry = {side, points, label};
      if (!started || snapshot().finished || !validEntry(entry) || !safeHistory([...entries, entry])) return false;
      entries.push(entry); locked = true; return true;
    },
    correct(index, side, points, label = '') {
      const entry = {side, points, label};
      if (!Number.isInteger(index) || index < 0 || index >= entries.length || !validEntry(entry)) return false;
      const history = entries.map((old, i) => i === index ? entry : old);
      if (!safeHistory(history)) return false;
      entries = history; return true;
    },
    delete(index) {
      if (!Number.isInteger(index) || index < 0 || index >= entries.length) return false;
      entries.splice(index, 1); return true;
    },
    undo() { if (!entries.length) return false; entries.pop(); return true; },
    newGame() { entries = []; started = false; locked = false; },
    snapshot
  };
}

function trucoScorePhase(total, target) {
  if (target !== 30 || total >= target) return null;
  return total < 15 ? {points:total, name:'malas'} : {points:total - 15, name:'buenas'};
}

const trucoScore = createTrucoScore();
let trucoSetupDraft = null;
let trucoAwardDraft = {label:'', points:['', '']};
let trucoEditDraft = null;
let trucoRenameDraft = null;
let trucoScoreMessage = null;

function trucoLabelOptions(selected) {
  return [['', tr('No label', 'Sin etiqueta')], ['truco', 'Truco'], ['envido', 'Envido'], ['flor', 'Flor'], ['other', tr('Other', 'Otro')]]
    .map(([value, text]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${text}</option>`).join('');
}
function trucoScoreView() {
  const game = trucoScore.snapshot();
  const setup = !game.started || trucoSetupDraft !== null;
  if (setup && !trucoSetupDraft) trucoSetupDraft = {names:[...game.names], target:String(game.target)};
  return `<section class="truco-score" id="truco-score" aria-labelledby="truco-score-heading">
    <h2 id="truco-score-heading" tabindex="-1">${tr('Manual Truco scoreboard', 'Marcador manual de Truco')}</h2>
    <p class="truco-note">${tr('Two sides: individuals or partnerships. Enter only the points agreed at your table. This scoreboard does not calculate card values, Envido, Falta Envido, Flor, accepted/refused bids or regional conventions.', 'Dos lados: personas o parejas. Ingresa solo los puntos acordados en la mesa. Este marcador no calcula valores de cartas, Envido, Falta Envido, Flor, cantos aceptados o rechazados ni convenciones regionales.')}</p>
    ${setup ? `<form id="truco-setup-form"><fieldset><legend>${tr('Set up the game', 'Preparar partida')}</legend>
      <div class="truco-grid">${trucoSetupDraft.names.map((name, side) => `<label>${tr(`Side ${side + 1} name`, `Nombre del lado ${side + 1}`)}<input id="truco-name-${side}" data-truco-name="${side}" required value="${escapeHTML(name)}" autocomplete="off"></label>`).join('')}</div>
      <label>${tr('Target points', 'Puntos para ganar')}<input id="truco-target" type="number" inputmode="numeric" min="1" step="1" required value="${escapeHTML(trucoSetupDraft.target)}"></label>
      <p class="truco-note">${tr('Default: 30. The target locks after the first award, including after deleting or undoing every entry. Custom targets use total/target only.', 'Por defecto: 30. La meta queda fija tras la primera anotación, incluso si borras o deshaces todas las entradas. Las metas personalizadas muestran solo total/meta.')}</p>
      </fieldset><button type="submit" id="truco-start">${tr('Open scoreboard', 'Abrir marcador')}</button></form>` : trucoActiveScoreView(game)}
    <p id="truco-score-error" role="alert">${trucoScoreMessage ? escapeHTML(tr(...trucoScoreMessage)) : ''}</p>
    <p class="truco-note">${tr('Scores stay while switching guides, language or theme. Reloading clears this scoreboard.', 'El marcador se conserva al cambiar de guía, idioma o tema. Recargar la página borra este marcador.')}</p>
  </section>`;
}
function trucoActiveScoreView(game) {
  const excluded = game.entries.filter(entry => !entry.counted).length;
  return `<p class="truco-note">${game.locked ? tr('Target locked after the first award.', 'Meta fija desde la primera anotación.') : tr('The target can still be changed before the first award.', 'Todavía puedes cambiar la meta antes de la primera anotación.')} ${game.target === 30 ? tr('Totals 0–14: malas. Totals 15–29: buenas.', 'Totales 0–14: malas. Totales 15–29: buenas.') : ''}</p>
    ${game.locked ? '' : `<button type="button" id="truco-edit-setup">${tr('Edit setup', 'Editar configuración')}</button>`}
    <div id="truco-score-status" role="status" aria-live="polite">
      ${game.finished ? `<p class="truco-finish" id="truco-winner">${tr('Winner: ', 'Ganador: ')}<strong>${escapeHTML(game.names[game.winner])}</strong> · ${game.totals[game.winner]} / ${game.target}</p>` : ''}
      <div class="truco-grid">${game.names.map((name, side) => {
        const phase = trucoScorePhase(game.totals[side], game.target);
        return `<div class="truco-side" data-truco-side="${side}"><h3>${escapeHTML(name)}</h3><p class="truco-total">${tr('Total', 'Total')}: <strong>${game.totals[side]} / ${game.target}</strong></p><p class="truco-phase">${phase ? `${phase.points} ${phase.name}` : game.totals[side] >= game.target ? tr('Target reached', 'Meta alcanzada') : ''}</p></div>`;
      }).join('')}</div>
      ${excluded ? `<p class="truco-warning" id="truco-history-warning">${tr(`${excluded} later entries are after the winning award and excluded from totals. Edit or delete them, or correct the winning award to include them again.`, `${excluded} entradas posteriores a la anotación ganadora quedan fuera de los totales. Edítalas o bórralas, o corrige la anotación ganadora para volver a incluirlas.`)}</p>` : ''}
    </div>
    <label>${tr('Optional award label', 'Etiqueta opcional de la anotación')}<select id="truco-award-label" ${game.finished ? 'disabled' : ''}>${trucoLabelOptions(trucoAwardDraft.label)}</select></label>
    <div class="truco-grid">${game.names.map((name, side) => `<fieldset><legend>${tr('Award points to ', 'Sumar puntos a ')}${escapeHTML(name)}</legend>
      <div class="truco-actions">${[1, 2, 3, 4].map(points => `<button type="button" id="truco-add-${side}-${points}" data-truco-award="${side}" data-points="${points}" aria-label="${escapeHTML(tr(`Award ${points} points to ${name}`, `Sumar ${points} puntos a ${name}`))}" ${game.finished ? 'disabled' : ''}>+${points}</button>`).join('')}</div>
      <form data-truco-custom="${side}"><label>${tr('Custom points', 'Puntos personalizados')}<input id="truco-custom-${side}" type="number" inputmode="numeric" min="1" step="1" required value="${escapeHTML(trucoAwardDraft.points[side])}" ${game.finished ? 'disabled' : ''}></label><button type="submit" id="truco-custom-save-${side}" ${game.finished ? 'disabled' : ''}>${tr('Award points', 'Sumar puntos')}</button></form>
    </fieldset>`).join('')}</div>
    ${trucoEditDraft ? `<form id="truco-correction-form"><fieldset><legend>${tr(`Edit entry ${trucoEditDraft.index + 1}`, `Editar entrada ${trucoEditDraft.index + 1}`)}</legend><div class="truco-grid">
      <label>${tr('Side', 'Lado')}<select id="truco-edit-side">${game.names.map((name, side) => `<option value="${side}" ${String(side) === trucoEditDraft.side ? 'selected' : ''}>${escapeHTML(name)}</option>`).join('')}</select></label>
      <label>${tr('Points', 'Puntos')}<input id="truco-edit-points" type="number" inputmode="numeric" min="1" step="1" required value="${escapeHTML(trucoEditDraft.points)}"></label>
      <label>${tr('Optional label', 'Etiqueta opcional')}<select id="truco-edit-label">${trucoLabelOptions(trucoEditDraft.label)}</select></label>
      </div><div class="truco-actions"><button type="submit" id="truco-save-correction">${tr('Save correction', 'Guardar corrección')}</button><button type="button" id="truco-cancel-correction">${tr('Cancel', 'Cancelar')}</button></div></fieldset></form>` : ''}
    <h3>${tr('Award history · oldest first', 'Historial de anotaciones · más antiguas primero')}</h3>
    ${game.entries.length ? `<ol class="truco-history">${game.entries.map((entry, index) => `<li data-truco-entry="${index}" ${entry.counted ? '' : 'class="truco-excluded"'}><div><strong>${escapeHTML(game.names[entry.side])} +${entry.points}</strong>${entry.label ? `<span>${entry.label === 'other' ? tr('Other', 'Otro') : {truco:'Truco', envido:'Envido', flor:'Flor'}[entry.label]}</span>` : ''}${index === game.winningIndex ? `<span>${tr('Winning award', 'Anotación ganadora')}</span>` : ''}${entry.counted ? '' : `<span class="truco-entry-warning">${tr('After winning award · excluded from totals', 'Después de la anotación ganadora · fuera de los totales')}</span>`}</div><div class="truco-actions"><button type="button" id="truco-correct-${index}" data-truco-correct="${index}" aria-label="${tr(`Edit entry ${index + 1}`, `Editar entrada ${index + 1}`)}">${tr('Edit', 'Editar')}</button><button type="button" data-truco-delete="${index}" aria-label="${tr(`Delete entry ${index + 1}`, `Borrar entrada ${index + 1}`)}">${tr('Delete', 'Borrar')}</button></div></li>`).join('')}</ol>` : `<p class="truco-note">${tr('No awards yet.', 'Todavía no hay anotaciones.')}</p>`}
    <button type="button" id="truco-undo" ${game.entries.length ? '' : 'disabled'}>${tr('Undo latest entry', 'Deshacer última entrada')}</button>
    <details class="truco-names"><summary>${tr('Edit side names', 'Editar nombres de los lados')}</summary><form id="truco-rename-form"><div class="truco-grid">${(trucoRenameDraft || game.names).map((name, side) => `<label>${tr(`Side ${side + 1} name`, `Nombre del lado ${side + 1}`)}<input id="truco-rename-${side}" data-truco-rename="${side}" required value="${escapeHTML(name)}" autocomplete="off"></label>`).join('')}</div><button type="submit">${tr('Save names', 'Guardar nombres')}</button></form></details>
    <button type="button" id="truco-new-game">${tr('New game', 'Nueva partida')}</button>`;
}
function refreshTrucoScore(focusId) {
  const root = document.getElementById('truco-score');
  if (!root) return;
  root.outerHTML = trucoScoreView(); bindTrucoScore();
  if (focusId) document.getElementById(focusId)?.focus({preventScroll:true});
}
function bindTrucoScore() {
  const root = document.getElementById('truco-score');
  if (!root) return;
  const find = id => root.querySelector('#' + id);
  const error = (en, es) => { trucoScoreMessage = [en, es]; find('truco-score-error').textContent = tr(en, es); };
  const changed = focus => { trucoScoreMessage = null; refreshTrucoScore(focus); };
  const historyChanged = () => { trucoEditDraft = null; changed('truco-score-heading'); };
  if (find('truco-setup-form')) {
    root.querySelectorAll('[data-truco-name]').forEach(input => input.oninput = () => { trucoSetupDraft.names[Number(input.dataset.trucoName)] = input.value; });
    find('truco-target').oninput = event => { trucoSetupDraft.target = event.target.value; };
    find('truco-setup-form').onsubmit = event => {
      event.preventDefault();
      if (!trucoScore.configure(trucoSetupDraft.names, Number(trucoSetupDraft.target))) {
        error('Enter two distinct names and a positive whole-number target.', 'Ingresa dos nombres distintos y una meta entera positiva.'); return;
      }
      trucoSetupDraft = null; changed('truco-award-label');
    };
  }
  const game = trucoScore.snapshot();
  if (find('truco-edit-setup')) find('truco-edit-setup').onclick = () => {
    trucoSetupDraft = {names:[...game.names], target:String(game.target)}; refreshTrucoScore('truco-target');
  };
  if (find('truco-award-label')) find('truco-award-label').onchange = event => { trucoAwardDraft.label = event.target.value; };
  const award = (side, points, focus) => {
    if (!trucoScore.award(side, points, trucoAwardDraft.label)) {
      error('Use positive whole-number points within the safe numeric range. New awards stop when a side wins.', 'Usa puntos enteros positivos dentro del rango numérico seguro. No se admiten nuevas anotaciones cuando un lado gana.'); return;
    }
    trucoAwardDraft.points[side] = '';
    changed(trucoScore.snapshot().finished ? 'truco-score-heading' : focus);
  };
  root.querySelectorAll('[data-truco-award]').forEach(button => button.onclick = () => award(Number(button.dataset.trucoAward), Number(button.dataset.points), button.id));
  root.querySelectorAll('[data-truco-custom]').forEach(form => {
    const side = Number(form.dataset.trucoCustom);
    find(`truco-custom-${side}`).oninput = event => { trucoAwardDraft.points[side] = event.target.value; };
    form.onsubmit = event => { event.preventDefault(); award(side, Number(trucoAwardDraft.points[side]), `truco-custom-${side}`); };
  });
  root.querySelectorAll('[data-truco-correct]').forEach(button => button.onclick = () => {
    const index = Number(button.dataset.trucoCorrect), entry = game.entries[index];
    trucoEditDraft = {index, side:String(entry.side), points:String(entry.points), label:entry.label};
    trucoScoreMessage = null; refreshTrucoScore('truco-edit-points');
  });
  if (find('truco-correction-form')) {
    const draft = trucoEditDraft;
    find('truco-edit-side').onchange = event => { draft.side = event.target.value; };
    find('truco-edit-points').oninput = event => { draft.points = event.target.value; };
    find('truco-edit-label').onchange = event => { draft.label = event.target.value; };
    find('truco-correction-form').onsubmit = event => {
      event.preventDefault();
      if (!trucoScore.correct(draft.index, Number(draft.side), Number(draft.points), draft.label)) {
        error('Use positive whole-number points within the safe numeric range.', 'Usa puntos enteros positivos dentro del rango numérico seguro.'); return;
      }
      trucoEditDraft = null; changed(`truco-correct-${draft.index}`);
    };
    find('truco-cancel-correction').onclick = () => { trucoEditDraft = null; changed(`truco-correct-${draft.index}`); };
  }
  root.querySelectorAll('[data-truco-delete]').forEach(button => button.onclick = () => { trucoScore.delete(Number(button.dataset.trucoDelete)); historyChanged(); });
  if (find('truco-undo')) find('truco-undo').onclick = () => { trucoScore.undo(); historyChanged(); };
  root.querySelectorAll('[data-truco-rename]').forEach(input => input.oninput = () => {
    if (!trucoRenameDraft) trucoRenameDraft = [...game.names];
    trucoRenameDraft[Number(input.dataset.trucoRename)] = input.value;
  });
  if (find('truco-rename-form')) find('truco-rename-form').onsubmit = event => {
    event.preventDefault();
    if (!trucoScore.rename([...root.querySelectorAll('[data-truco-rename]')].map(input => input.value))) {
      error('Enter two distinct, non-empty names.', 'Ingresa dos nombres distintos, sin dejar ninguno vacío.'); return;
    }
    trucoRenameDraft = null; changed('truco-score-heading');
  };
  if (find('truco-new-game')) find('truco-new-game').onclick = () => {
    if (game.entries.length && !window.confirm(tr('Clear this history and start a new game?', '¿Borrar este historial e iniciar una partida nueva?'))) return;
    trucoScore.newGame(); trucoSetupDraft = null; trucoEditDraft = null; trucoRenameDraft = null;
    trucoAwardDraft = {label:'', points:['', '']}; changed('truco-target');
  };
}
