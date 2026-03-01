/**
 * settings.js
 * Applies state → DOM, wires all settings-panel controls,
 * and handles import/export.
 */

import { state, DEFAULTS, saveSettings, saveLinks } from './state.js';
import { hexToRgba, setInputValue, setChecked }     from './utils.js';
import { renderLinks }                               from './links.js';
import { updateClock }                               from './clock.js';

// ─────────────────────────────────────────────
//  Apply settings → DOM
// ─────────────────────────────────────────────

export function applySettings() {
  const R = document.documentElement;
  const s = state.settings;

  // CSS custom properties
  R.style.setProperty('--row-gap',     s.rowGap    + 'px');
  R.style.setProperty('--icon-gap',    s.iconGap   + 'px');
  R.style.setProperty('--icon-size',   s.iconSize  + 'px');
  R.style.setProperty('--highlight',   s.highlight);
  R.style.setProperty('--accent-glow', hexToRgba(s.highlight, 0.18));
  R.style.setProperty('--clock-size',  s.clockSize + 'px');
  R.style.setProperty('--date-size',   s.dateSize  + 'px');
  R.style.setProperty('--font-ui',     resolvedFont(s));

  // Link bg + border share opacity
  const linkOpacity = s.linkBgOpacity ?? 1;
  R.style.setProperty('--link-bg',     hexToRgba(s.linkBg || '#1a1a1f', linkOpacity));
  R.style.setProperty('--link-border', `rgba(46, 46, 56, ${linkOpacity})`);

  // Text colour override (null = theme default)
  if (s.textColor) {
    R.style.setProperty('--text',       s.textColor);
    R.style.setProperty('--text-muted', hexToRgba(s.textColor, 0.45));
  } else {
    R.style.removeProperty('--text');
    R.style.removeProperty('--text-muted');
  }

  applyBackground(s);

  // Misc DOM visibility
  document.getElementById('links-area')?.classList.toggle('hide-labels', !s.showLabels);
  showEl('clock-wrap',       s.showClock);
  showEl('date-label',       s.showDate);
  showEl('row-ampm-toggle',  s.clock12h);

  syncForm(s);
}

function resolvedFont(s) {
  return (s.font === '__custom__' && s.fontCustom) ? s.fontCustom : s.font;
}

function applyBackground(s) {
  const page = document.getElementById('page');
  if (!page) return;

  Object.assign(page.style, {
    backgroundImage:    '',
    backgroundColor:    '',
    backgroundSize:     '',
    backgroundPosition: '',
    backgroundRepeat:   '',
  });

  const fitValue = s.bgFit === 'fill' ? '100% 100%' : (s.bgFit || 'cover');

  if (s.bgType === 'url' && s.bgUrl) {
    Object.assign(page.style, {
      backgroundImage:    `url(${JSON.stringify(s.bgUrl)})`,
      backgroundSize:     fitValue,
      backgroundPosition: 'center',
      backgroundRepeat:   'no-repeat',
      backgroundColor:    '#000',
    });
  } else if (s.bgType === 'file' && s.bgDataUrl) {
    Object.assign(page.style, {
      backgroundImage:    `url(${JSON.stringify(s.bgDataUrl)})`,
      backgroundSize:     fitValue,
      backgroundPosition: 'center',
      backgroundRepeat:   'no-repeat',
      backgroundColor:    '#000',
    });
  } else {
    page.style.backgroundColor = s.bg || '#0f0f11';
  }
}

