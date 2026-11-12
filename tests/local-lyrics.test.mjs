import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOCAL_LYRICS_STORAGE_KEY,
  getLocalLyrics,
  hasLocalLyrics,
  listLocalLyrics,
  removeLocalLyrics,
  saveLocalLyrics,
} from "../src/core/local-lyrics.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }
  setItem(key, value) {
    this.map.set(key, String(value));
  }
}

const lrc = "[00:01.00]first line\n[00:04.00]second line";

test("local lyrics: save, read, list, and remove", () => {
  const storage = new MemoryStorage();
  assert.equal(getLocalLyrics(storage, "a"), null);
  assert.equal(hasLocalLyrics(storage, "a"), false);

  saveLocalLyrics(storage, "a", {
    text: lrc,
    title: "Teeth",
    artist: "5 Seconds of Summer",
    savedAt: 10,
  });

  assert.equal(hasLocalLyrics(storage, "a"), true);
  assert.equal(getLocalLyrics(storage, "a").text, lrc);
  assert.equal(getLocalLyrics(storage, "a").title, "Teeth");

  saveLocalLyrics(storage, "b", { text: lrc, savedAt: 20 });
  assert.deepEqual(
    listLocalLyrics(storage).map((entry) => entry.key),
    ["b", "a"],
  );

  assert.equal(removeLocalLyrics(storage, "a"), true);
  assert.equal(getLocalLyrics(storage, "a"), null);
  assert.equal(removeLocalLyrics(storage, "a"), false);
});

test("local lyrics: evicts the oldest imports past the track limit", () => {
  const storage = new MemoryStorage();
  saveLocalLyrics(storage, "old", { text: lrc, savedAt: 1 }, { maxTracks: 2 });
  saveLocalLyrics(storage, "mid", { text: lrc, savedAt: 2 }, { maxTracks: 2 });
  saveLocalLyrics(storage, "new", { text: lrc, savedAt: 3 }, { maxTracks: 2 });

  assert.equal(getLocalLyrics(storage, "old"), null);
  assert.equal(hasLocalLyrics(storage, "mid"), true);
  assert.equal(hasLocalLyrics(storage, "new"), true);
});

test("local lyrics: evicts the oldest imports past the size limit", () => {
  const storage = new MemoryStorage();
  const big = "x".repeat(120);
  saveLocalLyrics(storage, "old", { text: big, savedAt: 1 }, { maxBytes: 260 });
  saveLocalLyrics(storage, "new", { text: big, savedAt: 2 }, { maxBytes: 260 });

  assert.equal(getLocalLyrics(storage, "old"), null);
  assert.equal(getLocalLyrics(storage, "new").text, big);
});

test("local lyrics: never evicts the entry being saved", () => {
  const storage = new MemoryStorage();
  saveLocalLyrics(storage, "only", { text: lrc, savedAt: 1 }, { maxBytes: 1 });
  assert.equal(getLocalLyrics(storage, "only").text, lrc);
});

test("local lyrics: malformed storage is ignored and repaired", () => {
  const storage = new MemoryStorage();
  storage.setItem(LOCAL_LYRICS_STORAGE_KEY, "{not json");
  assert.equal(getLocalLyrics(storage, "a"), null);
  assert.equal(listLocalLyrics(storage).length, 0);

  saveLocalLyrics(storage, "a", { text: lrc });
  assert.equal(getLocalLyrics(storage, "a").text, lrc);
});

test("local lyrics: a blocked or full storage throws a readable error", () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.throws(
    () => saveLocalLyrics(storage, "a", { text: lrc }),
    /could not be saved/i,
  );
});

test("local lyrics: rejects empty text and a missing track key", () => {
  const storage = new MemoryStorage();
  assert.throws(() => saveLocalLyrics(storage, "", { text: lrc }), /track/i);
  assert.throws(
    () => saveLocalLyrics(storage, "a", { text: "   " }),
    /no lyrics/i,
  );
});
