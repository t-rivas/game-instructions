'use strict';

const POKER_TIMER_DEFAULT = [
  {type:'level', duration:20, smallBlind:25, bigBlind:50, ante:0},
  {type:'level', duration:20, smallBlind:50, bigBlind:100, ante:0},
  {type:'break', duration:10},
  {type:'level', duration:20, smallBlind:100, bigBlind:200, ante:25}
];

// Durations are whole minutes; antes are always per player.
function validatePokerSchedule(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  let total = 0;
  const result = [];
  const whole = (n, min) => Number.isSafeInteger(n) && n >= min;
  for (const row of rows) {
    if (!row || !['level','break'].includes(row.type) || !whole(row.duration, 1)) return null;
    total += row.duration * 60000;
    if (!Number.isSafeInteger(total)) return null;
    if (row.type === 'break') result.push({type:'break', duration:row.duration});
    else {
      const ante = row.ante === undefined ? 0 : row.ante;
      if (!whole(row.smallBlind,1) || !whole(row.bigBlind,1) || row.smallBlind > row.bigBlind || !whole(ante,0)) return null;
      result.push({type:'level', duration:row.duration, smallBlind:row.smallBlind, bigBlind:row.bigBlind, ante});
    }
  }
  return result;
}

// The injected clock makes timing deterministic in tests. Persist an absolute
// wall-clock deadline so reloads and device sleep do not discard elapsed time.
function createPokerTimer(now = () => Date.now(), saved = null) {
  let schedule = validatePokerSchedule(POKER_TIMER_DEFAULT);
  let phase = 'ready', index = 0, remaining = schedule[0].duration * 60000;
  let deadline = null, revision = 0, notice = null;
  if (saved && saved.version === 1) {
    const rows = validatePokerSchedule(saved.schedule);
    const validIndex = rows && Number.isInteger(saved.index) && saved.index >= 0 && saved.index < rows.length;
    const validPhase = ['ready','running','paused','finished'].includes(saved.phase);
    const validTime = validIndex && (saved.phase === 'running'
      ? Number.isSafeInteger(saved.deadline)
      : saved.deadline === null && Number.isSafeInteger(saved.remaining) && saved.remaining >= 0 && saved.remaining <= rows[saved.index].duration * 60000);
    const validPosition = validIndex && (saved.phase !== 'ready' || (saved.index === 0 && saved.remaining === rows[0].duration * 60000)) &&
      (saved.phase !== 'finished' || (saved.index === rows.length - 1 && saved.remaining === 0)) &&
      (saved.phase !== 'paused' || saved.remaining > 0);
    if (rows && validPhase && validTime && validPosition) {
      schedule = rows; phase = saved.phase; index = saved.index;
      remaining = saved.remaining; deadline = saved.deadline;
      if (phase !== 'ready' && saved.notice && ['automatic','manual','complete'].includes(saved.notice.kind) &&
          Number.isSafeInteger(saved.notice.crossed) && saved.notice.crossed > 0 && saved.notice.crossed <= rows.length) {
        notice = {kind:saved.notice.kind, crossed:saved.notice.crossed};
      }
    }
  }
  function sync() {
    if (phase !== 'running') return;
    const time = now();
    let crossed = 0;
    while (time >= deadline && phase === 'running') {
      crossed++;
      if (index === schedule.length - 1) {
        phase = 'finished'; remaining = 0; deadline = null;
      } else {
        index++;
        deadline += schedule[index].duration * 60000;
      }
    }
    if (crossed) { revision++; notice = {kind:phase === 'finished'?'complete':'automatic', crossed}; }
    if (phase === 'running') remaining = Math.max(0, deadline - time);
  }
  function fullDuration() { return schedule[index].duration * 60000; }
  return {
    configure(rows) {
      if (phase !== 'ready') return false;
      const valid = validatePokerSchedule(rows);
      if (!valid || !Number.isSafeInteger(now() + valid.reduce((sum,row) => sum + row.duration * 60000,0))) return false;
      schedule = valid; index = 0; remaining = fullDuration(); return true;
    },
    start() {
      if (phase !== 'ready' && phase !== 'paused') return false;
      deadline = now() + remaining; phase = 'running'; return true;
    },
    pause() { sync(); if (phase === 'running') { phase = 'paused'; deadline = null; } },
    navigate(offset) {
      sync();
      if (!['running','paused'].includes(phase) || ![-1,1].includes(offset) || index + offset < 0 || index + offset >= schedule.length) return false;
      index += offset; remaining = fullDuration();
      deadline = phase === 'running' ? now() + remaining : null;
      revision++; notice = {kind:'manual', crossed:1}; return true;
    },
    reset() { phase = 'ready'; index = 0; remaining = fullDuration(); deadline = null; revision++; notice = null; },
    snapshot() {
      sync();
      return {schedule:schedule.map(row => ({...row})), phase, index, remaining, deadline, revision, notice:notice && {...notice}};
    },
    serialize() {
      sync();
      return {version:1, schedule:schedule.map(row => ({...row})), phase, index, remaining:phase === 'running'?null:remaining, deadline, notice:notice && {...notice}};
    }
  };
}

