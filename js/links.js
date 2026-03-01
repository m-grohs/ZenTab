/**
 * links.js
 * Renders the icon grid and the settings panel link list.
 * Handles drag-and-drop reordering in both locations.
 *
 * No innerHTML is used — all DOM is built with createElement / parseSVG.
 * The openModal callback is injected from main.js to avoid a
 * circular dependency with modal.js.
 */

import { state, saveLinks } from './state.js';
import { getFaviconUrl, getDomain, parseSVG } from './utils.js';

// ── Injected callback ─────────────────────────
let _openModal = () => {};
export function setOpenModal(fn) { _openModal = fn; }

// ─────────────────────────────────────────────
//  SVG icon definitions (parsed once, cloned on use)
// ─────────────────────────────────────────────

function makeSVG(markup) {
  // Parsed lazily; stored as a factory so each call returns a fresh node
  return () => {
    const p = new DOMParser();
    return document.adoptNode(p.parseFromString(markup, 'image/svg+xml').documentElement);
  };
}

const icons = {
  dots: makeSVG(`<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>`),
  edit: makeSVG(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`),
  up:   makeSVG(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>`),
  down: makeSVG(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`),
  del:  makeSVG(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`),
};

// ─────────────────────────────────────────────
//  Shared helpers
// ─────────────────────────────────────────────

/** Text fallback showing the first letter of the link label. */
export function makeFallback(link) {
  const el       = document.createElement('div');
  el.className   = 'fallback-icon';
  el.textContent = (link.label || getDomain(link.href)).charAt(0).toUpperCase();
  return el;
}

/** Small icon button used in the settings link list. */
function makeIconBtn(iconFactory, title, extraClass) {
  const btn = document.createElement('button');
  btn.className = extraClass ? `isb ${extraClass}` : 'isb';
  btn.title     = title;
  btn.setAttribute('aria-label', title);
  btn.appendChild(iconFactory());
  return btn;
}

// ─────────────────────────────────────────────
//  Grid drag-and-drop
// ─────────────────────────────────────────────

let gridDragSrc = -1;

function setupGridDrag(wrap, globalIdx) {
  wrap.draggable = true;

  wrap.addEventListener('dragstart', e => {
    gridDragSrc = globalIdx;
    wrap.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  wrap.addEventListener('dragend', () => {
    wrap.classList.remove('dragging');
    document.querySelectorAll('.link-wrap').forEach(w => w.classList.remove('drag-over'));
  });

  wrap.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.link-wrap').forEach(w => w.classList.remove('drag-over'));
    if (globalIdx !== gridDragSrc) wrap.classList.add('drag-over');
  });

  wrap.addEventListener('drop', e => {
    e.preventDefault();
    if (gridDragSrc === -1 || gridDragSrc === globalIdx) return;
    const [moved] = state.links.splice(gridDragSrc, 1);
    state.links.splice(globalIdx, 0, moved);
    gridDragSrc = -1;
    saveLinks(state.links);
    renderLinks();
  });
}

// ─────────────────────────────────────────────
//  Main grid
// ─────────────────────────────────────────────

