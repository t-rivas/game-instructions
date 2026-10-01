'use strict';

// Classic scoring only. Card effects and eligibility are decided at the table.
function scoreSkullEntry(entry, cards) {
  if (!Number.isInteger(cards) || cards < 1 || cards > 10) throw new Error('cards');
  for (const key of ['bid', 'tricks']) {
    if (!Number.isInteger(entry[key]) || entry[key] < 0 || entry[key] > cards) throw new Error('bid-tricks');
  }
  for (const key of ['bonus', 'adjustment']) {
    if (!Number.isSafeInteger(entry[key])) throw new Error('signed-total');
  }
  const explanation = String(entry.explanation || '').trim();
  if (entry.adjustment !== 0 && !explanation) throw new Error('explanation');
  const exact = entry.bid === entry.tricks;
  const base = entry.bid === 0 ? (exact ? 10 : -10) * cards :
    exact ? 20 * entry.tricks : -10 * Math.abs(entry.bid - entry.tricks);
  const appliedBonus = exact ? entry.bonus : 0;
  const total = base + appliedBonus + entry.adjustment;
  if (!Number.isSafeInteger(total)) throw new Error('signed-total');
  return {...entry, explanation, exact, base, appliedBonus, total};
}

function createSkullGame(names, expansion) {
  if (typeof expansion !== 'boolean' || !Array.isArray(names) || names.length < 2 || names.length > (expansion ? 9 : 8)) throw new Error('players');
  if (names.some(name => typeof name !== 'string' || !name.trim())) throw new Error('names');
  // Freeze setup separately: the guide's expansion switch cannot change this game.
  return {setup: Object.freeze({mode: 'classic', expansion, players: Object.freeze(names.map(name => name.trim()))}), rounds: []};
}

function saveSkullRound(game, round, cards, entries) {
  if (!Number.isInteger(round) || round < 1 || round > 10 || round > game.rounds.length + 1) throw new Error('round');
  if (!Array.isArray(entries) || entries.length !== game.setup.players.length) throw new Error('players');
  const scored = entries.map(entry => scoreSkullEntry(entry, cards));
  // Validate first so an invalid correction leaves all saved scores intact.
  const rounds = game.rounds.slice();
  rounds[round - 1] = {round, cards, entries: scored};
  const totals = game.setup.players.map((_, i) => rounds.reduce((sum, row) => sum + row.entries[i].total, 0));
  if (!totals.every(Number.isSafeInteger)) throw new Error('signed-total');
  game.rounds = rounds;
}

function skullGameSummary(game) {
  const totals = game.setup.players.map((_, i) => game.rounds.reduce((sum, row) => sum + row.entries[i].total, 0));
  const finished = game.rounds.length === 10;
  const highest = Math.max(...totals);
  return {totals, finished, winners: finished ? totals.flatMap((total, i) => total === highest ? [i] : []) : []};
}

let skullScoreGame = null;
let skullScoreSetup = {count: 2, names: Array(9).fill('')};
let skullScoreDraft = null;
let skullScorePending = null;
let skullScoreNotice = '';

function skullRoundDraft() {
  const round = skullScoreGame.rounds.length + 1;
  const last = skullScoreGame.rounds.at(-1);
  return {round, cards: String(last && last.cards < round - 1 ? last.cards : round), entries: skullScoreGame.setup.players.map(() => ({bid: '', tricks: '', bonus: '0', adjustment: '0', explanation: ''}))};
}

