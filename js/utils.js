/**
 * utils.js
 * Pure, stateless helpers with no DOM or state dependencies.
 */

// ─────────────────────────────────────────────
//  SVG
// ─────────────────────────────────────────────

const _svgParser = new DOMParser();

/**
 * Parses an SVG markup string into a live SVGElement.
 * Use this instead of innerHTML to inject SVG icons.
 */
export function parseSVG(markup) {
  const doc = _svgParser.parseFromString(markup, 'image/svg+xml');
  return document.adoptNode(doc.documentElement);
}

// ─────────────────────────────────────────────
//  URL / domain helpers
// ─────────────────────────────────────────────

/**
 * Returns a Google S2 favicon URL for the given href's origin.
 * Returns null if the href cannot be parsed.
 *
 * Note: favicons are cached by the browser's HTTP cache after the
 * first request — no additional caching layer is needed.
 */
export function getFaviconUrl(href) {
  try {
    const { origin } = new URL(href);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(origin)}`;
  } catch {
    return null;
  }
}

/**
 * Returns the hostname of a URL without the www. prefix.
 * Falls back to the raw string if parsing fails.
 */
export function getDomain(href) {
  try   { return new URL(href).hostname.replace(/^www\./, ''); }
  catch { return href; }
}

// ─────────────────────────────────────────────
//  Colour helpers
// ─────────────────────────────────────────────

/**
 * Converts a 6-digit hex colour string and an alpha [0–1]
 * into a CSS rgba() string.
 */
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────
//  DOM helpers
// ─────────────────────────────────────────────

/** Sets the value of a form element by id (silent no-op if missing). */
export function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}

/** Sets the checked state of a checkbox by id (silent no-op if missing). */
export function setChecked(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(checked);
}
