<div align="center">

# Luma Lyrics

**Lyrics that stay out of the way and keep up with the music.**

A lightweight lyrics overlay for Spotify desktop, built for Spicetify.

<p>
  <a href="https://github.com/Altertone/Luma-Lyrics/releases/latest"><strong>Latest release</strong></a>
  ·
  <a href="https://github.com/Altertone/Luma-Lyrics/issues">Report a problem</a>
</p>

<a href="https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml"><img src="https://github.com/Altertone/Luma-Lyrics/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
<a href="https://img.shields.io/github/license/Altertone/Luma-Lyrics"><img src="https://img.shields.io/github/license/Altertone/Luma-Lyrics" alt="MIT License"></a>

<img src="preview.gif" alt="Luma Lyrics preview" width="640">

</div>

## Features

- Synced lyrics in a dedicated overlay with album artwork and playback controls.
- Word-by-word timing when the lyric source provides real word timestamps.
- Line-by-line, gentle, and static display modes.
- A manual sync offset for correcting lyrics that run early or late.
- Optional estimated word timing when only line timestamps are available.
- Optional lyric translation and offline romanization.
- Adjustable text size, background darkness, and scrolling.
- Optional desktop colour styling and spinning album artwork.
- Settings are stored locally in Spotify.

Luma Lyrics uses a restrained, classic player-and-lyrics layout. It does not replace Spotify's player or require a separate lyrics account.

## Install

1. Download **luma-lyrics.js** from the [latest release](https://github.com/Altertone/Luma-Lyrics/releases/latest).
2. Copy it into your Spicetify extensions directory.
   - Linux: `~/.config/spicetify/Extensions/`
   - Windows: `%appdata%\spicetify\Extensions\`
   - macOS: `~/.config/spicetify/Extensions/`
3. Enable the extension and apply Spicetify:

   ```bash
   spicetify config extensions luma-lyrics.js
   spicetify apply
   ```

4. Restart Spotify. Use the **Luma Lyrics** button in the playback bar to open the overlay.

### Update an existing installation

Replace the old `luma-lyrics.js` in the extensions directory with the new release, then run:

```bash
spicetify apply
```

If the extension is already listed in Spicetify's extensions setting, you do not need to add it again.

## Lyrics and timing

Lyrics are retrieved from [LRCLIB](https://lrclib.net). Luma Lyrics checks the available formats and uses the best supported timing:

1. Real word timestamps, when supplied.
2. Line timestamps, when word timing is unavailable.
3. Estimated word animation, when enabled in settings.

Use **Lyrics sync** in Settings to move the displayed lyrics earlier or later. The adjustment is saved locally.

If lyrics do not load, check your connection and try the current track again. Some tracks may not have a matching lyric entry.

## Translation and romanization

- Translation is optional and uses Google Translate. The lyric text is sent to Google Translate when this feature is enabled.
- Romanization is performed locally for supported Korean, Japanese, and Cyrillic text.
- Neither feature is required for normal lyric playback.

## Privacy

- LRCLIB receives the track title, artist, album, and duration to find matching lyrics.
- Your Spotify token is not sent to LRCLIB.
- Translation sends lyric text to Google Translate only when translation is enabled.
- Display preferences are stored in Spotify's local storage.

## Troubleshooting

If the overlay or playbar button does not appear:

1. Confirm that `luma-lyrics.js` is in the correct Spicetify extensions directory.
2. Check that the extension is enabled:

   ```bash
   spicetify config extensions
   ```

3. Apply Spicetify again:

   ```bash
   spicetify apply
   ```

4. Fully restart Spotify.

Spotify updates, Spicetify changes, and other extensions or themes can affect the player bar. If the issue continues, [open an issue](https://github.com/Altertone/Luma-Lyrics/issues) and include your Spotify version, Spicetify version, operating system, and any relevant console errors.

## Development

The readable source is kept in `src/`. The single-file `luma-lyrics.js` bundle is generated from those modules and is the file Spicetify loads.

Requirements:

- Node.js 18 or newer
- npm

From the repository root:

```bash
npm install
npm run build
npm test
npm run check
```

The build uses Node.js built-ins and does not require runtime dependencies. Tests use Node's built-in test runner. `npm run check` rebuilds the bundle, runs the tests, and checks that the committed bundle is up to date.

## Credits

- [LRCLIB](https://lrclib.net) for lyric lookup.
- [Spicetify](https://spicetify.app) for the Spotify customization platform.
- [Liquid Lyrics](https://github.com/NMWplays/Liquid-Lyrics) for inspiration.

## License

Released under the [MIT License](LICENSE). Lyrics, album artwork, and third-party services remain subject to their respective owners' terms.

Luma Lyrics is not affiliated with Spotify, Spicetify, LRCLIB, or Google.
