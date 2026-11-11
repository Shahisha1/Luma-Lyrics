# Changelog

## Unreleased

- Split development code into focused modules for settings, lyrics parsing, romanization, translation, and overlay styling while keeping the generated single-file Spicetify extension.
- Add a dependency-free build command and CI check that verifies the committed distributable matches source.
- Expand tests for settings migration, translation caching/cancellation, romanization, and style installation.


## v2.3.1

- **Fixed the playbar toggle stacking on Spotify's queue icon.** The toggle mounted *inside* the queue button's own container, which Spotify builds for a single button (about 49 px), so the two icons stacked vertically flush with no gap. The toggle now mounts beside that container as its own block in the same flex row (order: queue, then Luma Lyrics), verified on client 1.3.8.620.
- Companion API bumped to `window.LumaLyrics.version = 2.3.1` (hooks unchanged).

## v2.3.0

- **Bigger now-playing card** in both windowed and fullscreen modes (wider column, larger artwork, larger title/artist, larger playback buttons in fullscreen).
- **Apple Music-style lyrics**: heavier type, softly blurred and dimmed inactive lines, gentle scale-and-slide on the active line with slower spring-like motion (word/line modes; Gentle and Static keep their calm behavior).
- **Translate lyrics** (Settings → Translation): shows a translated line under each lyric via Google Translate, with a language picker and per-line caching. Requests go directly from the client; turns off cleanly if offline.
- **Romanize lyrics** (Settings → Translation): built-in, offline romanization for Korean (Revised), Japanese (Hepburn, kana), and Cyrillic; shown under the original line and preferred over the translation when both are on. Chinese/kanji are left as-is.
- **Overlay fixes**: toolbar and settings now sit on explicit z-index layers above lyrics, lyrics pane gets `overscroll-behavior: contain` so scrolling never bleeds into Spotify, and dead CSS from the old card markup was removed (~40 lines trimmed).
- Companion API bumped to `window.LumaLyrics.version = 2.3.0` (hooks unchanged).

## v2.2.2

- **UI reverted to the original v2.0 look** — the v2.2.0 redesign (glass pill toolbar, copy-line chips, text stepper, up-next pill, auto-hiding bar) is fully removed. Everything looks and behaves exactly as you left it.
- Kept the **v2.2.1 playbar toggle fix** (mounts on `[data-testid="control-button-queue"]` in new Spotify builds like 1.3.8.620).
- Kept the **companion hooks** for Luma Plus / Luma Ambient: `window.LumaLyrics` API (`open/close/toggle/setSyncOffset/getState/toggleVinyl`), events `luma:ready/open/close/track/sync-offset-changed`, inbound `luma:set-sync-offset`.

## v2.2.1

- **Fixed the missing playbar toggle on newer Spotify builds** (e.g. 1.3.8.620, where `.main-nowPlayingBar-right` no longer exists): the fallback now anchors on Spotify's stable right-side buttons (`[data-testid="control-button-queue"]` / `control-button-npv`), clones their native styling, and retries for ~18s if the playbar mounts late.

## v2.2.0

- **Complete UI refresh**: unified glass design system (pill toolbar, consistent radii/borders/easing), softer lyric-line hover states, refined now-playing card, and a dedicated lyrics window wrapper.
- **Copy any lyric line**: hover a line and click the copy chip to copy it (with a Spotify toast confirmation).
- **Text-size stepper in the toolbar**: A− / A+ adjusts lyric size (24–52 px) without opening Settings.
- **Up-next preview**: a subtle pill at the bottom of the lyrics pane shows the upcoming line (hidden in static mode).
- **Auto-hiding toolbar**: the top bar fades after ~2.6s of cursor stillness in the overlay and returns on movement; stays visible while Settings is open.
- **Double-click the artwork** to toggle the spinning vinyl (in addition to the Vinyl chip and Settings).
- Companion API bumped to `window.LumaLyrics.version = 2.2.0` (same hooks: `open/close/toggle/setSyncOffset/getState/toggleVinyl`, events `luma:ready/open/close/track/sync-offset-changed`, listens for `luma:set-sync-offset`).