function syncForm(s) {
  setInputValue('s-rows',            s.rows);
  setInputValue('s-per-row',         s.perRow);
  setInputValue('s-row-gap',         s.rowGap);
  setInputValue('s-icon-gap',        s.iconGap);
  setInputValue('s-icon-size',       s.iconSize);
  setInputValue('s-highlight-text',  s.highlight);
  setInputValue('s-highlight-color', s.highlight);
  setInputValue('s-link-bg-text',    s.linkBg || '');
  setInputValue('s-link-bg-color',   s.linkBg || '#1a1a1f');
  setInputValue('s-bg-text',         s.bg || '');
  setInputValue('s-bg-color',        s.bg || '#0f0f11');
  setInputValue('s-bg-url',          s.bgUrl || '');
  setInputValue('s-text-color-text', s.textColor || '');
  setInputValue('s-text-color-pick', s.textColor || '#e8e8f0');
  setInputValue('s-clock-size',      s.clockSize);
  setInputValue('s-date-size',       s.dateSize);
  setInputValue('s-bg-fit',          s.bgFit || 'cover');

  const opVal   = s.linkBgOpacity ?? 1;
  setInputValue('s-link-bg-opacity', opVal);
  const opLabel = document.getElementById('s-link-bg-opacity-val');
  if (opLabel) opLabel.textContent = Math.round(opVal * 100) + '%';

  setChecked('s-show-clock',  s.showClock);
  setChecked('s-show-date',   s.showDate);
  setChecked('s-clock-12h',   s.clock12h);
  setChecked('s-show-ampm',   s.showAmpm);
  setChecked('s-show-labels', s.showLabels);

  // Font selector
  const fontSel  = document.getElementById('s-font');
  const fontCust = document.getElementById('s-font-custom');
  if (fontSel) {
    const knownFonts = Array.from(fontSel.options).map(o => o.value);
    const isCustom   = s.font === '__custom__' || !knownFonts.includes(s.font);
    fontSel.value = isCustom ? '__custom__' : s.font;
    if (fontCust) {
      fontCust.style.display = isCustom ? '' : 'none';
      fontCust.value         = s.fontCustom || '';
    }
  }

  // Background tabs
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.bg === s.bgType);
    b.setAttribute('aria-selected', String(b.dataset.bg === s.bgType));
  });
  showEl('bg-color-section', s.bgType === 'color');
  showEl('bg-url-section',   s.bgType === 'url');
  showEl('bg-file-section',  s.bgType === 'file');
  showEl('bg-fit-section',   s.bgType === 'url' || s.bgType === 'file');

  // File section status
  const fileStatus = document.getElementById('bg-file-status');
  if (fileStatus) fileStatus.textContent = s.bgDataUrl ? '✓ Image loaded' : 'No file chosen';
  const clearBtn = document.getElementById('btn-bg-clear');
  if (clearBtn) clearBtn.style.display = s.bgDataUrl ? '' : 'none';
}

function showEl(id, visible) {
  const el = document.getElementById(id);
  if (el) el.style.display = visible ? '' : 'none';
}

// ─────────────────────────────────────────────
//  Convenience setter
// ─────────────────────────────────────────────

export function setSetting(field, value, rerender = false) {
  state.settings[field] = value;
  saveSettings(state.settings);
  applySettings();
  if (rerender) renderLinks();
}

// ─────────────────────────────────────────────
//  Wiring helpers
// ─────────────────────────────────────────────

function wireNumber(id, field) {
  document.getElementById(id)?.addEventListener('input', e => setSetting(field, +e.target.value, true));
}

function wireToggle(id, field, onChange) {
  document.getElementById(id)?.addEventListener('change', e => {
    setSetting(field, e.target.checked, field === 'showLabels');
    onChange?.(e.target.checked);
  });
}

function wireColor(textId, pickId, field, rerender = false) {
  document.getElementById(pickId)?.addEventListener('input', e => {
    setInputValue(textId, e.target.value);
    setSetting(field, e.target.value, rerender);
  });
  document.getElementById(textId)?.addEventListener('input', e => {
    const v = e.target.value.trim();
    if (v === '') {
      setSetting(field, null, rerender);
    } else if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setInputValue(pickId, v);
      setSetting(field, v, rerender);
    }
  });
}

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────

