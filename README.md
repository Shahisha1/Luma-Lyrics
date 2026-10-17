# Luma Lyrics (Beta)

Independent Spicetify extension with an immersive two-column player, artwork background,
line-synced lyrics, and optional Apple-inspired desktop colors. No Liquid Lyrics dependency.

## Status
Version 0.2.0-beta.1. Generated implementation; not runtime-tested in Spotify by its authoring assistant.
Please test your local build before advertising it as stable. The preview is a labeled design mockup,
not an actual screenshot. Replace it with a screenshot of your tested build before publishing.

## Features
- Discreet icon beside Spotify playback extra controls; no floating Apple Room button.
- Fullscreen artwork/lyrics player with SVG controls, progress and volume.
- Settings panel: lyric size, background darkness, estimated animation, desktop colors.
- LRCLIB line-timed lyrics, plain-text fallback, local Enhanced LRC import.
- Click a lyric line to seek. Manual scroll pauses auto-centering briefly.
- Reduced-motion preference respected for line transitions and scrolling.

## Timing limitations
Automatic LRCLIB lookup is not a verified source of word timestamps.
Estimated word animation is OFF by default and explicitly labeled. It allocates time
by character count between lyric lines and does not accurately track singing.
For timestamp-driven words, import an Enhanced LRC file with <mm:ss.xx> word-start tags.
Fill is interpolated between starts; the last word uses next line timing or an explicit ending tag.
No automatic word-timing provider, syllable alignment, translation or romanization is included.

## Install
Install from Marketplace once this repository is discovered, or copy luma-lyrics.js to
%APPDATA%\spicetify\Extensions, then:

```powershell
spicetify config extensions luma-lyrics.js
spicetify apply
```

Click the Luma Lyrics icon near queue/lyrics/Now Playing controls.
Use the settings icon to configure appearance. Desktop recoloring is opt-in.
Do not enable the old apple-room.js at the same time. Shuffle is separate and untouched.

## Privacy and network use
When opened, this extension sends title, artist, album and duration to https://lrclib.net/api/get.
The service sees normal connection metadata such as IP. No Spotify token is sent by this code.
Requests are serialized, spaced at least 500ms, with a 15-second timeout and rate-limit cooldown.
Lyrics cache (50 records) and imported files (30 tracks) stay in memory until Spotify restarts.
Imports are read locally and not uploaded. Appearance settings persist in localStorage.
LRCLIB availability and recording matches are not guaranteed.

## Known limitations
Spotify/Spicetify updates can break APIs or theme selectors. Other themes may conflict.
Artwork and lyrics depend on available metadata. No mobile support or bundled ad blocker.
This is an independent project, not affiliated with Apple, Spotify, LRCLIB, or Liquid Lyrics.

## Remove
```powershell
spicetify config extensions luma-lyrics.js-
spicetify apply
```
Settings remain in localStorage unless cleared separately.

## License
MIT; see LICENSE. The license covers this original code, not third-party lyric text,
artwork, Spotify assets, or any provider's rights.

## References
- https://lrclib.net/docs
- https://spicetify.app/docs/development/api-wrapper/classes/playbar
- https://spicetify.app/docs/development/api-wrapper/methods/player
