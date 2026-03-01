# ZenTab

A minimal, fully customisable new tab extension for Firefox and Chrome. Replaces the browser's default new tab page with a clean dark interface featuring a live clock, icon-link grid, and wallpaper support.

---

## Features

- **Clock & date** — 12/24-hour, AM/PM, independent show/hide for clock and date
- **Icon links** — configurable rows, columns, gap, and size; drag-and-drop reorder; auto-fetches favicons
- **Wallpaper** — solid colour, remote image URL, or local file; Cover / Contain / Stretch / None fit modes
- **Typography** — 8 bundled Google Fonts + custom font input; text colour override
- **Colours** — accent/highlight colour, link button background with opacity slider
- **Import / Export** — full JSON backup with date-stamped filename
- **Keyboard shortcuts** — `S` opens Settings, `N` opens Add Link (inactive while typing)

---

## Installation

### Firefox

Install the extension directly from the [Firefox extension page](https://)

or

1. Download the latest [release](https://github.com/m-grohs/ZenTab/releases) zip and unzip it.
2. Go to `about:debugging` → **This Firefox** → **Load Temporary Add-on**.
3. Select `manifest.json` inside the unzipped folder.

### Chrome / Edge / Brave

> [!Note]
> Due to missing a Chrome Developer Account this extension cannot be provided on the Chrome Web Store and only is available via direct download!


1. Download the latest [release](https://github.com/m-grohs/ZenTab/releases) zip and unzip it.
2. Go to `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped folder.

---

## Home Button Limitation

Browsers only allow extensions to override the **new tab** page — not the home button. This is a deliberate browser security boundary and cannot be worked around programmatically.

### Firefox workaround

The common advice is to set your home page to `about:newtab`, which normally routes through the extension. This doesn't work in all Firefox forks (e.g. Zen Browser).

A reliable alternative that works across Firefox-based browsers: **with only one tab open** (the ZenTab page itself, not counting the settings page), open Firefox settings and click **Use Current Page** for the home button. Firefox will lock onto that tab's URL, which is the extension page, and the home button will load ZenTab from then on.

### Chrome / Edge

No equivalent workaround exists. Chrome's home button goes to a user-defined URL, and the extension URL changes every time you reload an unpacked extension. For permanent installs from the Chrome Web Store the ID is stable — you could paste that URL into Chrome's home button setting.

---

## Settings Overview

| Section | What you can change |
|---|---|
| Typography | Font family, text colour |
| Clock | Show/hide clock + date independently, 12/24h, AM/PM, sizes |
| Links | Tooltips, rows, per-row count, gaps, icon size |
| Colors | Highlight/hover colour, link button background + opacity |
| Background | Solid colour · Image URL · Local file — all with fit options |
| Data | Export JSON (date-stamped) · Import JSON |

---

## Favicon Caching

Favicons are fetched from Google's S2 service (`google.com/s2/favicons`). The browser's built-in HTTP cache handles caching automatically — icons are not re-downloaded on every new tab unless the cache entry has expired (typically days to weeks). No additional caching layer is needed.

---

## Data & Privacy

All data (links, settings, wallpaper) is stored locally in `localStorage` inside the extension's own page. Nothing is transmitted to any server. The extension requests no special browser permissions beyond replacing the new tab page.

---

## LICENSE

This project is licensed under the PolyForm Noncommercial License 1.0.0.

Commercial use is not permitted without explicit written permission.

---

## Links

- **GitHub** — [github.com/m-grohs/ZenTab](https://github.com/m-grohs/ZenTab)
- **Ko-fi** — [ko-fi.com/mgrohs](https://ko-fi.com/mgrohs)
