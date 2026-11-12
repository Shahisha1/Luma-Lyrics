// LRCLIB client.
//
// Two queries run in parallel: the exact `/api/get` lookup and the tolerant
// `/api/search` catalog. The first usable record wins, which keeps the common
// case fast while covering tracks whose album/duration tags do not match the
// exact endpoint. Each request owns its AbortController, so a timeout never
// cancels the track itself, and a timeout is retried once with a fresh request.
//
// Everything is injectable so the behaviour can be tested without a network.

export const LRCLIB_ORIGIN = "https://lrclib.net";
export const LRCLIB_CLIENT = "LumaLyrics/2.5.0 (Spicetify independent extension)";

function failure(code, message, extra) {
  const error = new Error(message);
  error.code = code;
  if (extra) Object.assign(error, extra);
  return error;
}

export function lookupParams(track = {}) {
  const params = new URLSearchParams();
  if (track.title) params.set("track_name", track.title);
  if (track.artist) params.set("artist_name", track.artist);
  if (track.album) params.set("album_name", track.album);
  const seconds = Math.round(Number(track.durationMs) / 1000);
  if (seconds > 0 && seconds <= 3600) params.set("duration", String(seconds));
  return params;
}

export function searchParams(track = {}) {
  const params = new URLSearchParams();
  if (track.title) params.set("track_name", track.title);
  if (track.artist) params.set("artist_name", track.artist);
  return params;
}

// Prefers word-timed records, then line-synced ones, then plain text, and
// breaks ties by how close the record's duration is to the playing track.
export function chooseBestRecord(
  records,
  { accept = () => true, durationMs = 0 } = {},
) {
  if (!Array.isArray(records)) return null;
  let best = null,
    bestScore = -Infinity;
  for (const record of records) {
    if (!record || typeof record !== "object") continue;
    if (!accept(record)) continue;
    const wordTimed =
      Boolean(record.hasWordSync) ||
      (typeof record.lyricsfile === "string" && record.lyricsfile.trim());
    const synced =
      typeof record.syncedLyrics === "string" && record.syncedLyrics.trim();
    let score =
      (wordTimed ? 6 : 0) + (synced ? 3 : 0) + (record.instrumental ? 0 : 1);
    if (durationMs > 0 && Number(record.duration) > 0)
      score -= Math.min(
        3,
        Math.abs(Number(record.duration) * 1000 - durationMs) / 8000,
      );
    if (score > bestScore) {
      bestScore = score;
      best = record;
    }
  }
  return best;
}

function retryable(error) {
  return Boolean(error) && (error.code === "timeout" || error.code === "network");
}

// Resolves with the first success and aborts the losing request. When every
// request fails, a retryable failure (timeout/network) is preferred over a
// definitive "not found" so the caller can decide to retry.
function firstSuccess(promises, controller) {
  return new Promise((resolve, reject) => {
    let pending = promises.length;
    const errors = [];
    const settle = () => {
      if (--pending > 0) return;
      reject(errors.find(retryable) || errors[0] || failure("notfound", "No lyrics found for this track."));
    };
    for (const promise of promises) {
      promise.then(
        (value) => {
          controller.abort();
          resolve(value);
        },
        (error) => {
          errors.push(error);
          settle();
        },
      );
    }
  });
}

export function createLyricsClient({
  fetchImpl = (...args) => globalThis.fetch(...args),
  timeoutMs = 20000,
  retryTimeoutMs = 15000,
  retryDelayMs = 600,
  slowAfterMs = 7000,
  origin = LRCLIB_ORIGIN,
  client = LRCLIB_CLIENT,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
} = {}) {
  async function request(path, { signal, timeout = timeoutMs } = {}) {
    if (signal?.aborted) throw failure("aborted", "Aborted");
    const local = new AbortController();
    const onAbort = () => local.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      local.abort();
    }, timeout);
    try {
      const response = await fetchImpl(origin + path, {
        credentials: "omit",
        headers: { "Lrclib-Client": client },
        signal: local.signal,
      });
      if (response.status === 404)
        throw failure("notfound", "No lyrics found for this track.");
      if (response.status === 429 || response.status === 503) {
        const raw = response.headers.get("Retry-After");
        const seconds = Number(raw);
        throw failure("busy", "Lyrics service is busy. Try again later.", {
          retryAfterMs:
            raw && Number.isFinite(seconds)
              ? seconds * 1000
              : Math.max(60000, (Date.parse(raw) || 0) - Date.now()),
        });
      }
      if (!response.ok)
        throw failure("http", "Lyrics service error " + response.status, {
          status: response.status,
        });
      return await response.json();
    } catch (error) {
      if (error?.code) throw error;
      if (timedOut) throw failure("timeout", "LRCLIB did not respond in time.");
      if (signal?.aborted || error?.name === "AbortError")
        throw failure("aborted", "Aborted");
      throw failure("network", "Could not reach LRCLIB.", { cause: error });
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
    }
  }

  async function round({ signal, timeout, accept, track }) {
    const local = new AbortController();
    const onAbort = () => local.abort();
    if (signal) {
      if (signal.aborted) throw failure("aborted", "Aborted");
      signal.addEventListener("abort", onAbort, { once: true });
    }
    const exact = request("/api/get?" + lookupParams(track), {
      signal: local.signal,
      timeout,
    }).then((record) => {
      if (record && typeof record === "object") return record;
      throw failure("notfound", "No lyrics found for this track.");
    });
    const search = request("/api/search?" + searchParams(track), {
      signal: local.signal,
      timeout,
    }).then((records) => {
      const record = chooseBestRecord(records, {
        accept,
        durationMs: track?.durationMs,
      });
      if (record) return record;
      throw failure("notfound", "No lyrics found for this track.");
    });
    try {
      return await firstSuccess([exact, search], local);
    } finally {
      signal?.removeEventListener("abort", onAbort);
      local.abort();
    }
  }

  async function lookup(track, { signal, onStage = () => {}, accept = () => true } = {}) {
    const slowTimer = setTimeout(() => onStage("slow"), slowAfterMs);
    try {
      try {
        return await round({ signal, timeout: timeoutMs, accept, track });
      } catch (error) {
        if (
          error.code === "aborted" ||
          signal?.aborted ||
          error.code === "notfound" ||
          error.code === "busy" ||
          error.code === "http"
        )
          throw error;
        onStage("retrying");
        await delay(retryDelayMs);
        return await round({ signal, timeout: retryTimeoutMs, accept, track });
      }
    } finally {
      clearTimeout(slowTimer);
    }
  }

  return { lookup, chooseBestRecord };
}
