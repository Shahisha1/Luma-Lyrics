<div align="center">

# Luma Lyrics

**Synced, word-by-word lyrics for Spotify desktop. A fullscreen Spicetify extension.**

[![Latest release](https://img.shields.io/github/v/release/Altertone/Luma-Lyrics?style=flat-square&color=6750A4)](https://github.com/Altertone/Luma-Lyrics/releases/latest)
[![License](https://img.shields.io/github/license/Altertone/Luma-Lyrics?style=flat-square&color=625B71)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/Altertone/Luma-Lyrics/test.yml?branch=main&style=flat-square&label=tests&color=386A20)](https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml)
[![Spicetify extension](https://img.shields.io/badge/Spicetify-extension-1DB954?style=flat-square&logo=spotify&logoColor=white)](https://spicetify.app)

[Install](#install) · [Features](#features) · [Settings](#settings) · [Troubleshooting](#troubleshooting) · [Report an issue](https://github.com/Altertone/Luma-Lyrics/issues)

</div>

<p align="center">
  <img src="preview.gif" alt="Luma Lyrics showing synced word-by-word lyrics in fullscreen Spotify" width="100%">
</p>

Luma Lyrics is a free, open-source [Spicetify](https://spicetify.app) extension that adds a fullscreen synced lyrics player to the Spotify desktop app. Lyrics come from [LRCLIB](https://lrclib.net), colors follow the album art, and you can pick how the lyrics move: word by word, line by line, gentle, or static.

---

## Features

- **Synced lyrics** that follow playback, with verified word timing when LRCLIB has it.
- **Four reading styles:** word by word, line by line, gentle, and static.
- **Estimated word animation** for tracks that only have line timing.
- **Album-art colors:** the player and Settings take their palette from the current cover.
- **Fullscreen player** with now-playing card, seek bar, volume, and playback buttons.
- **Romanization** for Korean, Japanese kana, and Cyrillic lyrics. Built in, works offline.
- **Translation** under each line into 12 languages, using Google Translate (optional, needs internet).
- **Sync offset** from -5 s to +5 s, in 0.05 s steps, for tracks that run early or late.
- **Click any line to seek** to that moment in the song.
- **Spinning vinyl artwork**, adjustable text size, background darkness, and scroll smoothness.
- **Private by default:** preferences stay on your device. See [Privacy](#privacy).

## The way lyrics should feel

Choose a reading style that fits the song. Switch between modes whenever you like.

<table>
  <tr>
    <td width="50%" bgcolor="#f1eafa" align="center">
      <br>
      <strong>Word by word</strong>
      <br><br>
      <img src="screenshots/word%20by%20word.gif" alt="Word-by-word synced lyrics mode in Luma Lyrics" width="100%">
      <br><br>
    </td>
    <td width="50%" bgcolor="#f4eff8" align="center">
      <br>
      <strong>Line by line</strong>
      <br><br>
      <img src="screenshots/line%20by%20line.gif" alt="Line-by-line synced lyrics mode in Luma Lyrics" width="100%">
      <br><br>
    </td>
  </tr>
  <tr>
    <td width="50%" bgcolor="#f4eff8" align="center">
      <br>
      <strong>Gentle</strong>
      <br><br>
      <img src="screenshots/gentle.gif" alt="Gentle lyrics mode in Luma Lyrics" width="100%">
      <br><br>
    </td>
    <td width="50%" bgcolor="#f1eafa" align="center">
      <br>
      <strong>Static</strong>
      <br><br>
      <img src="screenshots/static.gif" alt="Static lyrics mode in Luma Lyrics" width="100%">
      <br><br>
    </td>
  </tr>
</table>

---

## Install

You need Spotify desktop with [Spicetify](https://spicetify.app/docs/getting-started) already set up.

1. Download **[luma-lyrics.js](https://github.com/Altertone/Luma-Lyrics/releases/latest)**.
2. Put the file in your Spicetify Extensions folder.
3. Enable it and apply the changes:

```bash
spicetify config extensions luma-lyrics.js
spicetify apply
```

Then start a song and click the **Luma Lyrics** button in the playbar, next to the queue button.

**Update:** download the new `luma-lyrics.js`, replace the old file, and run `spicetify apply` again.
**Remove:** run `spicetify config extensions luma-lyrics.js-` and then `spicetify apply`.

### Compatibility

The playbar button was last checked on Spotify client 1.3.8.620 with a current Spicetify. Spotify changes its page layout often, so if the button is missing on your version, please [open an issue](https://github.com/Altertone/Luma-Lyrics/issues) with your Spotify and Spicetify versions.

---

## Settings

<p align="center">
  <img src="screenshots/setting.png" alt="Luma Lyrics settings panel with display style, sync offset, text size and translation options" width="88%">
</p>

---

## Troubleshooting

**The playbar button is missing.** Wait a few seconds after Spotify starts, since the extension retries. You can also open it from the developer console with `LumaLyrics.toggle()`.

**"No lyrics found for this recording."** LRCLIB does not have this track. Some tracks only have plain, unsynced lyrics, which Luma shows as text.

**"Lyrics service is busy."** LRCLIB asked clients to slow down. Wait a minute and press **Try again**.

**Lyrics are early or late.** Open Settings and move **Lyrics sync** until the words match the singing.

**Translation does nothing.** It needs an internet connection and the Google Translate service to answer.

---

## Privacy

- Lyric lookup sends the track title, artist, album, and duration to [LRCLIB](https://lrclib.net).
- Translation, if you turn it on, sends the lyric text to Google Translate. It is off by default.
- Romanization runs locally inside the extension.
- Your settings are saved only in Spotify's local storage on your device.

---

## Build from source

Needs Node.js 18 or newer. `luma-lyrics.js` is generated from `src/`.

```bash
npm run build   # rebuild luma-lyrics.js from src/
npm test        # run the tests
npm run check   # build, test, and confirm the committed build is up to date
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to send changes.

---

## Credits

- [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics) — inspiration for the lyric experience and smooth word-by-word flow.
- [LRCLIB](https://lrclib.net) — lyric lookup service used by the extension.
- [Spicetify](https://spicetify.app) — the platform Luma Lyrics runs on.

---

<div align="center">

[MIT License](LICENSE) · [Changelog](CHANGELOG.md) · [Spicetify](https://spicetify.app)

</div>
