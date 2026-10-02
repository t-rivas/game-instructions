'use strict';

// Mogel Motte edition linked in the guide: 71 hand cards + one unscored Guard Bug.
const MOTH_DECK = Object.freeze([43, 20, 8]);
function mothPenalty(counts) {
  return counts.reduce((sum, count, i) => sum + count * [1, 5, 10][i], 0);
}

function mothCount(value) {
  if (typeof value === 'string') {
    if (!/^\d+$/.test(value)) throw new Error('counts');
    value = Number(value);
  }
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('counts');
  return value;
}

function mothNames(names) {
  if (!Array.isArray(names) || names.length < 3 || names.length > 5) throw new Error('players');
  const players = Array.from(names);
  if (players.some(name => typeof name !== 'string' || !name.trim())) throw new Error('names');
  if (new Set(players.map(name => name.trim().toLowerCase())).size !== players.length) throw new Error('names');
  return players.map(name => name.trim());
}

function createMothGame(names) {
  return {players: mothNames(names), rounds: [], locked: false};
}

function updateMothPlayers(game, names) {
  const players = mothNames(names);
  if (game.locked && players.length !== game.players.length) throw new Error('locked');
  game.players = players;
}

function scoreMothRound(players, out, entries) {
  if (!Number.isInteger(out) || out < 0 || out >= players) throw new Error('out');
  if (!Array.isArray(entries) || entries.length !== players) throw new Error('players');
  const scored = Array.from(entries, (entry, i) => {
    // The empty hand is always zero, even when a previous draft contained cards.
    if (i === out) return {counts: [0, 0, 0], total: 0};
    if (!Array.isArray(entry) || entry.length !== 3) throw new Error('counts');
    const counts = Array.from(entry, mothCount);
    return {counts, total: mothPenalty(counts)};
  });
  if (MOTH_DECK.some((limit, category) => scored.reduce((sum, entry) => sum + entry.counts[category], 0) > limit)) throw new Error('deck');
  return {out, entries: scored};
}

function saveMothRound(game, round, out, entries, correction = false) {
  if (!Number.isInteger(round) || round < 1 || round > game.players.length ||
      (correction ? round > game.rounds.length : round !== game.rounds.length + 1)) throw new Error('round');
  const scored = scoreMothRound(game.players.length, out, entries);
  game.rounds[round - 1] = {round, ...scored};
  game.locked = true;
}

function undoMothRound(game) {
  return game.rounds.pop();
}

function mothGameSummary(game) {
  const totals = game.players.map((_, i) => game.rounds.reduce((sum, round) => sum + round.entries[i].total, 0));
  const finished = game.rounds.length === game.players.length;
  const lowest = Math.min(...totals);
  const standings = totals.map((total, player) => ({player, total})).sort((a, b) => a.total - b.total || a.player - b.player);
  return {totals, standings, finished, winners: finished ? standings.filter(row => row.total === lowest).map(row => row.player) : []};
}

let mothScoreGame = null;
let mothScoreSetup = {count: 3, names: Array(5).fill('')};
let mothScoreDraft = null;
let mothScorePending = null;
let mothScorePreview = null;
let mothScoreNotice = '';

let mothStorageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem('tablefolk-moth-score-v1') || 'null');
  if (saved?.version === 1 && saved.game) {
    const game = createMothGame(saved.game.players);
    if (!Array.isArray(saved.game.rounds) || saved.game.rounds.length > game.players.length) throw new Error('rounds');
    for (const row of saved.game.rounds) saveMothRound(game, row.round, row.out, row.entries.map(entry => entry.counts));
    game.locked = game.locked || saved.game.locked === true;
    mothScoreGame = game;
    mothScoreSetup = {count:game.players.length, names:[...game.players, ...Array(5 - game.players.length).fill('')]};
    mothScoreDraft = mothGameSummary(game).finished ? null : mothRoundDraft();
  }
} catch { mothStorageOK = false; }
// Invalid draft storage cannot discard already validated rounds.
try {
 const saved=JSON.parse(localStorage.getItem('tablefolk-moth-score-v1')||'null');
 if(saved?.version===1){
  if(matchesScoreDraft(saved.setup,{count:0,names:Array(5).fill('')})&&Number.isInteger(saved.setup.count)&&saved.setup.count>=3&&saved.setup.count<=5)mothScoreSetup=saved.setup;
  if(mothScoreGame){
   const valid=draft=>matchesScoreDraft(draft,{round:0,out:'',entries:Array.from({length:mothScoreGame.players.length},()=>['','',''])})&&Number.isInteger(draft.round)&&draft.round>=1&&draft.round<=Math.min(mothScoreGame.rounds.length+1,mothScoreGame.players.length);
   if(valid(saved.draft))mothScoreDraft=saved.draft;
   if(valid(saved.pending)&&saved.pending.round===mothScoreGame.rounds.length+1)mothScorePending=saved.pending;
  }
 }
}catch{}
function persistMothScore() {
  try { localStorage.setItem('tablefolk-moth-score-v1', JSON.stringify({version:1, game:mothScoreGame, setup:mothScoreSetup, draft:mothScoreDraft, pending:mothScorePending})); mothStorageOK = true; }
  catch { mothStorageOK = false; }
}

function mothRoundDraft(row) {
  return row ? {round: row.round, out: String(row.out), entries: row.entries.map(entry => entry.counts.map(String))} :
    {round: mothScoreGame.rounds.length + 1, out: '', entries: mothScoreGame.players.map(() => ['0', '0', '0'])};
}

function mothScoreError(code) {
  return ({players: tr('Use 3–5 players.', 'Usa de 3 a 5 jugadores.'),
    names: tr('Enter a different name for every player.', 'Ingresa un nombre distinto para cada jugador.'),
    locked: tr('Player membership is locked. Names can still change.', 'Los participantes quedan fijos. Puedes cambiar sus nombres.'),
    out: tr('Select the player who emptied their hand.', 'Elige quién vació su mano.'),
    counts: tr('Enter an explicit nonnegative whole number for every count, including zero.', 'Ingresa un número entero no negativo en cada campo, incluido el cero.'),
    deck: tr('Across all hands, counts cannot exceed 43 number cards, 20 action cards or 8 moths.', 'Entre todas las manos no puede haber más de 43 cartas numéricas, 20 especiales u 8 polillas.'),
    round: tr('This round is already saved or is outside the game’s round limit.', 'Esta ronda ya está guardada o supera el límite de la partida.')})[code] || tr('Check the round entries.', 'Revisa los datos de la ronda.');
}

function mothCategoryLabels() {
  return [tr('Number cards × 1', 'Numéricas × 1'), tr('Action cards × 5', 'Especiales × 5'), tr('Moths × 10', 'Polillas × 10')];
}

