'use strict';

// Time is derived from a deadline, never from the number of timer callbacks.
// Date.now also accounts for time spent with the device asleep.
function createChessClock(now = () => Date.now()) {
  let minutes = 5, increment = 0, remaining = [300000, 300000];
  let phase = 'ready', active = 0, deadline = 0;
  function sync() {
    if (phase === 'running') {
      remaining[active] = Math.max(0, deadline - now());
      if (remaining[active] === 0) phase = 'finished';
    }
  }
  return {
    configure(base, extra) {
      if (phase !== 'ready' || !Number.isInteger(base) || base < 1 || base > 180 ||
          !Number.isInteger(extra) || extra < 0 || extra > 60) return false;
      minutes = base; increment = extra; remaining = [base * 60000, base * 60000];
      return true;
    },
    start() {
      if (phase !== 'ready' && phase !== 'paused') return;
      deadline = now() + remaining[active]; phase = 'running';
    },
    move(player) {
      sync();
      if (phase !== 'running' || player !== active) return;
      remaining[active] += increment * 1000;
      active = 1 - active; deadline = now() + remaining[active];
    },
    pause() { sync(); if (phase === 'running') phase = 'paused'; },
    reset() { phase = 'ready'; active = 0; remaining = [minutes * 60000, minutes * 60000]; },
    snapshot() { sync(); return {phase, active, remaining: [...remaining], minutes, increment}; }
  };
}

const chessClock = createChessClock();
let chessClockDraft = {minutes: '5', increment: '0'};
try {
  const preference = JSON.parse(localStorage.getItem('tablefolk-chess-clock') || 'null');
  if (preference && chessClock.configure(preference.minutes, preference.increment)) {
    chessClockDraft = {minutes: String(preference.minutes), increment: String(preference.increment)};
  }
} catch {}
let chessClockInterval = null;

function chessClockView() {
  return `<section class="chess-clock" id="chess-clock" aria-labelledby="chess-clock-heading">
    <h2 id="chess-clock-heading">${tr('Chess clock','Reloj de ajedrez')}</h2>
    <p class="chess-clock-hint">${tr('Start with White. After your move, tap your clock to start your opponent’s.','Empiezan las blancas. Después de mover, toca tu reloj para iniciar el de tu rival.')}</p>
    <form id="chess-clock-form">
      <fieldset id="chess-clock-settings"><legend>${tr('Time controls','Control de tiempo')}</legend>
        <label>${tr('Preset','Duración')}<select id="chess-clock-preset">
          ${[3,5,10].map(n=>`<option value="${n}" ${chessClockDraft.minutes===String(n)?'selected':''}>${n} min</option>`).join('')}
          <option value="custom" ${['3','5','10'].includes(chessClockDraft.minutes)?'':'selected'}>${tr('Custom','Otra')}</option>
        </select></label>
        <label>${tr('Minutes per player','Minutos por jugador')}<input id="chess-clock-minutes" type="number" min="1" max="180" step="1" required value="${escapeHTML(chessClockDraft.minutes)}"></label>
        <label>${tr('Seconds added per move','Segundos extra por jugada')}<input id="chess-clock-increment" type="number" min="0" max="60" step="1" required value="${escapeHTML(chessClockDraft.increment)}"></label>
      </fieldset>
      <div class="chess-clock-panels">${[0,1].map(player=>`<button type="button" class="chess-clock-player" id="chess-clock-player-${player}" aria-disabled="true">
        <span>${player===0?tr('White','Blancas'):tr('Black','Negras')}</span>
        <strong id="chess-clock-time-${player}"></strong><span class="chess-clock-player-state" id="chess-clock-state-${player}"></span>
      </button>`).join('')}</div>
      <p id="chess-clock-status" role="status" aria-atomic="true"></p>
      <div class="chess-clock-actions"><button type="submit" id="chess-clock-toggle">${tr('Start','Iniciar')}</button><button type="button" id="chess-clock-reset">${tr('Reset','Reiniciar')}</button></div>
    </form>
    <p class="chess-clock-hint chess-clock-note">${tr('The clock keeps running when you leave this view. Pause it for a break. Reloading starts a fresh clock.','El reloj sigue corriendo al salir de esta vista. Páusalo si haces una pausa. Al recargar la página, el reloj empieza de nuevo.')}</p>
  </section>`;
}

