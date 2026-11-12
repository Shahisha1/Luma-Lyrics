// Local .lrc imports.
//
// Imported lyrics live in one localStorage entry keyed by a caller-supplied
// track key, so they survive restarts without touching LRCLIB. The store is
// bounded by both track count and serialized size, and evicts the oldest
// imports first; a blocked or full storage never throws into the UI.

export const LOCAL_LYRICS_STORAGE_KEY = "luma-local-lyrics";
export const MAX_LOCAL_TRACKS = 20;
export const MAX_LOCAL_BYTES = 180000;

function readStore(storage) {
  try {
    const raw = storage?.getItem(LOCAL_LYRICS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function writeStore(storage, store) {
  try {
    storage?.setItem(LOCAL_LYRICS_STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

function sizeOf(store) {
  try {
    return JSON.stringify(store).length;
  } catch {
    return Infinity;
  }
}

function oldestKey(store, except) {
  let key = null,
    savedAt = Infinity;
  for (const [candidate, entry] of Object.entries(store)) {
    if (candidate === except) continue;
    const time = Number(entry?.savedAt) || 0;
    if (time < savedAt) {
      savedAt = time;
      key = candidate;
    }
  }
  return key;
}

export function getLocalLyrics(storage, key) {
  if (!key) return null;
  const entry = readStore(storage)[key];
  return entry && typeof entry.text === "string" && entry.text.trim()
    ? entry
    : null;
}

export function hasLocalLyrics(storage, key) {
  return Boolean(getLocalLyrics(storage, key));
}

export function removeLocalLyrics(storage, key) {
  if (!key) return false;
  const store = readStore(storage);
  if (!(key in store)) return false;
  delete store[key];
  return writeStore(storage, store);
}

export function saveLocalLyrics(
  storage,
  key,
  { text, title = "", artist = "", savedAt = Date.now() } = {},
  { maxTracks = MAX_LOCAL_TRACKS, maxBytes = MAX_LOCAL_BYTES } = {},
) {
  if (!key) throw new Error("A track is required before importing lyrics.");
  if (typeof text !== "string" || !text.trim())
    throw new Error("The selected file has no lyrics.");
  const store = readStore(storage);
  store[key] = { text, title, artist, savedAt };

  // Drop the oldest imports until both limits are satisfied. The entry being
  // saved is never evicted.
  let guard = 0;
  while (
    (Object.keys(store).length > maxTracks || sizeOf(store) > maxBytes) &&
    guard++ < 1000
  ) {
    const victim = oldestKey(store, key);
    if (!victim) break;
    delete store[victim];
  }

  if (writeStore(storage, store)) return store[key];

  // Storage may be full: free the oldest entry and try once more.
  const victim = oldestKey(store, key);
  if (victim) delete store[victim];
  if (writeStore(storage, store)) return store[key];
  throw new Error("Lyrics could not be saved on this device.");
}

export function listLocalLyrics(storage) {
  return Object.entries(readStore(storage))
    .map(([key, entry]) => ({ key, ...entry }))
    .sort((a, b) => (Number(b.savedAt) || 0) - (Number(a.savedAt) || 0));
}