const POKER_TIMER_KEY = 'tablefolk-poker-tournament-v1';
let pokerTimerStorageOK = true, pokerTimerSaved = null;
try { pokerTimerSaved = JSON.parse(localStorage.getItem(POKER_TIMER_KEY) || 'null'); } catch { pokerTimerStorageOK = false; }
const pokerTimer = createPokerTimer(() => Date.now(), pokerTimerSaved);
let pokerTimerDraft = pokerTimer.snapshot().schedule.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key,String(value)])));
let pokerTimerInterval = null, pokerTimerLastSaved = '', pokerTimerSeenRevision = 0;
let pokerTimerError = false, pokerTimerAudio = null, pokerTimerSound = false, pokerTimerSoundFailed = false;

function pokerTimerRows() {
  return pokerTimerDraft.map(row => ({type:row.type, duration:row.duration.trim() === ''?NaN:Number(row.duration),
    ...(row.type === 'level'?{smallBlind:row.smallBlind.trim() === ''?NaN:Number(row.smallBlind), bigBlind:row.bigBlind.trim() === ''?NaN:Number(row.bigBlind), ante:row.ante.trim() === ''?0:Number(row.ante)}:{})}));
}
function pokerTimerRowTitle(row, index, rows) {
  if (row.type === 'break') return tr('Break','Descanso');
  const level = rows.slice(0,index + 1).filter(item => item.type === 'level').length;
  return tr(`Level ${level}`,`Nivel ${level}`);
}
function pokerTimerRowSummary(row, index, rows) {
  if (!row) return tr('None · final row','Ninguna · última fila');
  const title = pokerTimerRowTitle(row,index,rows);
  return `${title} · ${row.duration} min${row.type === 'break'?'':` · ${tr('Small blind','Ciega chica')} ${row.smallBlind} / ${tr('Big blind','Ciega grande')} ${row.bigBlind} · ${tr('Ante per player','Ante por jugador')} ${row.ante}`}`;
}
function pokerTimerTime(milliseconds) {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
function pokerTimerView() {
  const ready = pokerTimer.snapshot().phase === 'ready';
  const field = (row,index,key,label,min,optional=false) => `<label>${label}<input id="poker-row-${index}-${key}" data-row="${index}" data-field="${key}" type="number" inputmode="numeric" min="${min}" step="1" ${optional?'':'required'} value="${escapeHTML(row[key])}" ${optional?'placeholder="0"':''}></label>`;
  return `<section class="poker-timer" id="poker-timer" aria-labelledby="poker-timer-heading">
    <h2 id="poker-timer-heading" tabindex="-1">${tr('Tournament blind timer','Reloj de ciegas del torneo')}</h2>
    <p class="poker-timer-hint">${tr('Set your blinds, then start. Each level advances automatically. Antes are per player.','Configura las ciegas y comienza. Los niveles avanzan automáticamente. Los antes son por jugador.')}</p>
    <div class="poker-timer-display">
      <h3 id="poker-timer-current"></h3><strong id="poker-timer-time" aria-label="${tr('Remaining time','Tiempo restante')}"></strong>
      <progress id="poker-timer-progress" max="100" value="0" aria-label="${tr('Current level progress','Avance del nivel actual')}"></progress><p id="poker-timer-blinds"></p><p id="poker-timer-phase" role="status"></p>
    </div>
    <p id="poker-timer-next"></p><p id="poker-timer-notice" role="status" aria-atomic="true" hidden></p>
    <form id="poker-timer-form" novalidate>
      <div class="poker-timer-actions">
        <button type="submit" id="poker-timer-toggle">${tr('Start','Iniciar')}</button>
        <button type="button" id="poker-timer-previous">${tr('Previous level / break','Nivel / descanso anterior')}</button>
        <button type="button" id="poker-timer-forward">${tr('Next level / break','Siguiente nivel / descanso')}</button>
        <button type="button" id="poker-timer-reset">${tr('Reset / edit schedule','Reiniciar / editar programa')}</button>
      </div>
      <p class="poker-timer-hint" id="poker-navigation-note" ${ready?'hidden':''}>${tr('Previous and next start that level or break from its full duration.', 'Anterior y siguiente reinician la duración completa de ese nivel o descanso.')}</p>
      <p id="poker-timer-error" role="alert" hidden></p>
      <details id="poker-schedule-details" ${ready?'open':''}><summary id="poker-schedule-summary"></summary>
      <fieldset id="poker-timer-settings"><legend>${tr('Ordered schedule · minutes','Programa ordenado · minutos')}</legend>
        <ol class="poker-timer-schedule">${pokerTimerDraft.map((row,index) => `<li data-schedule-row="${index}"><fieldset><legend>${index+1}. ${pokerTimerRowTitle(row,index,pokerTimerDraft)}</legend>
          <div class="poker-timer-fields">${field(row,index,'duration',tr('Duration (minutes)','Duración (minutos)'),1)}${row.type==='level'?field(row,index,'smallBlind',tr('Small blind','Ciega chica'),1)+field(row,index,'bigBlind',tr('Big blind','Ciega grande'),1)+field(row,index,'ante',tr('Ante per player (optional)','Ante por jugador (opcional)'),0,true):`<p>${tr('Break · no blinds or ante','Descanso · sin ciegas ni ante')}</p>`}</div>
          <div class="poker-timer-row-actions"><button type="button" data-poker-edit="up" data-row="${index}" ${index===0?'disabled':''}>${tr('Move up','Subir')}</button><button type="button" data-poker-edit="down" data-row="${index}" ${index===pokerTimerDraft.length-1?'disabled':''}>${tr('Move down','Bajar')}</button><button type="button" data-poker-edit="remove" data-row="${index}" ${pokerTimerDraft.length===1?'disabled':''}>${tr('Remove','Quitar')}</button></div>
        </fieldset></li>`).join('')}</ol>
        <div class="poker-timer-row-actions"><button type="button" data-poker-edit="level">${tr('Add level','Agregar nivel')}</button><button type="button" data-poker-edit="break">${tr('Add break','Agregar descanso')}</button></div>
      </fieldset></details>
    </form>
    <button type="button" id="poker-timer-sound" aria-pressed="${pokerTimerSound}"></button>
    <p class="poker-timer-hint">${tr('Timing continues across views, reloads and sleep; pauses stay paused. Sound needs a click to enable on each page load. It may not play while the browser is suspended; missed sounds are not replayed.','El tiempo continúa al cambiar de vista, recargar o suspender; las pausas se conservan. Activa el sonido con un clic después de cada recarga. Puede no sonar mientras el navegador esté suspendido; no se reproducen avisos atrasados.')}</p>
    <p id="poker-timer-storage" class="poker-timer-hint" hidden></p>
  </section>`;
}
function savePokerTimer() {
  const serialized = JSON.stringify(pokerTimer.serialize());
  if (serialized === pokerTimerLastSaved) return;
  try { localStorage.setItem(POKER_TIMER_KEY, serialized); pokerTimerLastSaved = serialized; }
  catch { pokerTimerStorageOK = false; }
}
function playPokerTimerSound() {
  if (!pokerTimerSound || !pokerTimerAudio || pokerTimerAudio.state !== 'running') return;
  try {
    const oscillator = pokerTimerAudio.createOscillator(), gain = pokerTimerAudio.createGain();
    oscillator.connect(gain); gain.connect(pokerTimerAudio.destination);
    oscillator.frequency.value = 660;
    gain.gain.setValueAtTime(0.12,pokerTimerAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,pokerTimerAudio.currentTime + 0.35);
    oscillator.start(); oscillator.stop(pokerTimerAudio.currentTime + 0.35);
  } catch { pokerTimerSoundFailed = true; pokerTimerSound = false; }
}
function refreshPokerTimer(silent = false) {
  // Read the old deadline before sync to distinguish a timely notice from catch-up.
  const previous = JSON.parse(pokerTimerLastSaved || 'null');
  const clock = pokerTimer.snapshot();
  const changed = clock.revision !== pokerTimerSeenRevision;
  pokerTimerSeenRevision = clock.revision;
  savePokerTimer();
  if (clock.phase === 'running' && pokerTimerInterval === null) pokerTimerInterval = setInterval(() => refreshPokerTimer(),200);
  if (clock.phase !== 'running' && pokerTimerInterval !== null) { clearInterval(pokerTimerInterval); pokerTimerInterval = null; }
  const root = document.getElementById('poker-timer');
  if (changed && !silent && root && !document.hidden && clock.notice && clock.notice.crossed === 1 &&
      (clock.notice.kind === 'manual' || (previous?.deadline !== null && Date.now() - previous?.deadline < 1500))) playPokerTimerSound();
  if (!root) return;
  const setText = (id,value) => { const node = document.getElementById(id); if (node.textContent !== value) node.textContent = value; };
  const current = clock.schedule[clock.index];
  root.dataset.phase = clock.phase;
  const progress = document.getElementById('poker-timer-progress');
  progress.value = 100 * (1 - clock.remaining / (current.duration * 60000));
  const minutes = clock.schedule.reduce((sum, row) => sum + row.duration, 0);
  setText('poker-schedule-summary', tr(`Schedule · ${clock.schedule.length} stages · ${minutes} min`, `Programa · ${clock.schedule.length} etapas · ${minutes} min`));
  document.getElementById('poker-navigation-note').hidden = clock.phase === 'ready';
  setText('poker-timer-current',pokerTimerRowTitle(current,clock.index,clock.schedule));
  setText('poker-timer-time',pokerTimerTime(clock.remaining));
  setText('poker-timer-blinds',current.type === 'break'?tr('No blinds or ante during this break.','Sin ciegas ni ante durante este descanso.'):tr(`Small blind ${current.smallBlind} / Big blind ${current.bigBlind} · Ante per player ${current.ante}`,`Ciega chica ${current.smallBlind} / Ciega grande ${current.bigBlind} · Ante por jugador ${current.ante}`));
  setText('poker-timer-phase',({ready:tr('Ready','Listo'),running:tr('Running','En marcha'),paused:tr('Paused','En pausa'),finished:tr('Tournament schedule finished','Programa del torneo terminado')})[clock.phase]);
  setText('poker-timer-next',`${tr('Next:','Siguiente:')} ${pokerTimerRowSummary(clock.schedule[clock.index+1],clock.index+1,clock.schedule)}`);
  setText('poker-timer-toggle',clock.phase==='running'?tr('Pause','Pausar'):clock.phase==='paused'?tr('Resume','Continuar'):tr('Start','Iniciar'));
  document.getElementById('poker-timer-toggle').disabled = clock.phase === 'finished';
  document.getElementById('poker-timer-settings').disabled = clock.phase !== 'ready';
  const active = ['running','paused'].includes(clock.phase);
  document.getElementById('poker-timer-previous').disabled = !active || clock.index === 0;
  document.getElementById('poker-timer-forward').disabled = !active || clock.index === clock.schedule.length-1;
  root.querySelectorAll('[data-schedule-row]').forEach(node => node.classList.toggle('is-current',Number(node.dataset.scheduleRow) === clock.index));
  const notice = document.getElementById('poker-timer-notice'); notice.hidden = !clock.notice;
  if (clock.notice) setText('poker-timer-notice',clock.notice.kind === 'complete'?tr('Schedule complete. Reset to start again.','Programa terminado. Reinicia para volver a empezar.'):`${clock.notice.kind==='manual'?tr('Row changed:','Cambio de fila:'):tr('Transition:','Transición:')} ${pokerTimerRowSummary(current,clock.index,clock.schedule)}${clock.notice.crossed>1?tr(` · Caught up across ${clock.notice.crossed} rows.`,` · Se recuperó el tiempo de ${clock.notice.crossed} filas.`):''}`);
  document.getElementById('poker-timer-error').hidden = !pokerTimerError;
  setText('poker-timer-error',tr('Check the highlighted fields: use whole minutes and blinds above 0. The big blind must be at least the small blind; ante can be 0 or blank.', 'Revisa los campos marcados: usa minutos y ciegas enteros mayores que 0. La ciega grande debe ser al menos igual a la chica; el ante puede ser 0 o quedar vacío.'));
  setText('poker-timer-sound',pokerTimerSoundFailed?tr('Sound unavailable · try again','Sonido no disponible · reintentar'):pokerTimerSound?tr('Disable transition sound','Desactivar sonido de transición'):tr('Enable transition sound','Activar sonido de transición'));
  document.getElementById('poker-timer-sound').setAttribute('aria-pressed',String(pokerTimerSound));
  document.getElementById('poker-timer-storage').hidden = pokerTimerStorageOK;
  setText('poker-timer-storage',tr('Local saving is unavailable. Keep this page open; reload recovery cannot be saved.','No se puede guardar localmente. Mantén esta página abierta; no se podrá recuperar el estado al recargar.'));
}
function bindPokerTimer() {
  const form = document.getElementById('poker-timer-form'); if (!form) return;
  const configure = () => {
    const rows = pokerTimerRows();
    pokerTimerError = !pokerTimer.configure(rows);
    form.querySelectorAll('[data-field]').forEach(input => {
      const row = rows[Number(input.dataset.row)], key = input.dataset.field;
      if (!row || !(key in row)) return;
      const value = row[key];
      const invalid = !Number.isSafeInteger(value) || value < (key === 'ante' ? 0 : 1) ||
        (key === 'bigBlind' && value < row.smallBlind);
      input.setAttribute('aria-invalid', String(invalid));
      if (invalid) input.setAttribute('aria-describedby', 'poker-timer-error');
      else input.removeAttribute('aria-describedby');
    });
    refreshPokerTimer(true); return !pokerTimerError;
  };
  form.querySelectorAll('[data-field]').forEach(input => input.oninput = () => {
    if (pokerTimer.snapshot().phase !== 'ready') return;
    pokerTimerDraft[Number(input.dataset.row)][input.dataset.field] = input.value;
    configure();
  });
  form.querySelectorAll('[data-poker-edit]').forEach(button => button.onclick = () => {
    if (pokerTimer.snapshot().phase !== 'ready') return;
    const action = button.dataset.pokerEdit, index = Number(button.dataset.row);
    if (action === 'remove' && pokerTimerDraft.length>1) pokerTimerDraft.splice(index,1);
    else if (action === 'up' && index>0) [pokerTimerDraft[index-1],pokerTimerDraft[index]] = [pokerTimerDraft[index],pokerTimerDraft[index-1]];
    else if (action === 'down' && index<pokerTimerDraft.length-1) [pokerTimerDraft[index+1],pokerTimerDraft[index]] = [pokerTimerDraft[index],pokerTimerDraft[index+1]];
    else if (action === 'break') pokerTimerDraft.push({type:'break',duration:'10'});
    else if (action === 'level') pokerTimerDraft.push({type:'level',duration:'20',smallBlind:'100',bigBlind:'200',ante:''});
    configure();
    document.getElementById('poker-timer').outerHTML = pokerTimerView(); bindPokerTimer();
    const target = action==='level'||action==='break'?pokerTimerDraft.length-1:Math.min(pokerTimerDraft.length-1,Math.max(0,index+(action==='up'?-1:action==='down'?1:0)));
    document.getElementById(`poker-row-${target}-duration`)?.focus({preventScroll:true});
  });
  form.onsubmit = event => {
    event.preventDefault();
    const phase = pokerTimer.snapshot().phase;
    if (phase === 'running') pokerTimer.pause();
    else if (phase !== 'ready' || configure()) pokerTimer.start();
    refreshPokerTimer();
    if (pokerTimerError) {
      document.getElementById('poker-schedule-details').open = true;
      form.querySelector('[aria-invalid="true"]')?.focus();
    } else if (phase === 'ready') document.getElementById('poker-schedule-details').open = false;
  };
  document.getElementById('poker-timer-previous').onclick = () => { pokerTimer.navigate(-1); refreshPokerTimer(); };
  document.getElementById('poker-timer-forward').onclick = () => { pokerTimer.navigate(1); refreshPokerTimer(); };
  document.getElementById('poker-timer-reset').onclick = () => {
    if (pokerTimer.snapshot().phase !== 'ready' && !window.confirm(tr('Reset the timer to the first level and unlock the schedule?', '¿Reiniciar el reloj en el primer nivel y habilitar la edición del programa?'))) return;
    pokerTimer.reset(); pokerTimerError = false;
    pokerTimerDraft = pokerTimer.snapshot().schedule.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [key,String(value)])));
    document.getElementById('poker-timer').outerHTML = pokerTimerView(); bindPokerTimer();
    document.getElementById('poker-timer-toggle').focus({preventScroll:true});
  };
  document.getElementById('poker-timer-sound').onclick = async () => {
    if (pokerTimerSound) pokerTimerSound = false;
    else {
      try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!pokerTimerAudio) pokerTimerAudio = new Audio();
        await pokerTimerAudio.resume();
        pokerTimerSound = pokerTimerAudio.state === 'running'; pokerTimerSoundFailed = !pokerTimerSound;
        playPokerTimerSound();
      } catch { pokerTimerSoundFailed = true; pokerTimerSound = false; }
    }
    refreshPokerTimer(true);
  };
  if (pokerTimer.snapshot().phase === 'ready') configure();
  else refreshPokerTimer(true);
}

// Wake-up and reload catch-up never replay missed sounds.
document.addEventListener('visibilitychange',() => refreshPokerTimer(true));
window.addEventListener('pageshow',() => refreshPokerTimer(true));
window.addEventListener('pagehide',savePokerTimer);
refreshPokerTimer(true);