## v2.1.0

- **Playbar toggle compatibility**: registers the Luma button with explicit `registerOnCreate` and adds a fallback mount (extra controls / playbar right / NPV control parent) when the Spicetify wrapper can’t attach it on newer Spotify DOMs.
- **Decluttered now-playing card**: essentials only (artwork, title, artist, slim progress, prev/play/next). Elapsed/duration and volume controls remain functional in the DOM but are visually hidden to reduce clutter; layout gives the lyrics pane more room.
- **Quick vinyl toggle**: a Vinyl chip on the now-playing card, synced with Settings → Appearance.
- **Companion hooks (for Luma Plus / themes)**: `window.LumaLyrics` API (`open`/`close`/`toggle`/`setSyncOffset`/`getState`/`toggleVinyl`), and events `luma:ready`, `luma:open`, `luma:close`, `luma:track`, `luma:sync-offset-changed`; listens for `luma:set-sync-offset`.
- **Stability**: guarded launcher state in open/close, track event emission on load.

## v2.0

- Added a dependency-free test suite for the pure lyric parsing, matching, and keyboard helpers, plus a GitHub Actions workflow that runs it on every push and pull request.
- Fixed the LRCLIB client identifier, which still reported version 1.1.1.
- Fixed the saved-settings migration writing to local storage once per lyric line instead of once per render.
- Smoothed word-by-word playback: the highlight now cross-fades into each word, the active word keeps a constant font weight so the line no longer jitters, estimated timing pauses on punctuation, and the view scrolls slightly ahead of the next line.
- Added automatic word-by-word lyrics: when LRCLIB returns verified word timing (`lyricsfile`) for the playing track, it is used automatically. Otherwise Luma Lyrics keeps using LRCLIB line timing, then estimated word timing.
- Simplified Settings into **Lyrics** and **Appearance** sections, added a **Done** button, and made **Esc** close Settings and return to the lyrics.
- Removed the **Import LRC** and **Retry lyrics** buttons. Lyrics are fetched automatically.

## v1.2

- Added Material You dynamic color: a full tonal palette (primary, secondary, tertiary, surface, outline) is generated from the current album art and applied to the player, lyrics, and Settings.
- Restyled controls as Material 3 components: filled play button that morphs while playing, tonal previous/next and toolbar buttons, handle-style sliders, Material switches, and tonal Settings buttons.
- Desktop colors now follow the same album-art palette instead of a fixed red accent.

## v1.1.1

- Updated the playback and Settings sliders so their colored tracks follow the current value while dragging.

## v1.1

Updated the project version to v1.1 across the extension metadata and user-facing references.

## 1.0

First public release.

- Added synchronized lyrics and optional estimated word highlighting.
- Added playback, volume, and seek controls.
- Added optional spinning-vinyl artwork and appearance settings.
- Added Enhanced LRC file import for word-level timing.
- Improved lyric transitions, playback synchronization, and accessibility.
- Added a lyric timing adjustment for sources that are slightly early or late.
- Reworked word highlighting to keep lyrics readable and animate reliably.
- Added word, line, gentle, and static lyric display modes, adjustable lyric scrolling, and loading placeholders.
- Refreshed Settings with clearer controls.
- Added Reset to defaults, liquid-glass surfaces, and album-art-matched accent colors.
- Added word-level parsing for Enhanced LRC and inline-timestamp lyrics, with active and upcoming word states.
- Refined lyric emphasis and settings visuals with softer transitions and a quieter album-art accent.
- Replaced the native lyric display selector with a custom glass menu and restored the stronger word highlight.
- Increased main lyric size and moved bracketed secondary lyrics below the main line.
- Reimagined the player and Settings with a Material-style liquid-glass layout and an unboxed play button; removed slider-style options.