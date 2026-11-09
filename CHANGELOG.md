# Changelog

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