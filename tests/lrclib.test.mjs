import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chooseBestRecord,
  createLyricsClient,
  lookupParams,
  searchParams,
} from "../src/services/lrclib.js";

const track = {
  title: "Teeth",
  artist: "5 Seconds of Summer",
  album: "Teeth",
  durationMs: 205000,
};

function reply(status, body, headers = {}) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name) =>
        headers[name] ?? headers[String(name).toLowerCase()] ?? null,
    },
    json: async () => body,
  };
}

function hang(_url, { signal }) {
  return new Promise((_resolve, reject) => {
    const abort = () =>
      reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  });
}

test("lookupParams: includes album and rounded duration", () => {
  const params = lookupParams(track);
  assert.equal(params.get("track_name"), "Teeth");
  assert.equal(params.get("artist_name"), "5 Seconds of Summer");
  assert.equal(params.get("album_name"), "Teeth");
  assert.equal(params.get("duration"), "205");
});

test("lookupParams: omits duration when unknown or out of range", () => {
  assert.equal(lookupParams({ ...track, durationMs: 0 }).get("duration"), null);
  assert.equal(
    lookupParams({ ...track, durationMs: 4 * 3600 * 1000 }).get("duration"),
    null,
  );
});

test("searchParams: keeps only title and artist", () => {
  const params = searchParams(track);
  assert.equal(params.get("track_name"), "Teeth");
  assert.equal(params.get("artist_name"), "5 Seconds of Summer");
  assert.equal(params.get("duration"), null);
  assert.equal(params.get("album_name"), null);
});

test("chooseBestRecord: prefers word timing, then synced, and honours accept", () => {
  const plain = { trackName: "Teeth", plainLyrics: "words" };
  const synced = { trackName: "Teeth", syncedLyrics: "[00:01.00]words" };
  const worded = {
    trackName: "Teeth",
    hasWordSync: true,
    syncedLyrics: "[00:01.00]words",
  };
  const other = { trackName: "Unrelated", hasWordSync: true };

  assert.equal(
    chooseBestRecord([plain, synced, worded], {
      accept: (record) => record.trackName === "Teeth",
    }),
    worded,
  );
  assert.equal(
    chooseBestRecord([plain, synced, other], {
      accept: (record) => record.trackName === "Teeth",
    }),
    synced,
  );
  assert.equal(chooseBestRecord([other], { accept: () => false }), null);
  assert.equal(chooseBestRecord(null), null);
});

test("chooseBestRecord: breaks ties by closest duration", () => {
  const near = { duration: 205, syncedLyrics: "a" };
  const far = { duration: 240, syncedLyrics: "b" };
  assert.equal(
    chooseBestRecord([far, near], { durationMs: 205000, accept: () => true }),
    near,
  );
});

test("lookup: exact /api/get result wins and cancels the catalog request", async () => {
  const calls = [];
  const client = createLyricsClient({
    timeoutMs: 1000,
    slowAfterMs: 10000,
    fetchImpl: async (url, options) => {
      calls.push(url);
      if (url.includes("/api/get?"))
        return reply(200, { trackName: "Teeth", syncedLyrics: "[00:01.00]a" });
      return hang(url, options);
    },
  });
  const record = await client.lookup(track);
  assert.equal(record.trackName, "Teeth");
  assert.equal(calls.length, 2);
  assert.ok(calls.some((url) => url.includes("/api/get?")));
  assert.ok(calls.some((url) => url.includes("/api/search?")));
});

test("lookup: falls back to the catalog when /api/get returns 404", async () => {
  const client = createLyricsClient({
    timeoutMs: 1000,
    slowAfterMs: 10000,
    fetchImpl: async (url) => {
      if (url.includes("/api/get?")) return reply(404, {});
      return reply(200, [
        { trackName: "Nope", syncedLyrics: "x" },
        { trackName: "Teeth", artistName: "5 Seconds of Summer", syncedLyrics: "[00:01.00]b" },
      ]);
    },
  });
  const record = await client.lookup(track, {
    accept: (candidate) => candidate.trackName === "Teeth",
  });
  assert.equal(record.syncedLyrics, "[00:01.00]b");
});

test("lookup: retries once when the first round times out", async () => {
  let round = 0;
  const client = createLyricsClient({
    timeoutMs: 30,
    retryTimeoutMs: 1000,
    retryDelayMs: 1,
    slowAfterMs: 10000,
    fetchImpl: async (url, options) => {
      round++;
      if (round <= 2) return hang(url, options);
      if (url.includes("/api/get?"))
        return reply(200, { trackName: "Teeth", syncedLyrics: "[00:01.00]c" });
      return hang(url, options);
    },
  });
  const stages = [];
  const record = await client.lookup(track, { onStage: (stage) => stages.push(stage) });
  assert.equal(record.syncedLyrics, "[00:01.00]c");
  assert.deepEqual(stages, ["retrying"]);
});

test("lookup: not found is definitive and not retried", async () => {
  let calls = 0;
  const client = createLyricsClient({
    timeoutMs: 1000,
    retryDelayMs: 1,
    slowAfterMs: 10000,
    fetchImpl: async (url) => {
      calls++;
      if (url.includes("/api/get?")) return reply(404, {});
      return reply(200, []);
    },
  });
  await assert.rejects(client.lookup(track), (error) => {
    assert.equal(error.code, "notfound");
    return true;
  });
  assert.equal(calls, 2);
});

test("lookup: surfaces Retry-After from a busy service", async () => {
  const client = createLyricsClient({
    timeoutMs: 1000,
    slowAfterMs: 10000,
    fetchImpl: async () => reply(429, {}, { "retry-after": "42" }),
  });
  await assert.rejects(client.lookup(track), (error) => {
    assert.equal(error.code, "busy");
    assert.equal(error.retryAfterMs, 42000);
    return true;
  });
});

test("lookup: reports a slow lookup while it is still running", async () => {
  const client = createLyricsClient({
    timeoutMs: 200,
    retryTimeoutMs: 200,
    retryDelayMs: 1,
    slowAfterMs: 10,
    fetchImpl: async (url, options) => {
      if (url.includes("/api/get?")) return hang(url, options);
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve(
              reply(200, [
                { trackName: "Teeth", syncedLyrics: "[00:01.00]d" },
              ]),
            ),
          60,
        ),
      );
    },
  });
  const stages = [];
  await client.lookup(track, { onStage: (stage) => stages.push(stage) });
  assert.ok(stages.includes("slow"));
});

test("lookup: an aborted track lookup rejects as aborted", async () => {
  const controller = new AbortController();
  const client = createLyricsClient({
    timeoutMs: 1000,
    slowAfterMs: 10000,
    fetchImpl: hang,
  });
  const pending = client.lookup(track, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (error) => {
    assert.equal(error.code, "aborted");
    return true;
  });
});
