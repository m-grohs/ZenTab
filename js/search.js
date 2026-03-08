/**
 * search.js
 * Search bar with inline SVG icon buttons (clear, mic, submit).
 *
 * Voice: Chromium Web Speech API only. Firefox/Zen never shipped it.
 * When unavailable the mic button is not rendered and its settings
 * toggle is hidden entirely.
 */

import { state } from './state.js';

// ─────────────────────────────────────────────
//  Engine map
// ─────────────────────────────────────────────

export const ENGINES = {
	google: { label: 'Google', url: 'https://www.google.com/search?q={query}' },
	bing: { label: 'Bing', url: 'https://www.bing.com/search?q={query}' },
	ddg: { label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={query}' },
	brave: { label: 'Brave', url: 'https://search.brave.com/search?q={query}' },
	startpage: { label: 'Startpage', url: 'https://www.startpage.com/search?q={query}' },
	custom: { label: 'Custom…', url: '' }
};

// ─────────────────────────────────────────────
//  Speech API — Chromium only
// ─────────────────────────────────────────────

export const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

// ─────────────────────────────────────────────
//  SVG builder — createElementNS only, no DOMParser
// ─────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function makeSVG(size, children) {
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('width', size);
	svg.setAttribute('height', size);
	svg.setAttribute('fill', 'none');
	svg.setAttribute('aria-hidden', 'true');
	for (const [tag, attrs] of children) {
		const el = document.createElementNS(SVG_NS, tag);
		for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
		svg.appendChild(el);
	}
	return svg;
}

function iconClear(color) {
	const svg = makeSVG(16, [
		['line', { x1: '18', y1: '6', x2: '6', y2: '18', stroke: color, 'stroke-width': '2.5', 'stroke-linecap': 'round' }],
		['line', { x1: '6', y1: '6', x2: '18', y2: '18', stroke: color, 'stroke-width': '2.5', 'stroke-linecap': 'round' }]
	]);
	return svg;
}

