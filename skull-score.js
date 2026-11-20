'use strict';

const skullModes = {
  classic: ['Classic', 'Clásico', 'An exact positive bid earns 20 per trick. Miss it and lose 10 per trick off. A zero bid wins or loses 10 per card dealt.', 'Una apuesta positiva exacta suma 20 por baza. Si fallas, pierdes 10 por baza de diferencia. Apostar cero suma o resta 10 por carta repartida.'],
  rascal: ['Rascal', 'Rascal', 'Score 10 per card dealt for an exact bid, 5 per card if off by one, and zero otherwise. Ordinary capture bonuses follow the same full or half scale.', 'Suma 10 por carta repartida si aciertas, 5 por carta si fallas por una baza y cero en los demás casos. Las capturas normales también pueden valer la mitad.'],
  cannonball: ['Rascal with Cannonball', 'Rascal con Bala de cañón', 'After bidding each round, each player chooses Grapeshot (regular Rascal) or Cannonball (15 per card for an exact bid, zero for a miss).', 'Después de apostar en cada ronda, cada persona elige Metralla (Rascal normal) o Bala de cañón (15 por carta al acertar y cero al fallar).']
};

const skullCards = {
  color14: [10, 'Colored 14', '14 de color'],
  black14: [20, 'Black 14', '14 negro'],
  mermaid: [20, 'Pirate captures Mermaid', 'Pirata captura a Sirena'],
  pirate: [30, 'Skull King captures Pirate', 'Skull King captura a Pirata'],
  king: [40, 'Mermaid captures Skull King', 'Sirena captura a Skull King'],
  loot: [20, 'Loot alliance payout', 'Pago de alianza de Botín'],
  seven: [-5, 'Expansion 7', '7 de expansión', true],
  eight: [5, 'Expansion 8', '8 de expansión', true],
  con: [30, 'Mermaid or Skull King captures Con', 'Sirena o Skull King captura a Con', true],
  locker: [20, 'Sea monster removed by Davy Jones', 'Monstruo retirado por Davy Jones', true]
};

function skullCaptureRate(difference, grapeshot, keepCards) {
  if (difference === 0 || keepCards) return 1;
  return grapeshot && difference === 1 ? 0.5 : 0;
}

function scoreSkullEntry(entry, cards, setup = {mode: 'classic'}) {
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
  const difference = Math.abs(entry.bid - entry.tricks);
  const shot = entry.shot ?? 'grapeshot';
  if (!['grapeshot', 'cannonball'].includes(shot)) throw new Error('mode');
  const cannonball = setup.mode === 'cannonball' && shot === 'cannonball';
  const grapeshot = setup.mode !== 'classic' && !cannonball;
  let base;
  if (cannonball) base = exact ? 15 * cards : 0;
  else if (grapeshot) base = cards * 10 * skullCaptureRate(difference, true, false);
  else if (entry.bid === 0) base = (exact ? 10 : -10) * cards;
  else base = exact ? 20 * entry.tricks : -10 * difference;

  const captureRate = skullCaptureRate(difference, grapeshot, setup.keepCards);
  const exactRate = exact || setup.keepCards ? 1 : 0;
  const bounty = entry.bounty ?? 0;
  const wager = entry.wager ?? 0;
  if (!Number.isSafeInteger(bounty) || ![0, 10, 20].includes(wager)) throw new Error('signed-total');
  let captures = entry.bonus + bounty;
  let specials = 0;
  for (const [key, count] of Object.entries(entry.picks ?? {})) {
    if (!Object.hasOwn(skullCards, key) || !Number.isSafeInteger(count) || count < 0) throw new Error('signed-total');
    const [points, , , expansion] = skullCards[key];
    if (expansion && !setup.expansion && count) throw new Error('signed-total');
    if (expansion || key === 'loot') specials += points * count;
    else captures += points * count;
  }
  const appliedBonus = captures * captureRate + specials * exactRate;
  const wagerScore = exact ? wager : -wager;
  const total = base + appliedBonus + wagerScore + entry.adjustment;
  if (![captures, specials, captures + specials].every(Number.isSafeInteger) ||
      !Number.isFinite(total) || Math.abs(total) > Number.MAX_SAFE_INTEGER) throw new Error('signed-total');
  return {...entry, explanation, exact, base, enteredBonus: captures + specials, appliedBonus, wagerScore, total};
}

