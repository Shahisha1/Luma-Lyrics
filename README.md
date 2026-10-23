<div align="center">

<h1>Luma Lyrics</h1>

<p><strong>Synchronized lyrics and a full-window music player for Spotify desktop</strong></p>

<p>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-v2.0-blue" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/Shahisha1/Luma-Lyrics" alt="License"></a>
  <a href="https://spicetify.app"><img src="https://img.shields.io/badge/Spicetify-extension-1db954" alt="Spicetify extension"></a>
</p>

<p><a href="https://github.com/Shahisha1/Luma-Lyrics/releases/latest">Download the latest release</a> · <a href="https://github.com/Shahisha1/Luma-Lyrics/issues">Report a problem</a></p>

<img src="preview.gif" alt="Luma Lyrics preview" width="640">

</div>

## Contents

- [Features](#features)
- [Display modes](#display-modes)
- [Install](#install)
- [Lyrics and word timing](#lyrics-and-word-timing)
- [Privacy](#privacy)
- [Troubleshooting and feedback](#troubleshooting-and-feedback)
- [References and inspiration](#references-and-inspiration)
- [License](#license)

## Features

- **Synchronized lyrics** with automatic word-by-word highlighting when LRCLIB has real word timing. Enhanced LRC and inline timestamp formats are also supported when a lyric source includes them.
- **Clear lyric styling:** slightly larger main lyrics, with bracketed ad-libs and secondary lyrics displayed beneath in a smaller size.
- **Four display modes:** word by word, line by line, gentle, and static.
- **Flexible timing:** estimated word animation when only line timings are available, plus controls to adjust lyrics earlier or later.
- **Smooth presentation:** tune lyric-scroll smoothness or turn it off for instant movement; loading placeholders appear while lyrics are fetched.
- **Player controls:** built-in playback, volume, and seek controls.
- **Material You colors:** the interface uses a tonal palette generated from the current album art, with Material 3 style controls, sliders, and switches.
- **Liquid-glass panels:** player and settings panels use clear Material-style surfaces with accent colors sampled from the current album art.
- **Personalization:** optional spinning-vinyl artwork, adjustable lyric size and background, and optional desktop colors.
- **Compact settings:** **Lyrics** and **Appearance** sections; open Settings with the gear button and close it with the close button, **Done**, or **Esc**.
- **Easy reset:** restore all appearance and lyric preferences to their defaults from Settings.
- **Reduced-motion support.**

## Display modes

Choose the style that suits how you like to follow along.

### Word by word

![Word-by-word lyrics highlighting](screenshots/word%20by%20word.gif)

### Line by line

![Line-by-line lyrics display](screenshots/line%20by%20line.gif)

### Gentle

![Gentle lyrics display](screenshots/gentle.gif)

### Static

![Static lyrics display](screenshots/static.gif)

### Settings

<p align="center">
  <img src="screenshots/setting.png" alt="Lyrics display settings" width="320">
</p>

## Install

1. Download `luma-lyrics.js` from the [latest public release](https://github.com/Shahisha1/Luma-Lyrics/releases/latest).
2. Copy it to your Spicetify extensions folder. On Windows, this is `%APPDATA%\spicetify\Extensions`.
3. Enable the extension and apply the change:

   ```bash
   spicetify config extensions luma-lyrics.js
   spicetify apply
   ```

4. In Spotify, select the Luma Lyrics button beside the playback controls. Use the settings button to customize the display.

## Lyrics and word timing

Lyrics are looked up automatically through [LRCLIB](https://lrclib.net) with one request per track. No setup, typing, or file import is needed. Luma Lyrics picks the best lyrics available in this order:

1. **Word-timed lyrics.** LRCLIB can return a `lyricsfile` ([Lyricsfile 1.0](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md)) with timestamps for each word. Luma Lyrics uses it only when it parses cleanly, most lines have word timing, and its title, artist, and duration agree with the track that is playing. Otherwise it is ignored.
2. **LRCLIB line-timed lyrics**, shown line by line.
3. **Estimated word timing** for line-timed lyrics, if **Estimated word animation** is on. The status line says "estimated words" so it is never mistaken for real word sync.

The status line shows "word timestamps" only when the timing came from the lyric source.

### Limitations

- Word timing exists only for songs where someone has contributed it to LRCLIB, so many tracks will use line timing.
- The Lyricsfile specification is still a draft. Luma Lyrics ignores its `offset_ms` field because the specification has not defined how to apply it. Use **Lyrics sync** in Settings if a source is early or late.
- Lyrics with overlapping lines, such as background vocals on their own line, are shown one line at a time.
- If a lookup fails (network error, timeout, rate limit), reopen Luma Lyrics or change tracks to try again.

## Privacy

- To find lyrics, Luma Lyrics sends the song title, artist, album, and duration to LRCLIB.
- The extension does not send your Spotify token to LRCLIB.
- Appearance settings are saved in Spotify on your device.

## Troubleshooting and feedback

Spotify or Spicetify updates and other themes may affect how the extension works. Report problems or request a feature on the [Issues page](https://github.com/Shahisha1/Luma-Lyrics/issues). Include your Spotify and Spicetify versions when reporting a problem.

## References and inspiration

- [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics) — inspiration for the lyric experience and smooth word-by-word presentation. Luma Lyrics is an independent implementation and does not use Liquid Lyrics as a dependency.
- [LRCLIB](https://lrclib.net) — lyric lookup service used by the extension, including its word-timed Lyricsfile data.
- [Lyricsfile specification](https://github.com/tranxuanthang/lyricsfile) — the open format LRCLIB uses for word-level timing.
- [Spicetify](https://spicetify.app) — platform and extension environment Luma Lyrics is built for.

## License

Luma Lyrics is available under the [MIT License](LICENSE). Lyrics, album artwork, and third-party services remain subject to their respective owners' terms.

Luma Lyrics is not affiliated with Spotify, Spicetify, or LRCLIB.