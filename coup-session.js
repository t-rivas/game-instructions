'use strict';

// Results refer to stable roster positions. Standings are always recomputed so
// corrections and undo cannot leave stale totals. Guide variants are unrelated.
function createCoupSession(savedSession) {
  let names = ['', ''], mode = 'default', planned = 6;
  let started = false, locked = false, results = [];
  const validNames = values => Array.isArray(values) && values.length >= 2 && values.length <= 10 &&
    values.every(n => typeof n === 'string' && n.trim()) &&
    new Set(values.map(n => n.trim().toLowerCase())).size === values.length;
  const validSettings = (values, scoring, count) => validNames(values) &&
    ['default', 'wins'].includes(scoring) && Number.isSafeInteger(count) && count > 0;
  function validResult(winner, runnerUp) {
    const participant = id => Number.isInteger(id) && id >= 0 && id < names.length;
    return participant(winner) && (runnerUp === null ? mode === 'wins' && names.length > 2 :
      participant(runnerUp) && winner !== runnerUp);
  }
  if (savedSession && validSettings(savedSession.names, savedSession.mode, savedSession.planned) &&
      typeof savedSession.locked === 'boolean' && typeof savedSession.started === 'boolean' &&
      Array.isArray(savedSession.results) && savedSession.results.length <= savedSession.planned) {
    names = savedSession.names.map(n => n.trim()); mode = savedSession.mode; planned = savedSession.planned;
    if (savedSession.results.every(r => r && validResult(r.winner, r.runnerUp) &&
        (names.length !== 2 || r.runnerUp === 1 - r.winner))) {
      results = savedSession.results.map(r => ({winner:r.winner, runnerUp:r.runnerUp}));
      locked = savedSession.locked || results.length > 0;
      started = savedSession.started || locked;
    } else { names = ['', '']; mode = 'default'; planned = 6; }
  }
  return {
    configure(values, scoring, count) {
      if (locked || !validSettings(values, scoring, count)) return false;
      names = values.map(n => n.trim()); mode = scoring; planned = count; started = true;
      return true;
    },
    rename(id, name) {
      if (!Number.isInteger(id) || id < 0 || id >= names.length) return false;
      const updated = names.map((n, i) => i === id ? name : n);
      if (!validNames(updated)) return false;
      names = updated.map(n => n.trim()); return true;
    },
    renameAll(values) {
      if (!validNames(values) || values.length !== names.length) return false;
      names = values.map(n => n.trim()); return true;
    },
    save(index, winner, runnerUp = null) {
      if (!started || index !== results.length || results.length >= planned) return false;
      // In a duel the other participant is the last eliminated, worth 0 points.
      if (names.length === 2 && runnerUp === null && Number.isInteger(winner)) runnerUp = 1 - winner;
      if (!validResult(winner, runnerUp)) return false;
      results.push({winner, runnerUp}); locked = true; return true;
    },
    correct(index, winner, runnerUp = null) {
      if (!Number.isInteger(index) || index < 0 || index >= results.length) return false;
      if (names.length === 2 && runnerUp === null && Number.isInteger(winner)) runnerUp = 1 - winner;
      if (!validResult(winner, runnerUp)) return false;
      results[index] = {winner, runnerUp}; return true;
    },
    undo() { if (!results.length) return false; results.pop(); return true; },
    newSession() { results = []; started = false; locked = false; },
    snapshot() {
      const standings = names.map((name, id) => ({id, name, points:0, wins:0, runnerUps:0}));
      for (const result of results) {
        standings[result.winner].wins++;
        standings[result.winner].points += mode === 'wins' ? 1 : 3;
        if (result.runnerUp !== null) {
          standings[result.runnerUp].runnerUps++;
          if (mode === 'default' && names.length > 2) standings[result.runnerUp].points++;
        }
      }
      standings.sort((a,b) => b.points - a.points || b.wins - a.wins || a.id - b.id);
      const finished = started && results.length === planned;
      const winners = finished ? standings.filter(p => p.points === standings[0].points && p.wins === standings[0].wins).map(p => p.id) : [];
      return {names:[...names], mode, planned, started, locked, results:results.map(r => ({...r})), standings, finished, winners};
    }
  };
}

let coupSavedSession;
try { coupSavedSession = JSON.parse(localStorage.getItem('tablefolk-coup-session') || 'null'); } catch {}
const coupSession = createCoupSession(coupSavedSession);
let coupSetupDraft = null;
let coupResultDraft = {index:null, winner:'', runnerUp:''};
let coupSessionMessage = null;