export function renderLinks() {
  const area = document.getElementById('links-area');
  if (!area) return;

  area.replaceChildren();
  area.classList.toggle('hide-labels', !state.settings.showLabels);

  const { rows, perRow } = state.settings;

  for (let r = 0; r < rows; r++) {
    const rowLinks = state.links.slice(r * perRow, (r + 1) * perRow);
    if (rowLinks.length === 0) continue;

    const rowEl     = document.createElement('div');
    rowEl.className = 'link-row';
    rowEl.setAttribute('role', 'listitem');

    rowLinks.forEach((link, i) => {
      const globalIdx = r * perRow + i;

      // Wrapper (drag handle + edit dot positioning)
      const wrap     = document.createElement('div');
      wrap.className = 'link-wrap';
      setupGridDrag(wrap, globalIdx);

      // Anchor
      const a         = document.createElement('a');
      a.className     = 'link-btn';
      a.href          = link.href;
      a.dataset.label = link.label || getDomain(link.href);
      a.setAttribute('aria-label', link.label || getDomain(link.href));
      a.addEventListener('click', e => { e.preventDefault(); window.location.href = link.href; });

      // Icon image or letter fallback
      const iconSrc = link.icon || getFaviconUrl(link.href);
      if (iconSrc) {
        const img = document.createElement('img');
        img.src   = iconSrc;
        img.alt   = '';
        img.addEventListener('error', () => img.replaceWith(makeFallback(link)), { once: true });
        a.appendChild(img);
      } else {
        a.appendChild(makeFallback(link));
      }

      // Edit dot (top-right)
      const editDot = document.createElement('button');
      editDot.className = 'edit-dot';
      editDot.title     = 'Edit link';
      editDot.setAttribute('aria-label', 'Edit link');
      editDot.appendChild(icons.dots());
      editDot.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        _openModal(globalIdx);
      });

      wrap.appendChild(a);
      wrap.appendChild(editDot);
      rowEl.appendChild(wrap);
    });

    area.appendChild(rowEl);
  }

  renderSettingsLinksList();
}

// ─────────────────────────────────────────────
//  Settings panel link list
// ─────────────────────────────────────────────

let listDragSrc = -1;

export function renderSettingsLinksList() {
  const list  = document.getElementById('settings-links-list');
  const count = document.getElementById('links-count');
  if (!list) return;

  if (count) count.textContent = `${state.links.length} saved`;
  list.replaceChildren();

  state.links.forEach((link, idx) => {
    const item     = document.createElement('div');
    item.className = 'sl-item';
    item.draggable = true;
    item.setAttribute('role', 'listitem');

    // Drag
    item.addEventListener('dragstart', e => {
      listDragSrc        = idx;
      item.style.opacity = '0.4';
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.style.opacity = '';
      list.querySelectorAll('.sl-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      list.querySelectorAll('.sl-item').forEach(i => i.classList.remove('drag-over'));
      if (idx !== listDragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (listDragSrc < 0 || listDragSrc === idx) return;
      const [moved] = state.links.splice(listDragSrc, 1);
      state.links.splice(idx, 0, moved);
      listDragSrc = -1;
      saveLinks(state.links);
      renderLinks();
    });

    // Favicon thumbnail
    const src = link.icon || getFaviconUrl(link.href);
    if (src) {
      const img = document.createElement('img');
      img.src   = src;
      img.alt   = '';
      img.addEventListener('error', () => img.remove(), { once: true });
      item.appendChild(img);
    }

    // Label
    const lbl       = document.createElement('span');
    lbl.className   = 'sl-label';
    lbl.textContent = link.label || getDomain(link.href);
    item.appendChild(lbl);

    // Edit
    const editBtn = makeIconBtn(icons.edit, 'Edit');
    editBtn.addEventListener('click', () => _openModal(idx));
    item.appendChild(editBtn);

    // Move up
    if (idx > 0) {
      const upBtn = makeIconBtn(icons.up, 'Move up');
      upBtn.addEventListener('click', () => {
        [state.links[idx - 1], state.links[idx]] = [state.links[idx], state.links[idx - 1]];
        saveLinks(state.links);
        renderLinks();
      });
      item.appendChild(upBtn);
    }

    // Move down
    if (idx < state.links.length - 1) {
      const downBtn = makeIconBtn(icons.down, 'Move down');
      downBtn.addEventListener('click', () => {
        [state.links[idx], state.links[idx + 1]] = [state.links[idx + 1], state.links[idx]];
        saveLinks(state.links);
        renderLinks();
      });
      item.appendChild(downBtn);
    }

    // Delete
    const delBtn = makeIconBtn(icons.del, 'Remove', 'del');
    delBtn.addEventListener('click', () => {
      state.links.splice(idx, 1);
      saveLinks(state.links);
      renderLinks();
    });
    item.appendChild(delBtn);

    list.appendChild(item);
  });
}
