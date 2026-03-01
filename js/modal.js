/**
 * modal.js
 * Manages the Add / Edit Link dialog.
 * Imports renderLinks from links.js — links.js avoids importing
 * from here, breaking the potential circular dependency.
 */

import { state, saveLinks } from './state.js';
import { renderLinks }      from './links.js';

let overlay    = null;
let editingIdx = -1;

// ── Public API ──────────────────────────────

export function openModal(idx = -1) {
  editingIdx  = idx;
  const isEdit = idx >= 0;
  const link   = isEdit ? state.links[idx] : {};

  document.getElementById('link-modal-title').textContent = isEdit ? 'Edit Link' : 'Add Link';
  document.getElementById('lm-confirm').textContent       = isEdit ? 'Save'       : 'Add Link';
  document.getElementById('lm-delete').style.display      = isEdit ? ''           : 'none';
  document.getElementById('lm-href-error').style.display  = 'none';

  document.getElementById('lm-href').value  = link.href  || '';
  document.getElementById('lm-label').value = link.label || '';
  document.getElementById('lm-icon').value  = link.icon  || '';

  overlay.classList.add('open');
  // Focus the URL field after the open transition starts
  setTimeout(() => document.getElementById('lm-href').focus(), 50);
}

export function closeModal() {
  overlay?.classList.remove('open');
}

// ── Private ──────────────────────────────────

function confirmLink() {
  const errEl = document.getElementById('lm-href-error');
  let   href  = document.getElementById('lm-href').value.trim();

  if (!href) {
    errEl.style.display = 'block';
    document.getElementById('lm-href').focus();
    return;
  }

  // Auto-prepend https:// if no protocol given
  if (!/^https?:\/\//i.test(href)) href = 'https://' + href;

  try   { new URL(href); }
  catch {
    errEl.style.display = 'block';
    document.getElementById('lm-href').focus();
    return;
  }

  errEl.style.display = 'none';

  const entry = {
    href,
    label: document.getElementById('lm-label').value.trim() || null,
    icon:  document.getElementById('lm-icon').value.trim()  || null,
  };

  if (editingIdx >= 0) {
    state.links[editingIdx] = entry;
  } else {
    state.links.push(entry);
  }

  saveLinks(state.links);
  renderLinks();
  closeModal();
}

// ── Init ─────────────────────────────────────

export function initModal() {
  overlay = document.getElementById('link-overlay');

  document.getElementById('btn-add').addEventListener('click', () => openModal());
  document.getElementById('lm-cancel').addEventListener('click', closeModal);
  document.getElementById('lm-confirm').addEventListener('click', confirmLink);

  document.getElementById('lm-delete').addEventListener('click', () => {
    if (editingIdx < 0) return;
    state.links.splice(editingIdx, 1);
    saveLinks(state.links);
    renderLinks();
    closeModal();
  });

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });

  // Keyboard shortcuts inside the modal
  document.getElementById('link-modal').addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmLink(); }
    if (e.key === 'Escape') closeModal();
  });
}