function persistCoupSession() {
  const {names, mode, planned, started, locked, results} = coupSession.snapshot();
  try { localStorage.setItem('tablefolk-coup-session', JSON.stringify({names, mode, planned, started, locked, results})); } catch {}
}
function coupSessionError() {
  return coupSessionMessage ? tr(...coupSessionMessage) : '';
}
function coupSessionView() {
  const session = coupSession.snapshot();
  const setup = !session.started || coupSetupDraft !== null;
  if (setup && !coupSetupDraft) coupSetupDraft = {names:[...session.names], mode:session.mode, planned:String(session.planned)};
  const draft = coupSetupDraft;
  const rules = tr('House session scoring · not official Coup scoring.', 'Puntuación casera de sesión · no es la puntuación oficial de Coup.');
  return `<section class="coup-session" id="coup-session" aria-labelledby="coup-session-heading">
    <h2 id="coup-session-heading" tabindex="-1">${tr('Coup session scoreboard','Marcador de sesión de Coup')}</h2>
    <p class="coup-session-note"><strong>${rules}</strong><br>${tr('Default: winner +3, runner-up +1, everyone else 0. Runner-up is the last player eliminated. With 2 players: winner +3, loser 0. Wins only: winner +1, everyone else 0.', 'Normal: ganador +3, segundo +1, los demás 0. El segundo es el último jugador eliminado. Con 2 jugadores: ganador +3, perdedor 0. Solo victorias: ganador +1, los demás 0.')}</p>
    <p class="coup-session-note">${tr('Highest points wins the session; ties go to most wins. If still tied, share the session win.', 'Gana la sesión quien tenga más puntos; en un empate, quien tenga más victorias. Si el empate continúa, comparten la victoria de la sesión.')}</p>
    ${setup ? `<form id="coup-setup-form">
      <fieldset><legend>${tr('Session setup · 2–10 players','Preparar sesión · 2–10 jugadores')}</legend>
        <p class="coup-session-note">${tr('For 7–10 players, use the extra cards described in the guide.', 'Para 7–10 jugadores, usa las cartas extra indicadas en la guía.')}</p>
        <div class="coup-session-grid">${draft.names.map((name,id) => `<label>${tr(`Player ${id+1}`,`Jugador ${id+1}`)}<input id="coup-name-${id}" data-coup-name="${id}" required value="${escapeHTML(name)}" autocomplete="off"></label>`).join('')}</div>
        <div class="coup-session-actions"><button type="button" id="coup-add-player" ${draft.names.length===10?'disabled':''}>${tr('Add player','Añadir jugador')}</button><button type="button" id="coup-remove-player" ${draft.names.length===2?'disabled':''}>${tr('Remove last player','Quitar último jugador')}</button></div>
        <div class="coup-session-grid"><label>${tr('Scoring mode','Modo de puntuación')}<select id="coup-mode"><option value="default" ${draft.mode==='default'?'selected':''}>${tr('Default · 3 / 1 / 0','Normal · 3 / 1 / 0')}</option><option value="wins" ${draft.mode==='wins'?'selected':''}>${tr('Wins only · 1 / 0','Solo victorias · 1 / 0')}</option></select></label>
        <label>${tr('Planned games','Partidas previstas')}<input id="coup-planned" type="number" min="1" step="1" required value="${escapeHTML(draft.planned)}"></label></div>
      </fieldset>
      <p class="coup-session-note">${tr('Players, scoring mode and game count lock after the first saved result. Names stay editable.', 'Los participantes, el modo y el número de partidas quedan fijos tras guardar el primer resultado. Los nombres se pueden editar.')}</p>
      <button class="coup-primary" type="submit" id="coup-start">${tr('Start session','Iniciar sesión')}</button>
    </form>` : coupActiveSessionView(session)}
    <p id="coup-session-error" role="alert">${escapeHTML(coupSessionError())}</p>
    <p class="coup-session-note">${tr('Saved on this device when browser storage is available.', 'Se guarda en este dispositivo cuando el navegador permite almacenamiento.')}</p>
  </section>`;
}

