/**
 * clock.js
 * Renders the time and date into the DOM — no innerHTML used.
 */

import { state } from './state.js';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

/** Writes the current time into #clock using proper DOM methods. */
function renderTime(clockEl, h, m, ampm) {
  // Build: "HH:MM[ampm]" as text + span nodes — no innerHTML
  const hText  = document.createTextNode(String(h).padStart(2, '0'));
  const sep    = document.createElement('span');
  sep.className   = 'sep';
  sep.textContent = ':';
  const mText  = document.createTextNode(m);

  clockEl.replaceChildren(hText, sep, mText);

  if (ampm) {
    const ampmEl    = document.createElement('span');
    ampmEl.className   = 'ampm';
    ampmEl.textContent = ampm;
    clockEl.appendChild(ampmEl);
  }
}

/** Reads current time/date and updates the DOM. */
export function updateClock() {
  const now = new Date();
  const s   = state.settings;
  let   h   = now.getHours();
  const m   = String(now.getMinutes()).padStart(2, '0');
  let   ampm = '';

  if (s.clock12h) {
    if (s.showAmpm) ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }

  const clockEl = document.getElementById('clock');
  if (clockEl) renderTime(clockEl, h, m, ampm);

  const dateEl = document.getElementById('date-label');
  if (dateEl) {
    dateEl.textContent =
      `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }
}

/** Starts the clock and schedules updates every second. */
export function startClock() {
  updateClock();
  setInterval(updateClock, 1_000);

  // Resync when the tab becomes visible after being hidden
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) updateClock();
  });
}