function skullScoreError(code) {
  return ({cards: tr('Enter 1–10 actual cards dealt per player.', 'Ingresa entre 1 y 10 cartas repartidas por persona.'),
    'bid-tricks': tr('Final bids and tricks won must be whole numbers from zero to the cards dealt.', 'Las apuestas finales y las bazas ganadas deben ser números enteros entre cero y las cartas repartidas.'),
    'signed-total': tr('Enter whole bonus and adjustment totals within the safe numeric range.', 'Ingresa bonificaciones y ajustes enteros dentro del rango numérico seguro.'),
    explanation: tr('Explain every nonzero manual adjustment.', 'Explica cada ajuste manual distinto de cero.'),
    players: tr('Use 2–8 players in the base game, or 2–9 with the Expansion Pack.', 'Usa de 2 a 8 jugadores en la caja base, o de 2 a 9 con el paquete de expansión.'),
    names: tr('Enter a name for every player.', 'Ingresa un nombre para cada jugador.'),
    round: tr('Enter the next round or correct a saved round, through round 10.', 'Ingresa la siguiente ronda o corrige una guardada, hasta la ronda 10.')})[code] || tr('Check the round entries.', 'Revisa los datos de la ronda.');
}

function skullScoreBreakdown(score) {
  return `<dl class="skull-breakdown">${[
    [tr('Base score', 'Puntos base'), score.base],
    [tr('Applied bonuses', 'Bonificaciones aplicadas'), score.appliedBonus],
    [tr('Adjustment', 'Ajuste'), score.adjustment],
    [tr('Round total', 'Total de ronda'), score.total]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function skullScoreRoundForm() {
  const draft = skullScoreDraft;
  if (!draft) return '';
  const editing = draft.round <= skullScoreGame.rounds.length;
  return `<form id="skull-round-form" aria-labelledby="skull-round-heading">
    <h3 id="skull-round-heading" tabindex="-1">${editing ? tr('Edit round', 'Editar ronda') : tr('Round', 'Ronda')} ${draft.round} / 10</h3>
    <label class="skull-cards-label">${tr('Actual cards dealt per player', 'Cartas realmente repartidas por persona')}<input id="skull-cards" type="number" min="1" max="10" step="1" required value="${escapeHTML(draft.cards)}" aria-describedby="skull-deal-note"></label>
    <p id="skull-deal-note" class="skull-hint">${tr('Repeat the largest hand size your deck supports when needed. Enter the actual deal; zero bids use this value, not the round number. Trick totals need not match: Graybeard and destroyed tricks can account for the difference.', 'Repite el mayor tamaño de mano que permita el mazo cuando sea necesario. Ingresa el reparto real: las apuestas cero usan este valor, no el número de ronda. Las bazas totales no tienen que coincidir: Barbagris y las bazas destruidas pueden explicar la diferencia.')}</p>
    <p id="skull-bonus-note" class="skull-hint">${tr('Manually enter the total of eligible capture bonuses, including signed expansion effects. Bonuses apply only to exact bids. Use the separate signed adjustment for optional powers or documented exceptions and explain every nonzero adjustment. These effects are not calculated automatically.', 'Ingresa manualmente el total de bonificaciones por capturas elegibles, incluidos efectos de expansión con signo positivo o negativo. Solo se aplican al acertar la apuesta. Usa el ajuste con signo por separado para poderes opcionales o excepciones documentadas y explica cada ajuste distinto de cero. Estos efectos no se calculan automáticamente.')}</p>
    <div class="skull-entry-grid">${draft.entries.map((entry, i) => `<fieldset class="skull-player-entry"><legend>${escapeHTML(skullScoreGame.setup.players[i])}</legend>
      <div class="skull-fields">${[
        ['bid', tr('Final bid', 'Apuesta final'), 'min="0" max="'+escapeHTML(draft.cards)+'"'],
        ['tricks', tr('Tricks won', 'Bazas ganadas'), 'min="0" max="'+escapeHTML(draft.cards)+'"'],
        ['bonus', tr('Eligible capture-bonus total', 'Total de bonificaciones elegibles'), ''],
        ['adjustment', tr('Manual adjustment (signed)', 'Ajuste manual (con signo)'), '']
      ].map(([key, label, limits]) => `<label>${label}<input id="skull-${key}-${i}" data-skull-field="${key}" data-skull-player="${i}" type="number" ${limits} step="1" required value="${escapeHTML(entry[key])}"${key==='bonus'||key==='adjustment'?' aria-describedby="skull-bonus-note"':''}></label>`).join('')}</div>
      <label>${tr('Adjustment explanation', 'Explicación del ajuste')}<input id="skull-explanation-${i}" data-skull-field="explanation" data-skull-player="${i}" type="text" value="${escapeHTML(entry.explanation)}"${Number(entry.adjustment)!==0?' required':''}></label>
      <div id="skull-preview-${i}"></div>
    </fieldset>`).join('')}</div>
    <div class="skull-actions"><button type="submit">${editing ? tr('Save correction', 'Guardar corrección') : tr('Save round', 'Guardar ronda')}</button>${editing ? `<button type="button" id="skull-edit-cancel">${tr('Cancel edit', 'Cancelar edición')}</button>` : ''}</div>
  </form>`;
}

function skullScoreHistory() {
  const running = skullScoreGame.setup.players.map(() => 0);
  return `<div class="skull-history"><h3>${tr('Editable round history', 'Historial de rondas editable')}</h3>${skullScoreGame.rounds.map(row => `<details id="skull-history-${row.round}"><summary>${tr('Round', 'Ronda')} ${row.round} · ${row.cards} ${tr('cards dealt', 'cartas repartidas')}</summary>
    <div class="skull-table-scroll" tabindex="0" role="region" aria-label="${tr('Round', 'Ronda')} ${row.round}"><table><caption>${tr('Scores and cumulative totals after this round', 'Puntos y totales acumulados después de esta ronda')}</caption><thead><tr>${[tr('Player', 'Jugador'),tr('Final bid', 'Apuesta final'),tr('Tricks won', 'Bazas ganadas'),tr('Base score', 'Puntos base'),tr('Entered bonuses', 'Bonificaciones ingresadas'),tr('Applied bonuses', 'Bonificaciones aplicadas'),tr('Adjustment', 'Ajuste'),tr('Explanation', 'Explicación'),tr('Round total', 'Total de ronda'),tr('Cumulative total', 'Total acumulado')].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${row.entries.map((entry, i) => {
      running[i] += entry.total;
      return `<tr><th scope="row">${escapeHTML(skullScoreGame.setup.players[i])}</th>${[entry.bid, entry.tricks, entry.base, entry.bonus, entry.appliedBonus, entry.adjustment, entry.explanation || '—', entry.total, running[i]].map(value => `<td>${escapeHTML(value)}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table></div><button type="button" data-skull-edit="${row.round}">${tr('Edit round', 'Editar ronda')} ${row.round}</button></details>`).join('')}</div>`;
}

function skullScoreView() {
  let body;
  if (!skullScoreGame) {
    const max = state.skullExpansion ? 9 : 8;
    skullScoreSetup.count = Math.min(skullScoreSetup.count, max);
    body = `<form id="skull-score-setup"><p>${tr('New game uses the current guide setting:', 'La nueva partida usa la opción actual de la guía:')} <strong>${state.skullExpansion ? tr('Base + Expansion Pack', 'Caja base + paquete de expansión') : tr('Base box', 'Caja base')}</strong>.</p>
      <label>${tr('Scored players', 'Jugadores con puntuación')}<select id="skull-player-count">${Array.from({length: max - 1}, (_, i) => i + 2).map(n => `<option value="${n}"${n===skullScoreSetup.count?' selected':''}>${n}</option>`).join('')}</select></label>
      <div class="skull-name-grid">${skullScoreSetup.names.slice(0, skullScoreSetup.count).map((name, i) => `<label>${tr('Player', 'Jugador')} ${i+1}<input id="skull-name-${i}" data-skull-name="${i}" required type="text" value="${escapeHTML(name)}"></label>`).join('')}</div>
      <p class="skull-hint">${tr('With two players, Graybeard is not a scored player. The expansion setting is fixed when you start this game.', 'Con dos jugadores, Barbagris no recibe puntuación. La opción de expansión queda fija al iniciar esta partida.')}</p>
      <button type="submit">${tr('Start ten-round game', 'Iniciar partida de diez rondas')}</button></form>`;
  } else {
    const game = skullScoreGame;
    const summary = skullGameSummary(game);
    const winnerNames = summary.winners.map(i => game.setup.players[i]).join(', ');
    body = `<p id="skull-game-edition">${tr('This game:', 'Esta partida:')} <strong>${game.setup.expansion ? tr('Base + Expansion Pack', 'Caja base + paquete de expansión') : tr('Base box', 'Caja base')}</strong> · ${game.setup.players.length} ${tr('scored players', 'jugadores con puntuación')}. ${tr('Guide switches do not change this game.', 'Los cambios de la guía no cambian esta partida.')}</p>
      <p id="skull-game-result" role="status">${summary.finished ? `${summary.winners.length > 1 ? tr('Joint winners', 'Ganadores conjuntos') : tr('Winner', 'Ganador')}: ${escapeHTML(winnerNames)} · ${Math.max(...summary.totals)} ${tr('points after round 10.', 'puntos tras la ronda 10.')}` : `${game.rounds.length} / 10 ${tr('rounds saved. Highest total after round 10 wins; tied leaders win jointly.', 'rondas guardadas. Gana el mayor total tras la ronda 10; quienes empaten arriba ganan conjuntamente.')}`}</p>
      <h3>${tr('Cumulative totals', 'Totales acumulados')}</h3><ol class="skull-totals">${game.setup.players.map((name, i) => `<li><span>${escapeHTML(name)}</span><strong data-skull-total="${i}">${summary.totals[i]}</strong></li>`).join('')}</ol>
      ${skullScoreRoundForm()}${skullScoreHistory()}`;
  }
  return `<section id="skull-score" class="skull-score" aria-labelledby="skull-score-heading"><div class="scoreboard-heading"><h2 id="skull-score-heading" tabindex="-1">${tr('Score sheet · Classic Skull King', 'Planilla de puntos · Skull King clásico')}</h2>${skullScoreGame ? `<button id="skull-new-game" type="button">${tr('Reset · edit players', 'Reiniciar · editar jugadores')}</button>` : ''}</div>
    <p class="skull-hint">${tr('Supports classic scoring only. Rascal and Cannonball scoring are not supported.', 'Solo admite la puntuación clásica. No admite puntuación Rascal ni Cannonball.')}</p>
    <p id="skull-score-notice" role="alert">${skullScoreNotice ? skullScoreError(skullScoreNotice) : ''}</p>${body}
    <p class="skull-hint">${tr('Scores and unfinished entries stay when switching views or languages. Reloading clears this sheet.', 'Los puntos y los datos sin guardar se conservan al cambiar de vista o idioma. Recargar borra esta planilla.')}</p></section>`;
}

function skullDraftEntry(entry) {
  if (['bid', 'tricks', 'bonus', 'adjustment'].some(key => entry[key].trim() === '')) throw new Error('signed-total');
  return {bid: Number(entry.bid), tricks: Number(entry.tricks), bonus: Number(entry.bonus), adjustment: Number(entry.adjustment), explanation: entry.explanation};
}

function refreshSkullPreview() {
  if (!skullScoreDraft) return;
  skullScoreDraft.entries.forEach((entry, i) => {
    const explanation = document.getElementById(`skull-explanation-${i}`);
    explanation.required = Number(entry.adjustment) !== 0;
    explanation.setCustomValidity(explanation.required && !entry.explanation.trim() ? skullScoreError('explanation') : '');
    for (const key of ['bid', 'tricks']) document.getElementById(`skull-${key}-${i}`).max = skullScoreDraft.cards;
    const preview = document.getElementById(`skull-preview-${i}`);
    try { preview.innerHTML = skullScoreBreakdown(scoreSkullEntry(skullDraftEntry(entry), Number(skullScoreDraft.cards))); }
    catch { preview.textContent = tr('Complete valid entries to preview the score.', 'Completa los datos válidos para ver los puntos.'); }
  });
}

function bindSkullScore() {
  const root = document.getElementById('skull-score');
  if (!root) return;
  const redraw = (focus = 'skull-round-heading') => {render(true); document.getElementById(focus)?.focus({preventScroll: true});};
  const setup = document.getElementById('skull-score-setup');
  if (setup) {
    document.getElementById('skull-player-count').onchange = event => {skullScoreSetup.count = Number(event.target.value); redraw('skull-player-count');};
    root.querySelectorAll('[data-skull-name]').forEach(input => {input.oninput = () => {skullScoreSetup.names[Number(input.dataset.skullName)] = input.value;};});
    setup.onsubmit = event => {
      event.preventDefault();
      try {
        skullScoreGame = createSkullGame(skullScoreSetup.names.slice(0, skullScoreSetup.count), state.skullExpansion);
        skullScoreDraft = skullRoundDraft(); skullScorePending = null; skullScoreNotice = ''; redraw();
      } catch (error) {skullScoreNotice = error.message; redraw('skull-score-notice');}
    };
    return;
  }
  const form = document.getElementById('skull-round-form');
  if (form) {
    document.getElementById('skull-cards').oninput = event => {skullScoreDraft.cards = event.target.value; refreshSkullPreview();};
    root.querySelectorAll('[data-skull-field]').forEach(input => {input.oninput = () => {
      skullScoreDraft.entries[Number(input.dataset.skullPlayer)][input.dataset.skullField] = input.value; refreshSkullPreview();
    };});
    form.onsubmit = event => {
      event.preventDefault();
      try {
        const editing = skullScoreDraft.round <= skullScoreGame.rounds.length;
        saveSkullRound(skullScoreGame, skullScoreDraft.round, Number(skullScoreDraft.cards), skullScoreDraft.entries.map(skullDraftEntry));
        skullScoreDraft = editing && skullScorePending ? skullScorePending : skullScoreGame.rounds.length < 10 ? skullRoundDraft() : null;
        skullScorePending = null; skullScoreNotice = ''; redraw(skullScoreDraft ? 'skull-round-heading' : 'skull-score-heading');
      } catch (error) {skullScoreNotice = error.message; document.getElementById('skull-score-notice').textContent = skullScoreError(error.message);}
    };
    document.getElementById('skull-edit-cancel')?.addEventListener('click', () => {
      skullScoreDraft = skullScorePending || (skullScoreGame.rounds.length < 10 ? skullRoundDraft() : null);
      skullScorePending = null; skullScoreNotice = ''; redraw();
    });
    refreshSkullPreview();
  }
  root.querySelectorAll('[data-skull-edit]').forEach(button => {button.onclick = () => {
    if (skullScoreDraft && skullScoreDraft.round > skullScoreGame.rounds.length) skullScorePending = skullScoreDraft;
    const row = skullScoreGame.rounds[Number(button.dataset.skullEdit) - 1];
    skullScoreDraft = {round: row.round, cards: String(row.cards), entries: row.entries.map(entry => ({bid: String(entry.bid), tricks: String(entry.tricks), bonus: String(entry.bonus), adjustment: String(entry.adjustment), explanation: entry.explanation}))};
    skullScoreNotice = ''; redraw(); document.getElementById('skull-round-heading').scrollIntoView({block:'center', behavior:'instant'});
  };});
  document.getElementById('skull-new-game').onclick = () => {
    if (!window.confirm(tr('Clear all scores and rounds and return to player setup?', '¿Borrar todos los puntos y rondas y volver a configurar los jugadores?'))) return;
    skullScoreSetup = {count: skullScoreGame.setup.players.length, names: [...skullScoreGame.setup.players, ...Array(9 - skullScoreGame.setup.players.length).fill('')]};
    skullScoreGame = null; skullScoreDraft = null; skullScorePending = null; skullScoreNotice = ''; redraw('skull-player-count');
  };
}