function chessClockTime(milliseconds) {
  const seconds = Math.ceil(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2,'0')}`;
}

function refreshChessClock() {
  const clock = chessClock.snapshot();
  if (clock.phase !== 'running' && chessClockInterval !== null) {
    clearInterval(chessClockInterval); chessClockInterval = null;
  }
  const root = document.getElementById('chess-clock');
  if (!root) return;
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element.textContent !== value) element.textContent = value;
  };
  document.getElementById('chess-clock-settings').disabled = clock.phase !== 'ready';
  for (const player of [0,1]) {
    const running = clock.phase === 'running' && clock.active === player;
    const expired = clock.phase === 'finished' && clock.active === player;
    const button = document.getElementById(`chess-clock-player-${player}`);
    button.classList.toggle('is-active', running);
    button.classList.toggle('is-expired', expired);
    button.setAttribute('aria-disabled', String(!running));
    setText(`chess-clock-time-${player}`, chessClockTime(clock.remaining[player]));
    setText(`chess-clock-state-${player}`, expired?tr('Time is up','Tiempo agotado'):running?tr('Your move · tap when done','Tu turno · toca al terminar'):clock.phase==='paused'&&clock.active===player?tr('Paused','En pausa'):tr('Waiting','En espera'));
  }
  const side = clock.active===0?tr('White','Blancas'):tr('Black','Negras');
  setText('chess-clock-status', clock.phase==='finished'?tr(`${side} ran out of time.`,`${side}: se agotó el tiempo.`):clock.phase==='running'?tr(`${side} to move.`,`${side}: su turno.`):clock.phase==='paused'?tr(`Paused · ${side} to move.`,`En pausa · turno de ${side.toLowerCase()}.`):tr('Ready · White moves first.','Listo · empiezan las blancas.'));
  setText('chess-clock-toggle', clock.phase==='running'?tr('Pause','Pausar'):clock.phase==='paused'?tr('Resume','Continuar'):tr('Start','Iniciar'));
  document.getElementById('chess-clock-toggle').disabled = clock.phase === 'finished';
}

function bindChessClock() {
  const form = document.getElementById('chess-clock-form');
  if (!form) return;
  const minutes = document.getElementById('chess-clock-minutes');
  const increment = document.getElementById('chess-clock-increment');
  const preset = document.getElementById('chess-clock-preset');
  const configure = () => {
    chessClockDraft = {minutes: minutes.value, increment: increment.value};
    if (minutes.validity.valid && increment.validity.valid && chessClock.configure(Number(minutes.value), Number(increment.value))) {
      try { localStorage.setItem('tablefolk-chess-clock', JSON.stringify({minutes:Number(minutes.value), increment:Number(increment.value)})); } catch {}
    }
    refreshChessClock();
  };
  preset.onchange = () => {
    if (preset.value === 'custom') { minutes.focus(); minutes.select(); return; }
    minutes.value = preset.value; configure();
  };
  minutes.oninput = () => { preset.value = ['3','5','10'].includes(minutes.value)?minutes.value:'custom'; configure(); };
  increment.oninput = configure;
  form.onsubmit = event => {
    event.preventDefault();
    if (chessClock.snapshot().phase === 'running') chessClock.pause();
    else {
      if (chessClock.snapshot().phase === 'ready') configure();
      chessClock.start();
      if (chessClock.snapshot().phase === 'running' && chessClockInterval === null) chessClockInterval = setInterval(refreshChessClock, 100);
    }
    refreshChessClock();
  };
  for (const player of [0,1]) document.getElementById(`chess-clock-player-${player}`).onclick = () => { chessClock.move(player); refreshChessClock(); };
  document.getElementById('chess-clock-reset').onclick = () => {
    const phase = chessClock.snapshot().phase;
    if ((phase === 'running' || phase === 'paused') && !window.confirm(tr('Reset both clocks and clear this game?','¿Reiniciar ambos relojes y borrar esta partida?'))) return;
    chessClock.reset();
    const clock = chessClock.snapshot();
    minutes.value = String(clock.minutes); increment.value = String(clock.increment);
    preset.value = ['3','5','10'].includes(minutes.value)?minutes.value:'custom';
    chessClockDraft = {minutes:minutes.value, increment:increment.value};
    refreshChessClock();
  };
  refreshChessClock();
}

document.addEventListener('visibilitychange', refreshChessClock);
window.addEventListener('pageshow', refreshChessClock);
