// Translation requests are isolated from the overlay so batching, caching, and
// cancellation can be tested without a Spotify runtime.

export function createTranslationService({
  fetchImpl = (...args) => globalThis.fetch(...args),
  maxCacheEntries = 500,
} = {}) {
  const cache = new Map();

  function remember(key, value) {
    if (cache.has(key)) cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxCacheEntries) {
      cache.delete(cache.keys().next().value);
    }
  }

  async function translateLines(texts, lang, signal) {
    const out = new Array(texts.length).fill("");
    const todo = [];

    texts.forEach((text, index) => {
      const key = lang + "\u0000" + text;
      if (cache.has(key)) out[index] = cache.get(key);
      else todo.push(index);
    });

    for (let i = 0; i < todo.length; ) {
      const batch = [];
      let length = 0;

      while (i < todo.length && batch.length < 40 && length < 1200) {
        const index = todo[i++];
        const text = texts[index];
        if (!text) {
          out[index] = "";
          remember(lang + "\u0000" + text, "");
          continue;
        }
        batch.push(index);
        length += text.length;
      }

      if (!batch.length) continue;

      const response = await fetchImpl(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(lang)}&dt=t&q=${encodeURIComponent(batch.map((index) => texts[index]).join("\n"))}`,
        { signal },
      );
      if (!response.ok) throw new Error("HTTP " + response.status);

      const parts = (await response.json())[0]
        .map((part) => part[0])
        .join("")
        .split("\n");
      batch.forEach((index, offset) => {
        const translated = (parts[offset] || "").trim();
        remember(lang + "\u0000" + texts[index], translated);
        out[index] = translated;
      });
    }

    return out;
  }

  return {
    translateLines,
    clearCache: () => cache.clear(),
    get cacheSize() {
      return cache.size;
    },
  };
}
