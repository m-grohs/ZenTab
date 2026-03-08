/**
 * state.js
 * Single source of truth — defaults, mutable state, and
 * localStorage persistence helpers.
 */

const LINKS_KEY    = 'zentab_links';
const SETTINGS_KEY = 'zentab_settings';

export const DEFAULTS = Object.freeze({
  rows:          2,
  perRow:        5,
  rowGap:        20,
  iconGap:       18,
  iconSize:      56,
  highlight:     '#7c6af7',
  linkBg:        '#1a1a1f',
  linkBgOpacity: 1,
  bg:            '#0f0f11',
  bgType:        'color',   // 'color' | 'url' | 'file'
  bgUrl:         '',
  bgFit:         'cover',
  bgDataUrl:     '',
  clock12h:      false,
  showAmpm:      true,
  showDate:      true,
  showClock:     true,
  showLabels:    true,
  clockSize:     80,
  dateSize:      13,
  font:          "'Geist', sans-serif",
  fontCustom:    '',
  textColor:     null,
  // Search bar
  showSearch:         true,
  showVoice:          true,
  searchEngine:       'google',
  searchUrl:          '',
  searchBarBg:        '',
  searchBarTextColor: null,
  searchBarWidth:     520,
  searchBarHeight:    40,
  searchBarFontSize:  14,
  searchGapTop:       0,
  searchGapBottom:    0,
});

// ── Persistence ──────────────────────────────

export function loadLinks() {
  try   { return JSON.parse(localStorage.getItem(LINKS_KEY)) ?? []; }
  catch { return []; }
}

export function saveLinks(links) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

export function loadSettings() {
  try   { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; }
  catch { return { ...DEFAULTS }; }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Live mutable state ───────────────────────
// All modules share this single object.
export const state = {
  links:    loadLinks(),
  settings: loadSettings(),
};
