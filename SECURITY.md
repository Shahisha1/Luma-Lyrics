# Security policy

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private reporting instead: go to the **Security** tab of this repository and choose **Report a vulnerability**.

Include what you found, the steps to reproduce it, and the Luma Lyrics version (shown in `CHANGELOG.md` and in `window.LumaLyrics.version`).

## Supported versions

Only the latest release receives fixes.

## What the extension sends

- Track title, artist, album, and duration go to [LRCLIB](https://lrclib.net) to find lyrics.
- Lyric text goes to Google Translate only if the user turns on translation.
- Settings are stored in Spotify's local storage on the user's device.