function createSkullGame(names, expansion, mode = 'classic', keepCards = false) {
  if (!Object.hasOwn(skullModes, mode) || typeof keepCards !== 'boolean') throw new Error('mode');
  if (typeof expansion !== 'boolean' || !Array.isArray(names) || names.length < 2 || names.length > (expansion ? 9 : 8)) throw new Error('players');
  if (names.some(name => typeof name !== 'string' || !name.trim())) throw new Error('names');
  if (new Set(names.map(name => name.trim().toLowerCase())).size !== names.length) throw new Error('names');
  // Freeze setup separately: the guide's expansion switch cannot change this game.
  return {setup: Object.freeze({mode, keepCards, expansion, players: Object.freeze(names.map(name => name.trim()))}), rounds: []};
}

function saveSkullRound(game, round, cards, entries) {
  if (!Number.isInteger(round) || round < 1 || round > 10 || round > game.rounds.length + 1) throw new Error('round');
  if (!Array.isArray(entries) || entries.length !== game.setup.players.length) throw new Error('players');
  const scored = entries.map(entry => scoreSkullEntry(entry, cards, game.setup));
  if (scored.reduce((sum, entry) => sum + entry.tricks, 0) > cards) throw new Error('trick-total');
  // Validate first so an invalid correction leaves all saved scores intact.
  const rounds = game.rounds.slice();
  rounds[round - 1] = {round, cards, entries: scored};
  const totals = game.setup.players.map((_, i) => rounds.reduce((sum, row) => sum + row.entries[i].total, 0));
  if (!totals.every(total => Number.isFinite(total) && Math.abs(total) <= Number.MAX_SAFE_INTEGER)) throw new Error('signed-total');
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

let skullStorageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem('tablefolk-skull-score-v1') || 'null');
  if (saved?.version === 1 && saved.game) {
    const game = createSkullGame(saved.game.setup.players, saved.game.setup.expansion, saved.game.setup.mode, saved.game.setup.keepCards);
    if (!Array.isArray(saved.game.rounds) || saved.game.rounds.length > 10) throw new Error('rounds');
    for (const row of saved.game.rounds) saveSkullRound(game, row.round, row.cards, row.entries);
    skullScoreGame = game;
    skullScoreDraft = skullGameSummary(game).finished ? null : skullRoundDraft();
  }
} catch { skullStorageOK = false; }
// Invalid draft storage cannot discard already validated rounds.
try {
 const saved=JSON.parse(localStorage.getItem('tablefolk-skull-score-v1')||'null');
 if(saved?.version===1){
  if(matchesScoreDraft(saved.setup,{count:0,names:Array(9).fill('')})&&Number.isInteger(saved.setup.count)&&saved.setup.count>=2&&saved.setup.count<=9){
    skullScoreSetup = {...saved.setup, mode: Object.hasOwn(skullModes, saved.setup.mode) ? saved.setup.mode : 'classic', keepCards: saved.setup.keepCards === true};
  }
  if(skullScoreGame){
   const valid=draft=>matchesScoreDraft(draft,{round:0,cards:'',entries:Array.from({length:skullScoreGame.setup.players.length},()=>({bid:'',tricks:'',bonus:'',adjustment:'',explanation:''}))})&&Number.isInteger(draft.round)&&draft.round>=1&&draft.round<=Math.min(skullScoreGame.rounds.length+1,10);
   if(valid(saved.draft))skullScoreDraft=saved.draft;
   if(valid(saved.pending)&&saved.pending.round===skullScoreGame.rounds.length+1)skullScorePending=saved.pending;
  }
 }
}catch{}
function persistSkullScore() {
  try { localStorage.setItem('tablefolk-skull-score-v1', JSON.stringify({version:1, game:skullScoreGame, setup:skullScoreSetup, draft:skullScoreDraft, pending:skullScorePending})); skullStorageOK = true; }
  catch { skullStorageOK = false; }
}