export function initSettings() {
  const overlay = document.getElementById('settings-overlay');
  const panel   = document.getElementById('settings-panel');

  const openPanel  = () => { overlay.classList.add('open');    panel.classList.add('open'); };
  const closePanel = () => { overlay.classList.remove('open'); panel.classList.remove('open'); };

  document.getElementById('btn-settings')?.addEventListener('click', openPanel);
  document.getElementById('btn-settings-close')?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closePanel(); });

  // Typography
  document.getElementById('s-font')?.addEventListener('change', e => {
    const v      = e.target.value;
    const custEl = document.getElementById('s-font-custom');
    if (custEl) custEl.style.display = v === '__custom__' ? '' : 'none';
    if (v === '__custom__') { custEl?.focus(); setSetting('font', '__custom__'); }
    else setSetting('font', v);
  });
  document.getElementById('s-font-custom')?.addEventListener('input', e => {
    state.settings.fontCustom = e.target.value.trim();
    state.settings.font       = '__custom__';
    saveSettings(state.settings);
    applySettings();
  });
  wireColor('s-text-color-text', 's-text-color-pick', 'textColor');

  // Clock
  wireToggle('s-show-clock', 'showClock');
  wireToggle('s-show-date',  'showDate');
  wireToggle('s-clock-12h',  'clock12h', shown => showEl('row-ampm-toggle', shown));
  wireToggle('s-show-ampm',  'showAmpm');
  wireNumber('s-clock-size', 'clockSize');
  wireNumber('s-date-size',  'dateSize');

  // Links
  wireToggle('s-show-labels', 'showLabels', shown => {
    document.getElementById('links-area')?.classList.toggle('hide-labels', !shown);
  });
  wireNumber('s-rows',      'rows');
  wireNumber('s-per-row',   'perRow');
  wireNumber('s-row-gap',   'rowGap');
  wireNumber('s-icon-gap',  'iconGap');
  wireNumber('s-icon-size', 'iconSize');

  // Colors
  wireColor('s-highlight-text', 's-highlight-color', 'highlight', true);
  wireColor('s-link-bg-text',   's-link-bg-color',   'linkBg',    true);
  document.getElementById('s-link-bg-opacity')?.addEventListener('input', e => {
    const v     = parseFloat(e.target.value);
    const label = document.getElementById('s-link-bg-opacity-val');
    if (label) label.textContent = Math.round(v * 100) + '%';
    setSetting('linkBgOpacity', v, true);
  });

  // Background
  wireColor('s-bg-text', 's-bg-color', 'bg');
  document.getElementById('s-bg-url')?.addEventListener('input', e => {
    setSetting('bgUrl', e.target.value.trim());
  });
  document.getElementById('s-bg-fit')?.addEventListener('change', e => setSetting('bgFit', e.target.value));
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setSetting('bgType', btn.dataset.bg));
  });

  // Local file picker (stored as base64 so it persists across reloads)
  document.getElementById('btn-bg-filepick')?.addEventListener('click', () => {
    document.getElementById('bg-file-input')?.click();
  });
  document.getElementById('bg-file-input')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', ev => {
      state.settings.bgDataUrl = ev.target.result;
      state.settings.bgType    = 'file';
      saveSettings(state.settings);
      applySettings();
      const st = document.getElementById('bg-file-status');
      if (st) st.textContent = `✓ ${file.name}`;
    });
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  document.getElementById('btn-bg-clear')?.addEventListener('click', () => {
    state.settings.bgDataUrl = '';
    state.settings.bgType    = 'color';
    saveSettings(state.settings);
    applySettings();
  });

  // Import / Export
  document.getElementById('btn-export')?.addEventListener('click', exportData);
  document.getElementById('btn-import')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
  document.getElementById('import-file')?.addEventListener('change', importData);
}

// ─────────────────────────────────────────────
//  Import / Export
// ─────────────────────────────────────────────

function exportData() {
  const exportSettings = { ...state.settings };
  // Strip large base64 wallpaper — user can re-pick after import
  if (exportSettings.bgDataUrl?.length > 200) {
    exportSettings.bgDataUrl = '__local_file_not_exported__';
  }

  const now      = new Date();
  const pad      = n => String(n).padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `zentab-backup-${datePart}_${timePart}.json`;

  const json = JSON.stringify({ settings: exportSettings, links: state.links }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function importData(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener('load', ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (data.settings && typeof data.settings === 'object') {
        state.settings = { ...DEFAULTS, ...data.settings };
        saveSettings(state.settings);
      }
      if (Array.isArray(data.links)) {
        state.links = data.links;
        saveLinks(state.links);
      }
      applySettings();
      renderLinks();
      updateClock();
      showToast('✓ Import successful');
    } catch {
      console.error('[ZenTab] Import failed — invalid JSON');
      showToast('✕ Import failed — invalid file', true);
    }
  });

  reader.readAsText(file);
  e.target.value = '';
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className   = 'zt-toast';
  toast.textContent = message;
  if (isError) toast.classList.add('zt-toast--error');
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('zt-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('zt-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, 2_500);
}
