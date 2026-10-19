# Luma Lyrics 1.0

![Version](https://img.shields.io/badge/version-1.0-blue)
![License](https://img.shields.io/github/license/Shahisha1/Luma-Lyrics)
![Spicetify](https://img.shields.io/badge/Spicetify-extension-1db954)

See the [public releases](https://github.com/Shahisha1/Luma-Lyrics/releases) to download Luma Lyrics.

Luma Lyrics adds synchronized lyrics and a full-window music player to Spotify desktop through [Spicetify](https://spicetify.app).

![Luma Lyrics preview](preview.png)

## Features

- Synchronized lyrics with a word-by-word highlight when word timings are available.
- Optional estimated word highlighting when only line timings are available.
- Import Enhanced LRC files for word-level timing. Imported files stay on your device.
- Built-in playback, volume, and seek controls.
- Four player slider styles: Bar, Wavy, Slim, and Squiggly.
- Optional spinning-vinyl artwork and adjustable lyric size and background.
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

Lyrics are looked up through [LRCLIB](https://lrclib.net). Available line timings are synchronized with playback. Verified word timings require an Enhanced LRC file; estimated word highlighting is only an approximation and is off by default.

## Privacy

- To find lyrics, Luma Lyrics sends the song title, artist, album, and duration to LRCLIB.
- Imported LRC files stay on your device and are not uploaded.
- The extension does not send your Spotify token to LRCLIB.
- Appearance settings are saved in Spotify on your device.

## Troubleshooting and feedback

Spotify or Spicetify updates and other themes may affect how the extension works. Report problems or request a feature on the [Issues page](https://github.com/Shahisha1/Luma-Lyrics/issues). Include your Spotify and Spicetify versions when reporting a problem.

## License

Luma Lyrics is available under the [MIT License](LICENSE). Lyrics, album artwork, and third-party services remain subject to their respective owners' terms.

Luma Lyrics is not affiliated with Spotify, Spicetify, or LRCLIB.