function coupActiveSessionView(session) {
  const editing = coupResultDraft.index !== null;
  const number = editing ? coupResultDraft.index + 1 : session.results.length + 1;
  const options = selected => `<option value="">${tr('Choose a player…','Elige un jugador…')}</option>` + session.names.map((name,id) => `<option value="${id}" ${String(id)===selected?'selected':''}>${escapeHTML(name)}</option>`).join('');
  const canRecord = !session.finished || editing;
  return `<p id="coup-session-progress" role="status">${tr(`Games completed: ${session.results.length} / ${session.planned}`, `Partidas completadas: ${session.results.length} / ${session.planned}`)} · ${session.mode==='wins'?tr('Wins only','Solo victorias'):tr('Default','Normal')}</p>
    ${session.locked ? `<p class="coup-session-note">${tr('Session settings are locked, including after undo.', 'La configuración queda fija, incluso después de deshacer.')}</p>` : `<button type="button" id="coup-edit-setup">${tr('Edit session setup','Editar configuración')}</button>`}
    ${session.finished ? `<p class="coup-session-finish" id="coup-session-winners" role="status">${session.winners.length===1?tr('Session winner: ','Ganador de la sesión: '):tr('Shared session winners: ','Ganadores compartidos de la sesión: ')}<strong>${session.winners.map(id => escapeHTML(session.names[id])).join(', ')}</strong></p>` : ''}
    <div class="coup-standings-wrap" tabindex="0" role="region" aria-label="${tr('Session standings','Clasificación de la sesión')}"><table id="coup-standings"><caption>${tr('Standings','Clasificación')}</caption><thead><tr><th scope="col">${tr('Player','Jugador')}</th><th scope="col">${tr('Points','Puntos')}</th><th scope="col">${tr('Wins','Victorias')}</th><th scope="col">${tr('Runner-up finishes','Segundos puestos')}</th></tr></thead><tbody>${session.standings.map(player => `<tr data-coup-player="${player.id}"><th scope="row">${escapeHTML(player.name)}</th><td>${player.points}</td><td>${player.wins}</td><td>${player.runnerUps}</td></tr>`).join('')}</tbody></table></div>
    ${canRecord ? `<form id="coup-result-form"><fieldset><legend>${editing?tr(`Correct game ${number}`,`Corregir partida ${number}`):tr(`Record game ${number}`,`Registrar partida ${number}`)}</legend><div class="coup-session-grid">
      <label>${tr('Winner','Ganador')}<select id="coup-winner" required>${options(coupResultDraft.winner)}</select></label>
      ${session.names.length>2 ? `<label>${session.mode==='default'?tr('Runner-up · last eliminated','Segundo · último eliminado'):tr('Runner-up (optional · 0 points)','Segundo (opcional · 0 puntos)')}<select id="coup-runner-up" ${session.mode==='default'?'required':''}>${options(coupResultDraft.runnerUp)}</select></label>` : ''}
      </div></fieldset><div class="coup-session-actions"><button class="coup-primary" type="submit" id="coup-save-result">${editing?tr('Save correction','Guardar corrección'):tr('Save result','Guardar resultado')}</button>${editing?`<button type="button" id="coup-cancel-correction">${tr('Cancel correction','Cancelar corrección')}</button>`:''}</div></form>` : ''}
    ${session.mode==='wins' && session.names.length>2 ? `<p class="coup-session-note">${tr('Runner-up finishes count only when you record them; they do not add points in Wins only mode.', 'En Solo victorias, los segundos puestos se cuentan si los registras; no suman puntos.')}</p>` : ''}
    <h3>${tr('Result history','Historial de resultados')}</h3>
    ${session.results.length ? `<ol class="coup-session-history">${session.results.map((result,index) => `<li><div><strong>${tr(`Game ${index+1}`,`Partida ${index+1}`)}</strong><span>${tr('Winner: ','Ganador: ')}${escapeHTML(session.names[result.winner])} (+${session.mode==='wins'?1:3})</span>${result.runnerUp===null?'':`<span>${tr('Runner-up: ','Segundo: ')}${escapeHTML(session.names[result.runnerUp])} (+${session.mode==='default'&&session.names.length>2?1:0})</span>`}</div><button type="button" data-coup-correct="${index}" aria-label="${tr(`Correct game ${index+1}`,`Corregir partida ${index+1}`)}">${tr('Correct','Corregir')}</button></li>`).join('')}</ol><button type="button" id="coup-undo">${tr('Undo last result','Deshacer último resultado')}</button>` : `<p class="coup-session-note">${tr('No results yet.','Todavía no hay resultados.')}</p>`}
    <details class="coup-session-names"><summary>${tr('Edit player names','Editar nombres')}</summary><form id="coup-rename-form"><div class="coup-session-grid">${session.names.map((name,id) => `<label>${tr(`Player ${id+1}`,`Jugador ${id+1}`)}<input id="coup-rename-${id}" data-coup-rename="${id}" required value="${escapeHTML(name)}" autocomplete="off"></label>`).join('')}</div><button type="submit">${tr('Save names','Guardar nombres')}</button></form></details>
    <button type="button" id="coup-new-session">${tr('New session · same names, zero scores','Nueva sesión · mismos nombres, cero puntos')}</button>`;
}