function skullRoundDraft() {
  const round = skullScoreGame.rounds.length + 1;
  const last = skullScoreGame.rounds.at(-1);
  return {round, cards: String(last && last.cards < round - 1 ? last.cards : round), entries: skullScoreGame.setup.players.map(() => ({bid: '0', tricks: '0', bonus: '0', adjustment: '0', explanation: ''}))};
}

function skullScoreError(code) {
  return ({cards: tr('Enter 1–10 actual cards dealt per player.', 'Ingresa entre 1 y 10 cartas repartidas por persona.'),
    'bid-tricks': tr('Final bids and tricks won must be whole numbers from zero to the cards dealt.', 'Las apuestas finales y las bazas ganadas deben ser números enteros entre cero y las cartas repartidas.'),
    'signed-total': tr('Enter whole bonus and adjustment totals within the safe numeric range.', 'Ingresa bonificaciones y ajustes enteros dentro del rango numérico seguro.'),
    explanation: tr('Explain every nonzero manual adjustment.', 'Explica cada ajuste manual distinto de cero.'),
    players: tr('Use 2–8 players in the base game, or 2–9 with the Expansion Pack.', 'Usa de 2 a 8 jugadores en la caja base, o de 2 a 9 con el paquete de expansión.'),
    names: tr('Enter a different name for every player.', 'Ingresa un nombre distinto para cada jugador.'),
    'trick-total': tr('The total tricks won cannot exceed the cards dealt per player. Check each player’s tricks.', 'La suma de bazas ganadas no puede superar las cartas repartidas por persona. Revisa las bazas de cada jugador.'),
    round: tr('Enter the next round or correct a saved round, through round 10.', 'Ingresa la siguiente ronda o corrige una guardada, hasta la ronda 10.')})[code] || tr('Check the round entries.', 'Revisa los datos de la ronda.');
}

