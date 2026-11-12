# Contributing to Luma Lyrics

Thanks for helping. Small, focused changes are the easiest to review.

## Setup

You need Node.js 18 or newer. There are no dependencies to install.

```bash
git clone https://github.com/Altertone/Luma-Lyrics.git
cd Luma-Lyrics
npm test
```

## How the project is laid out

- `src/` is the source. Edit files here.
- `src/main.js` is the extension runtime (player state, lyric lookup, sync loop, settings UI).
- `src/lyrics/`, `src/services/`, `src/core/`, `src/theme/`, `src/ui/` hold the smaller modules.
- `luma-lyrics.js` is **generated** from `src/` by `npm run build`. Do not edit it by hand.
- `tests/` holds the tests.

## Before you open a pull request

1. Make your change in `src/`.
2. Run `npm run check`. It rebuilds `luma-lyrics.js`, runs the tests, and fails if the committed build is out of date.
3. Commit the rebuilt `luma-lyrics.js` together with your source change.
4. Add or update a test when you change parsing, matching, settings, or translation behavior.
5. Add a line under **Unreleased** in `CHANGELOG.md` for changes users will notice.

## Bug reports

Please include your Spotify version, your Spicetify version, the track that fails, and any messages from the developer console that start with `[Luma Lyrics]`.

## Privacy

Luma Lyrics sends the track title, artist, album, and duration to LRCLIB, and lyric text to Google Translate only when the user turns translation on. Please do not add new network calls or tracking without discussing it first in an issue.
