# Luma Lyrics v2.0

![Version](https://img.shields.io/badge/version-v2.0-blue) ![License](https://img.shields.io/github/license/Shahisha1/Luma-Lyrics) ![Spicetify](https://img.shields.io/badge/Spicetify-extension-1db954)

See the [public releases](https://github.com/Shahisha1/Luma-Lyrics/releases) to download Luma Lyrics.

Luma Lyrics adds synchronized lyrics and a full-window music player to Spotify desktop through [Spicetify](https://spicetify.app).

![Luma Lyrics preview](preview.png)

## Display modes

Luma Lyrics offers several ways to follow lyrics. These screenshots show each mode in action.

### Word by word

![Word-by-word lyrics highlighting](screenshots/word.gif)

### Line by line

![Line-by-line lyrics display](screenshots/line.gif)

### Static

![Static lyrics display](screenshots/static.gif)

### Settings

<img src="screenshots/settings.png" alt="Lyrics display settings" width="320">

## Features

- Synchronized lyrics with automatic word-by-word highlighting when LRCLIB has real word timing, and Enhanced LRC and inline timestamp formats when a lyric source includes them.
- Slightly larger main lyric text, with bracketed ad-libs and secondary lyrics shown beneath in a smaller size.
- Word-by-word highlighting, with estimated timing enabled by default when only line timings are available.
- Choose word-by-word, line-by-line, gentle, or static lyric display.
- Tune lyric-scroll smoothness or turn it off for instant movement. Loading placeholders appear while lyrics are fetched.
- Adjust lyric timing earlier or later to compensate for a slightly offset lyric source.
- Built-in playback, volume, and seek controls.
- Material You dynamic color: the whole interface uses a tonal palette generated from the current album art, with Material 3 style controls, sliders, and switches.
- Optional spinning-vinyl artwork and adjustable lyric size and background.
- Liquid-glass player and settings panels with clear Material-style surfaces, using accent colors sampled from the current album art.
- A compact Settings panel with two sections, **Lyrics** and **Appearance**. Open it with the gear button, then close it with the close button, **Done**, or **Esc** to return to the lyrics.
- Reset all appearance and lyric preferences to their defaults from Settings.
- Optional desktop colors.
- Reduced-motion support.

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

Limitations:

- Word timing exists only for songs where someone has contributed it to LRCLIB, so many tracks will use line timing.
- The Lyricsfile specification is still a draft. Luma Lyrics ignores its `offset_ms` field because the spec has not defined how to apply it. Use **Lyrics sync** in Settings if a source is early or late.
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