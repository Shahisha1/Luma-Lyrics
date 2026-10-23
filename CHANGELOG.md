# Changelog

## Unreleased

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