function iconMic(color) {
	return makeSVG(16, [
		['rect', { x: '9', y: '2', width: '6', height: '11', rx: '3', stroke: color, 'stroke-width': '2' }],
		['path', { d: 'M19 10a7 7 0 0 1-14 0', stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round' }],
		['line', { x1: '12', y1: '19', x2: '12', y2: '23', stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round' }],
		['line', { x1: '8', y1: '23', x2: '16', y2: '23', stroke: color, 'stroke-width': '2', 'stroke-linecap': 'round' }]
	]);
}

function iconSearch(color) {
	return makeSVG(16, [
		['circle', { cx: '11', cy: '11', r: '7', stroke: color, 'stroke-width': '2.2' }],
		['line', { x1: '21', y1: '21', x2: '16.65', y2: '16.65', stroke: color, 'stroke-width': '2.2', 'stroke-linecap': 'round' }]
	]);
}

// ─────────────────────────────────────────────
//  Module refs
// ─────────────────────────────────────────────

let inputEl = null;
let clearBtn = null;
let micBtn = null;
let recognition = null;
let isListening = false;

// ─────────────────────────────────────────────
//  Search
// ─────────────────────────────────────────────

function doSearch() {
	const query = inputEl?.value.trim();
	if (!query) return;
	const s = state.settings;
	const key = s.searchEngine ?? 'google';
	const tmpl = key === 'custom' ? s.searchUrl || ENGINES.google.url : (ENGINES[key]?.url ?? ENGINES.google.url);
	window.location.href = tmpl.replace('{query}', encodeURIComponent(query));
}

// ─────────────────────────────────────────────
//  Clear sync
// ─────────────────────────────────────────────

function syncClear() {
	if (!clearBtn) return;
	clearBtn.style.display = inputEl?.value.length ? '' : 'none';
}

// ─────────────────────────────────────────────
//  Voice (Chromium only)
// ─────────────────────────────────────────────

function startListening() {
	if (!SpeechRecognition || isListening) return;
	recognition = new SpeechRecognition();
	recognition.lang = navigator.language || 'en-US';
	recognition.interimResults = true;
	recognition.continuous = false;
	recognition.maxAlternatives = 1;

	recognition.addEventListener('start', () => {
		isListening = true;
		micBtn?.classList.add('listening');
		micBtn?.setAttribute('aria-label', 'Stop voice input');
		// Update stroke attributes directly — CSS cannot override SVG presentation attributes
		micBtn?.querySelectorAll('svg [stroke]').forEach((el) => el.setAttribute('stroke', '#ef4444'));
	});

	recognition.addEventListener('result', (e) => {
		let t = '';
		for (const r of e.results) t += r[0].transcript;
		if (inputEl) {
			inputEl.value = t;
			syncClear();
		}
		if (e.results[e.results.length - 1].isFinal) {
			stopListening();
			doSearch();
		}
	});

	recognition.addEventListener('error', stopListening);
	recognition.addEventListener('end', stopListening);
	recognition.start();
}

function stopListening() {
	if (!isListening) return;
	isListening = false;
	micBtn?.classList.remove('listening');
	micBtn?.setAttribute('aria-label', 'Start voice search');
	// Restore stroke to current text colour
	const col = state.settings.searchBarTextColor || state.settings.textColor || '#e8e8f0';
	micBtn?.querySelectorAll('svg [stroke]').forEach((el) => el.setAttribute('stroke', col));
	try {
		recognition?.stop();
	} catch {
		/* already ended */
	}
	recognition = null;
}

// ─────────────────────────────────────────────
//  DOM build
// ─────────────────────────────────────────────

function buildSearchBar() {
	const wrap = document.getElementById('search-wrap');
	if (!wrap) return;
	wrap.replaceChildren();

	const bar = document.createElement('div');
	bar.id = 'search-bar-inner';

	// ── Input ──
	inputEl = document.createElement('input');
	inputEl.type = 'text';
	inputEl.id = 'search-input';
	inputEl.placeholder = 'Search…';
	inputEl.autocomplete = 'off';
	inputEl.spellcheck = false;
	inputEl.setAttribute('aria-label', 'Search the web');
	inputEl.addEventListener('input', syncClear);
	inputEl.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			doSearch();
		}
		if (e.key === 'Escape') {
			inputEl.value = '';
			syncClear();
			inputEl.blur();
		}
	});

	// ── Icon cluster ──
	const actions = document.createElement('div');
	actions.className = 'search-actions';

	// Resolve icon colour once for initial build
	const s0 = state.settings;
	const initialColor = s0.searchBarTextColor || s0.textColor || '#e8e8f0';

	// Clear ×
	clearBtn = document.createElement('button');
	clearBtn.className = 'search-action-btn';
	clearBtn.style.display = 'none';
	clearBtn.setAttribute('aria-label', 'Clear');
	clearBtn.setAttribute('title', 'Clear');
	clearBtn.appendChild(iconClear(initialColor));
	clearBtn.addEventListener('click', () => {
		inputEl.value = '';
		syncClear();
		inputEl.focus();
	});
	actions.appendChild(clearBtn);

	// Mic (Chromium only, and only when setting is on)
	if (SpeechRecognition && state.settings.showVoice !== false) {
		micBtn = document.createElement('button');
		micBtn.id = 'search-mic';
		micBtn.className = 'search-action-btn search-mic-btn';
		micBtn.setAttribute('aria-label', 'Start voice search');
		micBtn.setAttribute('title', 'Voice search');
		micBtn.appendChild(iconMic(initialColor));
		micBtn.addEventListener('click', () => {
			if (isListening) stopListening();
			else startListening();
		});
		actions.appendChild(micBtn);
	}

	// Submit
	const submitBtn = document.createElement('button');
	submitBtn.id = 'search-submit';
	submitBtn.className = 'search-action-btn';
	submitBtn.setAttribute('aria-label', 'Search');
	submitBtn.setAttribute('title', 'Search');
	submitBtn.appendChild(iconSearch(initialColor));
	submitBtn.addEventListener('click', doSearch);
	actions.appendChild(submitBtn);

	bar.appendChild(inputEl);
	bar.appendChild(actions);
	wrap.appendChild(bar);
}

// ─────────────────────────────────────────────
//  Update icon stroke colors to match current text color
// ─────────────────────────────────────────────

function updateIconColors() {
	const actions = document.querySelector('.search-actions');
	if (!actions) return;
	const s = state.settings;
	const color = s.searchBarTextColor || s.textColor || '#e8e8f0';
	// Update every stroke attribute on every icon SVG line/path/circle/rect
	actions.querySelectorAll('svg [stroke]').forEach((el) => {
		// Skip listening state (red stroke set separately)
		if (!micBtn?.classList.contains('listening')) {
			el.setAttribute('stroke', color);
		}
	});
}

// ─────────────────────────────────────────────
//  Apply settings
// ─────────────────────────────────────────────

export function applySearchSettings() {
	const wrap = document.getElementById('search-wrap');
	if (!wrap) return;

	const s = state.settings;
	const R = document.documentElement;

	wrap.style.display = s.showSearch !== false ? '' : 'none';

	if (micBtn && SpeechRecognition) {
		micBtn.style.display = s.showVoice !== false ? '' : 'none';
	}

	const fontSize = Math.min(Math.max(s.searchBarFontSize ?? 14, 10), 72);
	R.style.setProperty('--search-bar-font-size', fontSize + 'px');

	const minH = s.searchBarHeight ?? 40;
	const autoH = Math.round(fontSize * 2.4);
	const height = Math.min(Math.max(minH, autoH), 120);
	R.style.setProperty('--search-bar-height', height + 'px');

	R.style.setProperty('--search-bar-width', `min(${s.searchBarWidth ?? 520}px, 88vw)`);
	R.style.setProperty('--search-gap-top', (s.searchGapTop ?? 0) + 'px');
	R.style.setProperty('--search-gap-bottom', (s.searchGapBottom ?? 0) + 'px');

	R.style.setProperty('--search-bg', s.searchBarBg || 'rgba(26, 26, 31, 0.72)');

	if (s.searchBarTextColor) {
		R.style.setProperty('--search-text', s.searchBarTextColor);
	} else {
		R.style.removeProperty('--search-text');
	}

	updateIconColors();
}

// ─────────────────────────────────────────────
//  Init
// ─────────────────────────────────────────────

export function initSearch() {
	buildSearchBar();
	applySearchSettings();
}