function refreshCoupSession(focusId) {
  const root = document.getElementById('coup-session');
  if (!root) return;
  root.outerHTML = coupSessionView(); bindCoupSession();
  if (focusId) document.getElementById(focusId)?.focus({preventScroll:true});
}
function bindCoupSession() {
  const root = document.getElementById('coup-session');
  if (!root) return;
  const find = id => root.querySelector('#'+id);
  const error = (en, es) => { coupSessionMessage = [en, es]; find('coup-session-error').textContent = tr(en, es); };
  const changed = focusId => { coupSessionMessage = null; persistCoupSession(); refreshCoupSession(focusId); };
  const clearResult = () => { coupResultDraft = {index:null, winner:'', runnerUp:''}; };
  if (find('coup-setup-form')) {
    root.querySelectorAll('[data-coup-name]').forEach(input => input.oninput = () => { coupSetupDraft.names[Number(input.dataset.coupName)] = input.value; });
    find('coup-mode').onchange = event => { coupSetupDraft.mode = event.target.value; };
    find('coup-planned').oninput = event => { coupSetupDraft.planned = event.target.value; };
    find('coup-add-player').onclick = () => { if (coupSetupDraft.names.length<10) coupSetupDraft.names.push(''); refreshCoupSession(`coup-name-${coupSetupDraft.names.length-1}`); };
    find('coup-remove-player').onclick = () => { if (coupSetupDraft.names.length>2) coupSetupDraft.names.pop(); refreshCoupSession('coup-remove-player'); };
    find('coup-setup-form').onsubmit = event => {
      event.preventDefault();
      if (!coupSession.configure(coupSetupDraft.names, coupSetupDraft.mode, Number(coupSetupDraft.planned))) {
        error('Use distinct, non-empty player names and a positive whole-number game count.', 'Usa nombres distintos, sin dejar ninguno vacío, y un número entero positivo de partidas.'); return;
      }
      coupSetupDraft = null; clearResult(); changed('coup-winner');
    };
  }
  const session = coupSession.snapshot();
  if (find('coup-edit-setup')) find('coup-edit-setup').onclick = () => {
    coupSetupDraft = {names:[...session.names], mode:session.mode, planned:String(session.planned)}; refreshCoupSession('coup-planned');
  };
  if (find('coup-result-form')) {
    // Capture this form's game number. A second submit from a stale form cannot
    // append the same result to the next game.
    const index = coupResultDraft.index === null ? session.results.length : coupResultDraft.index;
    const editing = coupResultDraft.index !== null;
    find('coup-winner').onchange = event => { coupResultDraft.winner = event.target.value; };
    if (find('coup-runner-up')) find('coup-runner-up').onchange = event => { coupResultDraft.runnerUp = event.target.value; };
    find('coup-result-form').onsubmit = event => {
      event.preventDefault();
      const winner = coupResultDraft.winner === '' ? null : Number(coupResultDraft.winner);
      const runnerUp = coupResultDraft.runnerUp === '' ? null : Number(coupResultDraft.runnerUp);
      if (!(editing ? coupSession.correct(index, winner, runnerUp) : coupSession.save(index, winner, runnerUp))) {
        error('Choose a valid winner and a different runner-up when required.', 'Elige un ganador válido y un segundo distinto cuando sea necesario.'); return;
      }
      clearResult(); changed(session.results.length+1===session.planned&&!editing?'coup-new-session':'coup-winner');
    };
  }
  root.querySelectorAll('[data-coup-correct]').forEach(button => button.onclick = () => {
    const index = Number(button.dataset.coupCorrect), result = session.results[index];
    coupResultDraft = {index, winner:String(result.winner), runnerUp:result.runnerUp===null?'':String(result.runnerUp)};
    coupSessionMessage = null; refreshCoupSession('coup-winner');
  });
  if (find('coup-cancel-correction')) find('coup-cancel-correction').onclick = () => { clearResult(); coupSessionMessage = null; refreshCoupSession('coup-winner'); };
  if (find('coup-undo')) find('coup-undo').onclick = () => { coupSession.undo(); clearResult(); changed('coup-winner'); };
  if (find('coup-rename-form')) find('coup-rename-form').onsubmit = event => {
    event.preventDefault();
    const names = [...root.querySelectorAll('[data-coup-rename]')].map(input => input.value.trim());
    if (names.some(name => !name) || new Set(names.map(n => n.toLowerCase())).size !== names.length) {
      error('Use distinct, non-empty player names.', 'Usa nombres distintos, sin dejar ninguno vacío.'); return;
    }
    // Apply the complete roster atomically, allowing two players to swap names.
    coupSession.renameAll(names);
    changed('coup-session-heading');
  };
  if (find('coup-new-session')) find('coup-new-session').onclick = () => {
    if (session.results.length && !window.confirm(tr('Start a new session with the same names and clear these results?', '¿Iniciar una sesión nueva con los mismos nombres y borrar estos resultados?'))) return;
    coupSession.newSession(); coupSetupDraft = null; clearResult(); changed('coup-start');
  };
}