function skullScoreBreakdown(score) {
  return `<dl class="skull-breakdown">${[
    [tr('Base score', 'Puntos base'), score.base],
    [tr('Applied bonuses', 'Bonificaciones aplicadas'), score.appliedBonus],
    ...(score.wagerScore ? [[tr('Rascal wager', 'Apuesta de Rascal'), score.wagerScore]] : []),
    [tr('Adjustment', 'Ajuste'), score.adjustment],
    [tr('Round total', 'Total de ronda'), score.total]
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
}

function skullBonusPicker(entry, i) {
  const setup = skullScoreGame.setup;
  const cards = Object.entries(skullCards).filter(([, card]) => !card[3] || setup.expansion);
  return `<details class="score-help"><summary>${tr('Cards, bounty & pirate abilities', 'Cartas, recompensa y poderes piratas')}</summary>
    <p class="skull-hint">${setup.keepCards
      ? tr('For Loot, enter one payout for each ally, even on a missed bid.', 'Para Botín, registra un pago por aliado, incluso si falla.')
      : tr('For Loot, enter one payout for each ally only when both bids are exact.', 'Para Botín, registra un pago por aliado solo si ambos aciertan.')}</p>
    <div class="skull-fields">${cards.map(([key, [points, en, es]]) => `<label>${tr(en, es)} (${points > 0 ? '+' : ''}${points})<input type="number" min="0" step="1" required data-skull-card="${key}" data-skull-player="${i}" value="${escapeHTML(entry.picks?.[key] ?? 0)}"></label>`).join('')}</div>
    <label>${tr('Custom bounty (+ or − points)', 'Recompensa personalizada (puntos + o −)')}<input type="number" step="1" required data-skull-field="bounty" data-skull-player="${i}" value="${escapeHTML(entry.bounty ?? 0)}"></label>
    <label>${tr('Rascal of Roatan wager', 'Apuesta de Rascal de Roatán')}<select data-skull-field="wager" data-skull-player="${i}">${[0,10,20].map(n => `<option${Number(entry.wager ?? 0) === n ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    <p class="skull-hint">${tr('Rascal gains the stake on an exact bid and loses it on any miss.', 'Rascal gana lo apostado si acierta y lo pierde si falla.')}</p>
    <fieldset><legend>${tr('Harry the Giant · change final bid', 'Harry el Gigante · cambiar apuesta final')}</legend>
      ${[-1,1].map(delta => `<button type="button" data-skull-harry="${delta}" data-skull-player="${i}">${delta < 0 ? '−1' : '+1'}</button>`).join(' ')}
      <output data-skull-final-bid="${i}"></output></fieldset>
    <details><summary>${tr('Other pirate abilities', 'Otros poderes piratas')}</summary>
      <p>${tr('Rosie chooses who leads next. Bendt draws two cards and discards two. Juanita looks at the undealt cards.', 'Rosie elige quién sale. Bendt roba dos cartas y descarta dos. Juanita mira las cartas sin repartir.')}
      ${setup.expansion ? tr('Mary forces a random card for the next trick. Con may use the powers of captured pirates.', 'Mary obliga a jugar una carta al azar en la próxima baza. Con puede usar los poderes de los piratas capturados.') : ''}</p></details></details>`;
}

function skullScoreRoundForm() {
  const draft = skullScoreDraft;
  if (!draft) return '';
  const editing = draft.round <= skullScoreGame.rounds.length;
  return `<form id="skull-round-form" aria-labelledby="skull-round-heading">
    <h3 id="skull-round-heading" tabindex="-1">${editing ? tr('Edit round', 'Editar ronda') : tr('Round', 'Ronda')} ${draft.round} / 10</h3>
    <label class="skull-cards-label">${tr('Actual cards dealt per player', 'Cartas realmente repartidas por persona')}<input id="skull-cards" type="number" min="1" max="10" step="1" required value="${escapeHTML(draft.cards)}" aria-describedby="skull-deal-note"></label>
    <details class="score-help" id="skull-scoring-help"><summary>${tr('Scoring help & special cards', 'Ayuda de puntuación y cartas especiales')}</summary><p id="skull-deal-note" class="skull-hint">${tr('Repeat the largest hand size your deck supports when needed. Enter the actual deal; zero bids use this value, not the round number. Total tricks won can be lower than cards dealt: Graybeard and destroyed tricks can account for the difference.', 'Repite el mayor tamaño de mano que permita el mazo cuando sea necesario. Ingresa el reparto real: las apuestas cero usan este valor, no el número de ronda. La suma de bazas ganadas puede ser menor que las cartas repartidas: Barbagris y las bazas destruidas pueden explicar la diferencia.')}</p>
    <p id="skull-bonus-note" class="skull-hint">${tr('Use the picker for individual cards or enter extra capture points directly. Both allow penalties. The preview shows the points applied for this bid.', 'Elige las cartas o ingresa puntos de captura adicionales. Ambas opciones permiten penalizaciones. La vista previa muestra los puntos aplicados a esta apuesta.')}</p></details>
    <div class="skull-entry-grid">${draft.entries.map((entry, i) => `<fieldset class="skull-player-entry"><legend>${escapeHTML(skullScoreGame.setup.players[i])}</legend>
      <div class="skull-fields">${[
        ['bid', tr('Final bid', 'Apuesta final')], ['tricks', tr('Tricks won', 'Bazas ganadas')]
      ].map(([key, label]) => `<label>${label}<input id="skull-${key}-${i}" data-skull-field="${key}" data-skull-player="${i}" type="number" inputmode="numeric" min="0" max="${escapeHTML(draft.cards)}" step="1" required value="${escapeHTML(entry[key])}"></label>`).join('')}</div>
      ${skullScoreGame.setup.mode === 'cannonball' ? `<label>${tr('Shot this round', 'Disparo de esta ronda')}<select data-skull-field="shot" data-skull-player="${i}"><option value="grapeshot">${tr('Grapeshot', 'Metralla')}</option><option value="cannonball"${entry.shot === 'cannonball' ? ' selected' : ''}>${tr('Cannonball', 'Bala de cañón')}</option></select></label>` : ''}
      ${skullBonusPicker(entry, i)}
      <label>${tr('Extra capture points (+ or −)', 'Puntos de captura adicionales (+ o −)')}<input id="skull-bonus-${i}" data-skull-field="bonus" data-skull-player="${i}" type="number" step="1" required value="${escapeHTML(entry.bonus)}" aria-describedby="skull-bonus-note skull-bonus-status-${i}"></label>
      <p id="skull-bonus-status-${i}" class="skull-hint" aria-live="polite"></p>
      <details class="score-help" id="skull-adjustments-${i}" ${Number(entry.adjustment)!==0?'open':''}><summary>${tr('Special power / manual adjustment', 'Poder especial / ajuste manual')}</summary>
        <label>${tr('Manual adjustment (signed)', 'Ajuste manual (con signo)')}<input id="skull-adjustment-${i}" data-skull-field="adjustment" data-skull-player="${i}" type="number" step="1" required value="${escapeHTML(entry.adjustment)}"></label>
        <label>${tr('Adjustment explanation', 'Explicación del ajuste')}<input id="skull-explanation-${i}" data-skull-field="explanation" data-skull-player="${i}" type="text" value="${escapeHTML(entry.explanation)}"${Number(entry.adjustment)!==0?' required':''}></label>
      </details>
      <div id="skull-preview-${i}"></div>
    </fieldset>`).join('')}</div>
    <div class="skull-actions"><button type="submit">${editing ? tr('Save correction', 'Guardar corrección') : tr('Save round', 'Guardar ronda')}</button>${editing ? `<button type="button" id="skull-edit-cancel">${tr('Cancel edit', 'Cancelar edición')}</button>` : ''}</div>
  </form>`;
}

function skullScoreHistory() {
  const showShot = skullScoreGame.setup.mode === 'cannonball';
  const running = skullScoreGame.setup.players.map(() => 0);
  return `<div class="skull-history"><h3>${tr('Editable round history', 'Historial de rondas editable')}</h3>${skullScoreGame.rounds.map(row => `<details id="skull-history-${row.round}"><summary>${tr('Round', 'Ronda')} ${row.round} · ${row.cards} ${tr('cards dealt', 'cartas repartidas')}</summary>
    <div class="skull-table-scroll" tabindex="0" role="region" aria-label="${tr('Round', 'Ronda')} ${row.round}"><table><caption>${tr('Scores and cumulative totals after this round', 'Puntos y totales acumulados después de esta ronda')}</caption><thead><tr>${[tr('Player', 'Jugador'),...(showShot ? [tr('Shot', 'Disparo')] : []),tr('Final bid', 'Apuesta final'),tr('Tricks won', 'Bazas ganadas'),tr('Base score', 'Puntos base'),tr('Entered bonuses', 'Bonificaciones ingresadas'),tr('Applied bonuses', 'Bonificaciones aplicadas'),tr('Rascal wager', 'Apuesta de Rascal'),tr('Adjustment', 'Ajuste'),tr('Explanation', 'Explicación'),tr('Round total', 'Total de ronda'),tr('Cumulative total', 'Total acumulado')].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${row.entries.map((entry, i) => {
      running[i] += entry.total;
      return `<tr><th scope="row">${escapeHTML(skullScoreGame.setup.players[i])}</th>${[...(showShot ? [entry.shot === 'cannonball' ? tr('Cannonball', 'Bala de cañón') : tr('Grapeshot', 'Metralla')] : []), entry.bid, entry.tricks, entry.base, entry.enteredBonus, entry.appliedBonus, entry.wagerScore, entry.adjustment, entry.explanation || '—', entry.total, running[i]].map(value => `<td>${escapeHTML(value)}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table></div><button type="button" data-skull-edit="${row.round}">${tr('Edit round', 'Editar ronda')} ${row.round}</button></details>`).join('')}</div>`;
}

function skullScoreView() {
  let body;
  if (!skullScoreGame) {
    const max = state.skullExpansion ? 9 : 8;
    skullScoreSetup.count = Math.min(skullScoreSetup.count, max);
    body = `<form id="skull-score-setup"><p>${tr('New game uses the current guide setting:', 'La nueva partida usa la opción actual de la guía:')} <strong>${state.skullExpansion ? tr('Base + Expansion Pack', 'Caja base + paquete de expansión') : tr('Base box', 'Caja base')}</strong>.</p>
      <label>${tr('Scoring system', 'Sistema de puntuación')}<select id="skull-mode" aria-describedby="skull-mode-help">${Object.entries(skullModes).map(([key, [en, es]]) => `<option value="${key}"${key === skullScoreSetup.mode ? ' selected' : ''}>${tr(en, es)}</option>`).join('')}</select></label>
      <p class="skull-hint" id="skull-mode-help">${tr(...skullModes[skullScoreSetup.mode ?? 'classic'].slice(2))}</p>
      <label class="skull-house-rule"><input id="skull-keep-cards" type="checkbox"${skullScoreSetup.keepCards ? ' checked' : ''}>${tr('Count full card bonuses and penalties even on a missed bid', 'Contar bonos y penalizaciones de cartas completos aunque falle la apuesta')}</label>
      <label>${tr('Scored players', 'Jugadores con puntuación')}<select id="skull-player-count">${Array.from({length: max - 1}, (_, i) => i + 2).map(n => `<option value="${n}"${n===skullScoreSetup.count?' selected':''}>${n}</option>`).join('')}</select></label>
      <div class="skull-name-grid">${skullScoreSetup.names.slice(0, skullScoreSetup.count).map((name, i) => `<label>${tr('Player', 'Jugador')} ${i+1}<input id="skull-name-${i}" data-skull-name="${i}" required type="text" value="${escapeHTML(name)}"></label>`).join('')}</div>
      <p class="skull-hint">${tr('With two players, Graybeard is not a scored player. The expansion setting is fixed when you start this game.', 'Con dos jugadores, Barbagris no recibe puntuación. La opción de expansión queda fija al iniciar esta partida.')}</p>
      <button type="submit">${tr('Start ten-round game', 'Iniciar partida de diez rondas')}</button></form>`;
  } else {
    const game = skullScoreGame;
    const summary = skullGameSummary(game);
    const winnerNames = summary.winners.map(i => game.setup.players[i]).join(', ');
    body = `<p id="skull-game-edition">${tr('This game:', 'Esta partida:')} <strong>${game.setup.expansion ? tr('Base + Expansion Pack', 'Caja base + paquete de expansión') : tr('Base box', 'Caja base')}</strong> · ${tr(...skullModes[game.setup.mode].slice(0, 2))}${game.setup.keepCards ? ' · ' + tr('Full card points on missed bids', 'Puntos de cartas completos al fallar') : ''} · ${game.setup.players.length} ${tr('scored players', 'jugadores con puntuación')}. ${tr('Guide switches do not change this game.', 'Los cambios de la guía no cambian esta partida.')}</p>
      <p id="skull-game-result" role="status">${summary.finished ? `${summary.winners.length > 1 ? tr('Joint winners', 'Ganadores conjuntos') : tr('Winner', 'Ganador')}: ${escapeHTML(winnerNames)} · ${Math.max(...summary.totals)} ${tr('points after round 10.', 'puntos tras la ronda 10.')}` : `${game.rounds.length} / 10 ${tr('rounds saved. Highest total after round 10 wins; tied leaders win jointly.', 'rondas guardadas. Gana el mayor total tras la ronda 10; quienes empaten arriba ganan conjuntamente.')}`}</p>
      <h3>${tr('Cumulative totals', 'Totales acumulados')}</h3><ol class="skull-totals">${game.setup.players.map((name, i) => `<li><span>${escapeHTML(name)}</span><strong data-skull-total="${i}">${summary.totals[i]}</strong></li>`).join('')}</ol>
      ${skullScoreRoundForm()}${game.rounds.length ? `<button type="button" id="skull-undo-round">${tr('Undo last round', 'Deshacer última ronda')}</button>` : ''}${skullScoreHistory()}`;
  }
  return `<section id="skull-score" class="skull-score" aria-labelledby="skull-score-heading"><div class="scoreboard-heading"><h2 id="skull-score-heading" tabindex="-1">${tr('Skull King score sheet', 'Planilla de puntos de Skull King')}</h2>${skullScoreGame ? `<button id="skull-new-game" type="button">${tr('Reset · edit players', 'Reiniciar · editar jugadores')}</button>` : ''}</div>
    <p id="skull-score-notice" role="alert" tabindex="-1">${skullScoreNotice ? skullScoreError(skullScoreNotice) : ''}</p>${body}
    ${skullStorageOK ? '' : `<p role="status">${tr('Local saving is unavailable. Keep this page open to retain your scores.', 'No se puede guardar en este dispositivo. Mantén esta página abierta para conservar los puntos.')}</p>`}<p class="skull-hint">${tr('Scores and unfinished entries stay when switching views or languages. Scores and unfinished entries are restored when you reload.', 'Los puntos y los datos sin guardar se conservan al cambiar de vista o idioma. Los puntos y los datos sin guardar se recuperan al recargar.')}</p></section>`;
}

function reopenSkullRound(row) {
  return {round: row.round, cards: String(row.cards), entries: row.entries.map(entry => ({
    bid: String(entry.bid), tricks: String(entry.tricks), bonus: String(entry.bonus),
    picks: {...entry.picks}, wager: String(entry.wager ?? 0), bounty: String(entry.bounty ?? 0),
    shot: entry.shot ?? 'grapeshot', adjustment: String(entry.adjustment), explanation: entry.explanation
  }))};
}

function skullDraftEntry(entry) {
  if (['bid', 'tricks', 'bonus', 'adjustment'].some(key => entry[key].trim() === '')) throw new Error('signed-total');
  const picks = Object.fromEntries(Object.entries(entry.picks ?? {}).map(([key, value]) => [key, value === '' ? NaN : Number(value)]));
  return {picks, shot: entry.shot ?? 'grapeshot', wager: Number(entry.wager ?? 0), bounty: Number(entry.bounty ?? 0), bid: Number(entry.bid), tricks: Number(entry.tricks), bonus: Number(entry.bonus), adjustment: Number(entry.adjustment), explanation: entry.explanation};
}

function refreshSkullPreview() {
  if (!skullScoreDraft) return;
  skullScoreDraft.entries.forEach((entry, i) => {
    const explanation = document.getElementById(`skull-explanation-${i}`);
    explanation.required = Number(entry.adjustment) !== 0;
    explanation.setCustomValidity(explanation.required && !entry.explanation.trim() ? skullScoreError('explanation') : '');
    for (const key of ['bid', 'tricks']) document.getElementById(`skull-${key}-${i}`).max = skullScoreDraft.cards;
    const bid = Number(entry.bid);
    const bidInput = document.getElementById(`skull-bid-${i}`);
    const player = bidInput.closest('.skull-player-entry');
    player.querySelector('[data-skull-final-bid]').textContent = tr('Final bid', 'Apuesta final') + ' · ' + entry.bid;
    player.querySelectorAll('[data-skull-harry]').forEach(button => {
      const changed = bid + Number(button.dataset.skullHarry);
      button.disabled = !bidInput.validity.valid || changed < 0 || changed > Number(skullScoreDraft.cards);
    });
    const preview = document.getElementById(`skull-preview-${i}`);
    const setup = skullScoreGame.setup;
    const difference = Math.abs(Number(entry.bid) - Number(entry.tricks));
    const grapeshot = setup.mode === 'rascal' || (setup.mode === 'cannonball' && entry.shot !== 'cannonball');
    const rate = skullCaptureRate(difference, grapeshot, setup.keepCards);
    document.getElementById(`skull-bonus-status-${i}`).textContent = rate === 0
      ? tr('Bid missed. Card points will not count.', 'Apuesta fallada. Los puntos de cartas no se suman.')
      : rate === 0.5 ? tr('Off by one. Ordinary captures and custom bounty count half. Loot and expansion cards score zero.', 'Una baza de diferencia. Capturas normales y recompensa valen la mitad. Botín y cartas de expansión valen cero.')
      : tr('Card bonuses and penalties count in full.', 'Los bonos y penalizaciones de cartas cuentan completos.');
    try { preview.innerHTML = skullScoreBreakdown(scoreSkullEntry(skullDraftEntry(entry), Number(skullScoreDraft.cards), setup)); }
    catch { preview.textContent = tr('Complete valid entries to preview the score.', 'Completa los datos válidos para ver los puntos.'); }
  });
}

function bindSkullScore() {
  const root = document.getElementById('skull-score');
  if (!root) return;
  bindScoreRecovery(root, persistSkullScore);
  const redraw = (focus = 'skull-round-heading') => {persistSkullScore(); refreshScorePanel('skull-score', skullScoreView, bindSkullScore, focus);};
  root.addEventListener('invalid', event => {
    const details = event.target.closest('details');
    if (details) details.open = true;
  }, true);
  const setup = document.getElementById('skull-score-setup');
  if (setup) {
    document.getElementById('skull-mode').onchange = event => {
      skullScoreSetup.mode = event.target.value;
      document.getElementById('skull-mode-help').textContent = tr(...skullModes[skullScoreSetup.mode].slice(2));
    };
    document.getElementById('skull-keep-cards').onchange = event => { skullScoreSetup.keepCards = event.target.checked; };
    document.getElementById('skull-player-count').onchange = event => {skullScoreSetup.count = Number(event.target.value); redraw('skull-player-count');};
    root.querySelectorAll('[data-skull-name]').forEach(input => {input.oninput = () => {skullScoreSetup.names[Number(input.dataset.skullName)] = input.value;};});
    setup.onsubmit = event => {
      event.preventDefault();
      try {
        skullScoreGame = createSkullGame(skullScoreSetup.names.slice(0, skullScoreSetup.count), state.skullExpansion, skullScoreSetup.mode, skullScoreSetup.keepCards);
        skullScoreDraft = skullRoundDraft(); skullScorePending = null; skullScoreNotice = ''; redraw();
      } catch (error) {skullScoreNotice = error.message; redraw('skull-score-notice');}
    };
    return;
  }
  const form = document.getElementById('skull-round-form');
  if (form) {
    const draft = skullScoreDraft;
    document.getElementById('skull-cards').oninput = event => {skullScoreDraft.cards = event.target.value; refreshSkullPreview();};
    root.querySelectorAll('[data-skull-harry]').forEach(button => {button.onclick = () => {
      const input = document.getElementById(`skull-bid-${button.dataset.skullPlayer}`);
      input.value = String(Number(input.value) + Number(button.dataset.skullHarry));
      input.dispatchEvent(new Event('input', {bubbles:true}));
    };});
    root.querySelectorAll('[data-skull-card]').forEach(input => {input.oninput = () => {
      const entry = draft.entries[Number(input.dataset.skullPlayer)];
      entry.picks ??= {};
      entry.picks[input.dataset.skullCard] = input.value;
      refreshSkullPreview();
    };});
    root.querySelectorAll('[data-skull-field]').forEach(input => {input.oninput = () => {
      skullScoreDraft.entries[Number(input.dataset.skullPlayer)][input.dataset.skullField] = input.value; refreshSkullPreview();
    };});
    form.onsubmit = event => {
      event.preventDefault();
      if (draft !== skullScoreDraft) return;
      try {
        const editing = skullScoreDraft.round <= skullScoreGame.rounds.length;
        saveSkullRound(skullScoreGame, skullScoreDraft.round, Number(skullScoreDraft.cards), skullScoreDraft.entries.map(skullDraftEntry));
        skullScoreDraft = editing && skullScorePending ? skullScorePending : skullScoreGame.rounds.length < 10 ? skullRoundDraft() : null;
        skullScorePending = null; skullScoreNotice = ''; redraw(skullScoreDraft ? 'skull-round-heading' : 'skull-score-heading');
      } catch (error) {skullScoreNotice = error.message; document.getElementById('skull-score-notice').textContent = skullScoreError(error.message); document.getElementById('skull-score-notice').focus();}
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
    skullScoreDraft = reopenSkullRound(row);
    skullScoreNotice = ''; redraw(); document.getElementById('skull-round-heading').scrollIntoView({block:'center', behavior:'instant'});
  };});
  document.getElementById('skull-undo-round')?.addEventListener('click', () => {
    const row = skullScoreGame.rounds.pop();
    if (!row) return;
    skullScoreDraft = reopenSkullRound(row);
    skullScorePending = null; skullScoreNotice = ''; redraw();
  });
  document.getElementById('skull-new-game').onclick = () => {
    if (!window.confirm(tr('Clear all rounds and return to player and scoring setup?', '¿Borrar todas las rondas y volver a elegir jugadores y puntuación?'))) return;
    skullScoreSetup = {count: skullScoreGame.setup.players.length, names: [...skullScoreGame.setup.players, ...Array(9 - skullScoreGame.setup.players.length).fill('')]};
    skullScoreGame = null; skullScoreDraft = null; skullScorePending = null; skullScoreNotice = ''; redraw('skull-player-count');
  };
}
