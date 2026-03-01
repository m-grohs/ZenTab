/**
 * main.js
 * Extension entry point.
 *
 * Responsibilities:
 *  - Import all modules
 *  - Break the links ↔ modal circular dependency by injecting
 *    the openModal callback into links.js after both are loaded
 *  - Run initial render and start the clock
 */

import { applySettings, initSettings } from './settings.js';
import { renderLinks, setOpenModal }   from './links.js';
import { openModal, initModal }        from './modal.js';
import { startClock }                  from './clock.js';

// Inject the modal-open callback into links.js.
// This breaks the would-be circular dep:  links → modal → links
setOpenModal(openModal);

// ── Boot sequence ──────────────────────────
applySettings();   // Apply persisted settings to CSS vars + form
renderLinks();     // Render icon grid from persisted links
startClock();      // Start clock and schedule updates
initModal();       // Wire add/edit link dialog
initSettings();    // Wire all settings panel controls

// Global keyboard shortcuts
document.addEventListener('keydown', e => {
  // Ignore shortcuts when typing in any input / textarea / select
  const tag = document.activeElement?.tagName;
  const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
    || document.activeElement?.isContentEditable;

  if (e.key === 'Escape') {
    document.getElementById('settings-overlay')?.classList.remove('open');
    document.getElementById('settings-panel')?.classList.remove('open');
    document.getElementById('link-overlay')?.classList.remove('open');
    return;
  }

  if (isTyping) return;

  if (e.key === 's' || e.key === 'S') {
    e.preventDefault();
    const overlay = document.getElementById('settings-overlay');
    const panel   = document.getElementById('settings-panel');
    const isOpen  = overlay?.classList.contains('open');
    overlay?.classList.toggle('open', !isOpen);
    panel?.classList.toggle('open', !isOpen);
  }

  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    openModal();
  }
});