function mothPlayerForm() {
  const game = mothScoreGame;
  return `<form id="moth-player-form"><label>${tr('Players / rounds', 'Jugadores / rondas')}<select id="moth-player-count"${game?.locked ? ' disabled' : ''}>${[3,4,5].map(n => `<option value="${n}"${n === mothScoreSetup.count ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <div class="moth-name-grid">${mothScoreSetup.names.slice(0, mothScoreSetup.count).map((name, i) => `<label>${tr('Player', 'Jugador')} ${i+1}<input id="moth-name-${i}" data-moth-name="${i}" type="text" required autocomplete="off" value="${escapeHTML(name)}"></label>`).join('')}</div>
    <button type="submit">${game ? tr('Save players / names', 'Guardar jugadores / nombres') : tr('Start game', 'Iniciar partida')}</button></form>`;
}

function mothScoreRoundForm() {
  const draft = mothScoreDraft;
  if (!draft) return '';
  const editing = draft.round <= mothScoreGame.rounds.length;
  return `<form id="moth-round-form" novalidate aria-labelledby="moth-round-heading"><h3 id="moth-round-heading" tabindex="-1">${editing ? tr('Edit round', 'Editar ronda') : tr('Round', 'Ronda')} ${draft.round} / ${mothScoreGame.players.length}</h3>
    <label>${tr('Who emptied their hand?', '¿Quién vació su mano?')}<select id="moth-out" required><option value="">${tr('Choose a player', 'Elige un jugador')}</option>${mothScoreGame.players.map((name, i) => `<option value="${i}"${draft.out === String(i) ? ' selected' : ''}>${escapeHTML(name)}</option>`).join('')}</select></label>
    <div class="moth-entry-grid">${mothScoreGame.players.map((name, i) => `<fieldset><legend>${escapeHTML(name)}</legend>${draft.out === String(i) ? `<p class="moth-out-zero">${tr('Empty hand · 0 penalty points', 'Mano vacía · 0 puntos de penalización')}</p>` : `<div class="moth-fields">${mothCategoryLabels().map((label, category) => `<label>${label}<input id="moth-count-${i}-${category}" data-moth-player="${i}" data-moth-category="${category}" type="number" inputmode="numeric" min="0" max="${MOTH_DECK[category]}" step="1" required value="${escapeHTML(draft.entries[i][category])}" aria-describedby="moth-deck-note"></label>`).join('')}</div><div class="moth-player-total" id="moth-player-total-${i}" aria-live="polite"></div><button type="button" data-moth-zero="${i}">${tr('Fill empty fields with 0', 'Completar campos vacíos con 0')}</button>`}</fieldset>`).join('')}</div>
    <div id="moth-round-preview" aria-live="polite">${mothScorePreview ? mothPreviewHTML() : ''}</div>
    <p id="moth-confirm-note" class="moth-hint">${tr('All counts start at 0. Change only the categories with cards remaining. The preview updates automatically; check the penalties above, then confirm to save.', 'Todas las cantidades empiezan en 0. Cambia solo las categorías con cartas restantes. La vista previa se actualiza automáticamente; revisa las penalizaciones de arriba y confirma para guardar.')}</p>
    <p id="moth-confirm-status" class="moth-hint" role="status"></p>
    <div class="moth-actions"><button id="moth-preview-round" type="submit">${tr('Check entries', 'Revisar datos')}</button><button id="moth-save-round" type="button" aria-describedby="moth-confirm-note moth-confirm-status"${mothScorePreview ? '' : ' disabled'}>${editing ? tr('Confirm correction', 'Confirmar corrección') : tr('Confirm round', 'Confirmar ronda')}</button>${editing ? `<button id="moth-edit-cancel" type="button">${tr('Cancel edit', 'Cancelar edición')}</button>` : ''}</div></form>`;
}

function mothPreviewHTML() {
  const totals = mothGameSummary(mothScoreGame).totals;
  const previous = mothScoreGame.rounds[mothScoreDraft.round - 1];
  return `<h3>${tr('Round preview', 'Vista previa de la ronda')}</h3><ul class="moth-preview-list">${mothScorePreview.entries.map((entry, i) => `<li><strong>${escapeHTML(mothScoreGame.players[i])}</strong><span>${entry.counts[0]} × 1 + ${entry.counts[1]} × 5 + ${entry.counts[2]} × 10 = <b data-moth-preview="${i}">${entry.total}</b> · ${tr('New total', 'Nuevo total')}: ${totals[i] - (previous?.entries[i].total || 0) + entry.total}</span></li>`).join('')}</ul>`;
}

function mothScoreHistory() {
  const running = mothScoreGame.players.map(() => 0);
  return `<div class="moth-history"><h3>${tr('Editable round history', 'Historial de rondas editable')}</h3>${mothScoreGame.rounds.map(row => `<details id="moth-history-${row.round}"><summary>${tr('Round', 'Ronda')} ${row.round} · ${tr('Empty hand', 'Mano vacía')}: ${escapeHTML(mothScoreGame.players[row.out])}</summary>
    <div class="moth-table-scroll" tabindex="0" role="region" aria-label="${tr('Round', 'Ronda')} ${row.round}"><table><caption>${tr('Remaining cards, penalties and cumulative totals', 'Cartas restantes, penalizaciones y totales acumulados')}</caption><thead><tr>${[tr('Player', 'Jugador'), ...mothCategoryLabels(), tr('Penalty', 'Penalización'), tr('Cumulative total', 'Total acumulado')].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${row.entries.map((entry, i) => {
      running[i] += entry.total;
      return `<tr><th scope="row">${escapeHTML(mothScoreGame.players[i])}</th>${[...entry.counts, entry.total, running[i]].map(value => `<td>${value}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table></div><button type="button" data-moth-edit="${row.round}">${tr('Edit round', 'Editar ronda')} ${row.round}</button></details>`).join('')}</div>`;
}

function mothScoreView() {
  const game = mothScoreGame;
  const summary = game && mothGameSummary(game);
  return `<section id="moth-score" class="moth-score" aria-labelledby="moth-score-heading"><div class="scoreboard-heading"><h2 id="moth-score-heading" tabindex="-1">${tr('La Polilla · Scoreboard', 'La Polilla · Planilla de puntos')}</h2>${game ? `<button id="moth-new-game" type="button">${tr('Reset · edit players', 'Reiniciar · editar jugadores')}</button>` : ''}</div>
    <p class="moth-hint">${tr('Count the cards left in each hand. Number cards: 1 point · action cards: 5 · moths: 10. Lowest total wins.', 'Cuenta las cartas que quedan en cada mano. Numéricas: 1 punto · especiales: 5 · polillas: 10. Gana el menor total.')}</p><details class="score-help" id="moth-count-help"><summary>${tr('Which cards do I count?', '¿Qué cartas cuento?')}</summary><p id="moth-deck-note" class="moth-hint">${tr('Count only cards remaining in hands: up to 43 number cards, 20 action cards (5 each spider, mosquito, cockroach and ant), and 8 moths across all players. Exclude the Guard Bug, discarded and hidden cards. You do not need to account for the full deck.', 'Cuenta solo las cartas que quedan en las manos: hasta 43 numéricas, 20 especiales (5 de cada una: araña, mosquito, cucaracha y hormiga) y 8 polillas entre todos. Excluye la Chinche Guardiana, las cartas descartadas y las escondidas. No necesitas contabilizar todo el mazo.')}</p></details>
    <p id="moth-score-notice" role="alert" tabindex="-1">${mothScoreNotice ? mothScoreError(mothScoreNotice) : ''}</p>
    ${game ? `<p id="moth-game-result" role="status">${summary.finished ? `${summary.winners.length > 1 ? tr('Joint winners', 'Ganadores conjuntos') : tr('Winner', 'Ganador')}: ${escapeHTML(summary.winners.map(i => game.players[i]).join(', '))} · ${Math.min(...summary.totals)} ${tr('penalty points.', 'puntos de penalización.')}` : tr('Lowest total wins after the required rounds. Equal lowest totals share victory.', 'Gana el menor total al completar las rondas. Quienes empaten con el menor total comparten la victoria.')}</p>
      <p id="moth-rounds-completed">${game.rounds.length} / ${game.players.length} ${tr('rounds completed', 'rondas completadas')}</p>
      <h3>${tr('Standings · lowest total first', 'Clasificación · menor total primero')}</h3><ol class="moth-standings">${summary.standings.map(row => `<li data-moth-standing="${row.player}"><span>${escapeHTML(game.players[row.player])}</span><strong data-moth-total="${row.player}">${row.total}</strong></li>`).join('')}</ol>
      <details id="moth-players"><summary>${game.locked ? tr('Edit names', 'Editar nombres') : tr('Edit players / names', 'Editar jugadores / nombres')}</summary>${mothPlayerForm()}</details>
      ${mothScoreRoundForm()}${mothScoreHistory()}${game.rounds.length ? `<div class="moth-actions"><button id="moth-undo-round" type="button">${tr('Undo last round', 'Deshacer última ronda')}</button></div>` : ''}` : mothPlayerForm()}
    ${mothStorageOK ? '' : `<p role="status">${tr('Local saving is unavailable. Keep this page open to retain your scores.', 'No se puede guardar en este dispositivo. Mantén esta página abierta para conservar los puntos.')}</p>`}<p class="moth-hint">${tr('Play one round per player. Membership locks after the first saved round; names stay editable. Scores and drafts stay when switching guides or languages. Scores and unfinished entries are restored when you reload on this device.', 'Jueguen una ronda por participante. Los participantes quedan fijos tras guardar la primera ronda; los nombres se pueden editar. Los puntos y los borradores se conservan al cambiar de guía o idioma. Los puntos y los datos sin guardar se recuperan al recargar en este dispositivo.')}</p></section>`;
}

function bindMothScore() {
  const root = document.getElementById('moth-score');
  if (!root) return;
  bindScoreRecovery(root, persistMothScore);
  const redraw = (focus = 'moth-round-heading') => {persistMothScore(); refreshScorePanel('moth-score', mothScoreView, bindMothScore, focus);};
  const notice = code => {mothScoreNotice = code; document.getElementById('moth-score-notice').textContent = code ? mothScoreError(code) : '';};
  const count = document.getElementById('moth-player-count');
  count.onchange = () => {mothScoreSetup.count = Number(count.value); redraw('moth-player-count');};
  root.querySelectorAll('[data-moth-name]').forEach(input => {input.oninput = () => {mothScoreSetup.names[Number(input.dataset.mothName)] = input.value;};});
  document.getElementById('moth-player-form').onsubmit = event => {
    event.preventDefault();
    try {
      const names = mothScoreSetup.names.slice(0, mothScoreSetup.count);
      if (mothScoreGame) {
        updateMothPlayers(mothScoreGame, names);
        if (!mothScoreGame.locked) mothScoreDraft = mothRoundDraft();
      } else {mothScoreGame = createMothGame(names); mothScoreDraft = mothRoundDraft();}
      mothScorePreview = null; mothScoreNotice = ''; redraw();
    } catch (error) {notice(error.message);}
  };
  if (!mothScoreGame) return;
  const draft = mothScoreDraft;
  if (draft) {
    const confirm = document.getElementById('moth-save-round');
    const refreshPreview = (showError = false) => {
      if (draft !== mothScoreDraft || !root.isConnected) return false;
      const preview = document.getElementById('moth-round-preview');
      const status = document.getElementById('moth-confirm-status');
      try {
        mothScorePreview = scoreMothRound(mothScoreGame.players.length, draft.out === '' ? NaN : Number(draft.out), draft.entries);
        preview.innerHTML = mothPreviewHTML();
        confirm.disabled = false;
        status.textContent = tr('Ready to confirm. Review the penalties above.', 'Lista para confirmar. Revisa las penalizaciones de arriba.');
        notice('');
        return true;
      } catch (error) {
        mothScorePreview = null;
        preview.replaceChildren();
        confirm.disabled = true;
        status.textContent = mothScoreError(error.message);
        notice(showError ? error.message : '');
        return false;
      }
    };
    const refreshTotals = () => draft.entries.forEach((counts, i) => {
      const output = document.getElementById(`moth-player-total-${i}`);
      if (!output) return;
      try { output.textContent = tr('Penalty: ', 'Penalización: ') + mothPenalty(counts.map(mothCount)); }
      catch { output.textContent = tr('Enter all three counts, including 0.', 'Completa las tres cantidades, incluido el 0.'); }
    });
    refreshTotals(); refreshPreview();
    root.querySelectorAll('[data-moth-zero]').forEach(button => button.onclick = () => {
      const i = Number(button.dataset.mothZero);
      draft.entries[i] = draft.entries[i].map(value => value === '' ? '0' : value);
      draft.entries[i].forEach((value, category) => { document.getElementById(`moth-count-${i}-${category}`).value = value; });
      refreshTotals(); refreshPreview();
    });
    document.getElementById('moth-out').onchange = event => {draft.out = event.target.value; mothScorePreview = null; mothScoreNotice = ''; redraw('moth-out');};
    root.querySelectorAll('[data-moth-category]').forEach(input => {input.oninput = () => {
      draft.entries[Number(input.dataset.mothPlayer)][Number(input.dataset.mothCategory)] = input.value; refreshTotals(); refreshPreview();
    };});
    document.getElementById('moth-round-form').onsubmit = event => {
      event.preventDefault();
      if (draft !== mothScoreDraft) return;
      if (refreshPreview(true)) confirm.focus();
      else document.getElementById('moth-confirm-status').scrollIntoView({block: 'center', behavior: 'instant'});
    };
    confirm.addEventListener('click', () => {
      // A detached button/double click cannot save a new round using an old preview.
      if (!confirm.isConnected || draft !== mothScoreDraft || !mothScorePreview) return;
      const preview = mothScorePreview;
      try {
        const editing = draft.round <= mothScoreGame.rounds.length;
        const firstSave = !mothScoreGame.locked;
        saveMothRound(mothScoreGame, draft.round, preview.out, preview.entries.map(entry => entry.counts), editing);
        // Discard any uncommitted membership proposal when the actual roster locks.
        if (firstSave) mothScoreSetup = {count: mothScoreGame.players.length, names: [...mothScoreGame.players, ...Array(5 - mothScoreGame.players.length).fill('')]};
        mothScoreDraft = editing && mothScorePending ? mothScorePending : mothGameSummary(mothScoreGame).finished ? null : mothRoundDraft();
        mothScorePending = null; mothScorePreview = null; mothScoreNotice = ''; redraw(mothScoreDraft ? 'moth-round-heading' : 'moth-score-heading');
      } catch (error) {notice(error.message);}
    });
    document.getElementById('moth-edit-cancel')?.addEventListener('click', () => {
      mothScoreDraft = mothScorePending || (mothGameSummary(mothScoreGame).finished ? null : mothRoundDraft());
      mothScorePending = null; mothScorePreview = null; mothScoreNotice = ''; redraw();
    });
  }
  root.querySelectorAll('[data-moth-edit]').forEach(button => {button.onclick = () => {
    if (mothScoreDraft && mothScoreDraft.round > mothScoreGame.rounds.length) mothScorePending = mothScoreDraft;
    mothScoreDraft = mothRoundDraft(mothScoreGame.rounds[Number(button.dataset.mothEdit) - 1]);
    mothScorePreview = null; mothScoreNotice = ''; redraw(); document.getElementById('moth-round-heading').scrollIntoView({block: 'center', behavior: 'instant'});
  };});
  document.getElementById('moth-undo-round')?.addEventListener('click', () => {
    mothScoreDraft = mothRoundDraft(undoMothRound(mothScoreGame));
    mothScorePending = null; mothScorePreview = null; mothScoreNotice = ''; redraw();
  });
  document.getElementById('moth-new-game').onclick = () => {
    if (!window.confirm(tr('Clear all penalties and rounds and return to player setup?', '¿Borrar todas las penalizaciones y rondas y volver a configurar los jugadores?'))) return;
    mothScoreSetup = {count: mothScoreGame.players.length, names: [...mothScoreGame.players, ...Array(5 - mothScoreGame.players.length).fill('')]};
    mothScoreGame = null; mothScoreDraft = null; mothScorePending = null; mothScorePreview = null; mothScoreNotice = ''; redraw('moth-player-count'); document.getElementById('moth-score-heading').scrollIntoView({block: 'center', behavior: 'instant'});
  };
}
