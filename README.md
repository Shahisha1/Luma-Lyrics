<div align="center">

# Luma Lyrics

**Synced, word-by-word lyrics for Spotify desktop. A fullscreen Spicetify extension.**

[![Latest release](https://img.shields.io/github/v/release/Altertone/Luma-Lyrics?style=flat-square&color=6750A4)](https://github.com/Altertone/Luma-Lyrics/releases/latest)
[![License](https://img.shields.io/github/license/Altertone/Luma-Lyrics?style=flat-square&color=625B71)](LICENSE)
[![Tests](https://img.shields.io/github/actions/workflow/status/Altertone/Luma-Lyrics/test.yml?branch=main&style=flat-square&label=tests&color=386A20)](https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml)
[![Spicetify extension](https://img.shields.io/badge/Spicetify-extension-1DB954?style=flat-square&logo=spotify&logoColor=white)](https://spicetify.app)

[Install](#install) · [Settings](#settings) · [Report an issue](https://github.com/Altertone/Luma-Lyrics/issues)

</div>

<p align="center">
  <img src="preview.gif" alt="Luma Lyrics showing synced word-by-word lyrics in fullscreen Spotify" width="100%">
</p>

A free [Spicetify](https://spicetify.app) extension that adds a fullscreen synced lyrics player to Spotify. Lyrics come from [LRCLIB](https://lrclib.net), colors follow the album art, and you choose how the lyrics move. It can also romanize Korean, Japanese, and Cyrillic lyrics and show translations.

---

## The way lyrics should feel

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

Needs Spotify desktop with [Spicetify](https://spicetify.app/docs/getting-started) set up.

1. Download **[luma-lyrics.js](https://github.com/Altertone/Luma-Lyrics/releases/latest)**.
2. Put it in your Spicetify Extensions folder.
3. Enable it and apply:

```bash
spicetify config extensions luma-lyrics.js
spicetify apply
```

Then click the **Luma Lyrics** button in the playbar. To update, replace the file and run `spicetify apply` again.

<details>
<summary>Something not working?</summary>

- **Button missing:** wait a few seconds after Spotify starts, or open it from the developer console with `LumaLyrics.toggle()`.
- **No lyrics found:** LRCLIB does not have the track yet.
- **Lyrics early or late:** change **Lyrics sync** in Settings.
- **Still stuck:** [open an issue](https://github.com/Altertone/Luma-Lyrics/issues) with your Spotify and Spicetify versions.

</details>

---

## Settings

<p align="center">
  <img src="screenshots/setting.png" alt="Luma Lyrics settings panel" width="88%">
</p>

---

## Privacy

Lyric lookup sends the track title, artist, album, and duration to LRCLIB. Translation is off by default and sends lyric text to Google Translate only when you turn it on. Everything else stays on your device.

---

## Credits

- [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics) — inspiration for the lyric experience and smooth word-by-word flow.
- [LRCLIB](https://lrclib.net) — lyric lookup service used by the extension.
- [Spicetify](https://spicetify.app) — the platform Luma Lyrics runs on.

---

<div align="center">

[MIT License](LICENSE) · [Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

</div>
