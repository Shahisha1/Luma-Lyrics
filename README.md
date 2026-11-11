<div align="center">

# Luma Lyrics

**Know every word. Feel every beat.**

A simple, synced lyrics overlay for Spotify desktop.

[Download](https://github.com/Altertone/Luma-Lyrics/releases/latest) · [Report an issue](https://github.com/Altertone/Luma-Lyrics/issues)

[![Version](https://img.shields.io/badge/version-v2.3.1-blue)](CHANGELOG.md)
[![License](https://img.shields.io/github/license/Altertone/Luma-Lyrics)](LICENSE)
[![Tests](https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml/badge.svg)](https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml)
[![Spicetify](https://img.shields.io/badge/Spicetify-extension-1db954)](https://spicetify.app)

<img src="preview.gif" alt="Luma Lyrics preview" width="640">

</div>

## The experience

Luma Lyrics brings synced lyrics into a focused player-and-lyrics view. It looks up tracks automatically and displays the best timing data available.

| Word by word | Line by line |
|:---:|:---:|
| ![Word-by-word lyrics highlighting](screenshots/word%20by%20word.gif) | ![Line-by-line lyrics display](screenshots/line%20by%20line.gif) |
| **Gentle** | **Static** |
| ![Gentle lyrics display](screenshots/gentle.gif) | ![Static lyrics display](screenshots/static.gif) |

<details>
<summary>Settings preview</summary>

<p align="center">
  <img src="screenshots/setting.png" alt="Lyrics display settings" width="320">
</p>

</details>

## Features

- Word-level highlighting when accurate timestamps are available.
- Word, line, gentle, and static display modes.
- Built-in playback controls and album artwork.
- Adjustable text size, background darkness, scrolling, and sync offset.
- Optional estimated word timing, translation, and romanization.
- Optional desktop colour styling and spinning artwork.

## Install

1. Download `luma-lyrics.js` from the [latest release](https://github.com/Altertone/Luma-Lyrics/releases/latest).
2. Place it in your Spicetify extensions folder:
   - Linux / macOS: `~/.config/spicetify/Extensions/`
   - Windows: `%appdata%\spicetify\Extensions\`
3. Enable and apply it:

   ```bash
   spicetify config extensions luma-lyrics.js
   spicetify apply
   ```

4. Restart Spotify and open Luma Lyrics from the playback bar.

## Lyrics and sync

Lyrics are retrieved from [LRCLIB](https://lrclib.net). Luma Lyrics prefers real word timestamps, falls back to line timestamps, and can estimate word timing when enabled.

If lyrics appear early or late, adjust **Lyrics sync** in the extension settings. Some tracks may not have a matching lyric entry.

## Privacy

- Track title, artist, album, and duration are sent to LRCLIB for lyric matching.
- Your Spotify token is not sent to LRCLIB.
- Preferences are stored locally in Spotify.
- Lyric text is sent to Google Translate only when translation is enabled.

## Development

The readable source lives in `src/`; `luma-lyrics.js` is the generated file loaded by Spicetify.

Requires Node.js 18 or newer.

```bash
npm install
npm run build
npm test
npm run check
```

## Credits

[LRCLIB](https://lrclib.net) · [Spicetify](https://spicetify.app) · [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics)

## License

[MIT](LICENSE). Luma Lyrics is not affiliated with Spotify, Spicetify, or LRCLIB.
