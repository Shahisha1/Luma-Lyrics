// Tests for the standalone lyric, romanization, and translation modules.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as pure from "../src/lyrics/parsing.js";
import { romanizeText } from "../src/lyrics/romanization.js";
import { createTranslationService } from "../src/services/translation.js";
import { installStyles } from "../src/ui/styles.js";
import { createArtworkPalette } from "../src/theme/artwork.js";

test("parse: line-timed LRC", () => {
  const lines = pure.parse("[00:12.34]Hello world\n[00:15.00]Second line");
  assert.equal(lines.length, 2);
  assert.equal(lines[0].ms, 12340);
  assert.equal(lines[0].text, "Hello world");
  assert.equal(lines[0].exact, false);
  assert.equal(lines[1].ms, 15000);
  assert.deepEqual(lines[0].words, []);
});

test("parse: metadata-only rows are skipped", () => {
  const lines = pure.parse("[ar:Artist]\n[ti:Title]\n[00:01.00]Real line");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].text, "Real line");
});

test("parse: offset tag shifts every line", () => {
  const lines = pure.parse("[offset:-500]\n[00:10.00]Shifted");
  assert.equal(lines[0].ms, 9500);
});

test("parse: empty lyric rows become a musical note", () => {
  const lines = pure.parse("[00:01.00]");
  assert.equal(lines[0].text, "♪");
});

test("parse: enhanced LRC word tags", () => {
  const lines = pure.parse("[00:10.00]<00:10.00>Hello <00:10.50>world");
  assert.equal(lines.length, 1);
  assert.equal(lines[0].exact, true);
  assert.equal(lines[0].text, "Hello world");
  assert.deepEqual(
    lines[0].words.map((w) => [w.ms, w.text]),
    [
      [10000, "Hello "],
      [10500, "world"],
    ],
  );
});

test("parse: inline square-bracket word tags", () => {
  const lines = pure.parse("[00:10.00][00:10.00]Hello [00:10.50]world");
  assert.equal(lines[0].exact, true);
  assert.equal(lines[0].words.length, 2);
});

test("parse: multiple line tags on one row", () => {
  const lines = pure.parse("[00:01.00][00:05.00]Chorus");
  assert.equal(lines.length, 2);
  assert.deepEqual(
    lines.map((l) => l.ms),
    [1000, 5000],
  );
});

test("parse: results are sorted by time", () => {
  const lines = pure.parse("[00:09.00]Later\n[00:02.00]Earlier");
  assert.deepEqual(
    lines.map((l) => l.text),
    ["Earlier", "Later"],
  );
  assert.deepEqual(
    lines.map((l) => l.lineIndex),
    [0, 1],
  );
});

test("parse: word end times fall back to the next word or line", () => {
  const lines = pure.parse(
    "[00:10.00]<00:10.00>One <00:10.50>Two\n[00:12.00]<00:12.00>Three",
  );
  assert.equal(lines[0].words[0].endTime, 10500);
  assert.equal(lines[0].words[1].endTime, 12000);
  assert.equal(lines[1].words[0].endTime, 16000);
});

test("parseYamlSubset: mappings, sequences, and scalars", () => {
  const doc = pure.parseYamlSubset(
    [
      "version: '1.0'",
      "metadata:",
      "  title: Song",
      "  duration_ms: 180000",
      "  instrumental: false",
      "lines:",
      "  - text: Hello",
      "    start_ms: 0",
      "  - text: World",
      "    start_ms: 1000",
    ].join("\n"),
  );
  assert.equal(doc.version, "1.0");
  assert.equal(doc.metadata.title, "Song");
  assert.equal(doc.metadata.duration_ms, 180000);
  assert.equal(doc.metadata.instrumental, false);
  assert.deepEqual(
    doc.lines.map((l) => l.text),
    ["Hello", "World"],
  );
});

test("parseYamlSubset: quoted strings and comments", () => {
  const doc = pure.parseYamlSubset(
    [
      'title: "A \\"quoted\\" title" # trailing comment',
      "artist: 'It''s me'",
      "# whole-line comment",
      "empty:",
    ].join("\n"),
  );
  assert.equal(doc.title, 'A "quoted" title');
  assert.equal(doc.artist, "It's me");
  assert.equal(doc.empty, null);
});

test("parseYamlSubset: literal block scalar keeps newlines", () => {
  const doc = pure.parseYamlSubset("text: |\n  line one\n  line two\n");
  assert.equal(doc.text, "line one\nline two\n");
});

test("parseYamlSubset: folded block scalar joins lines", () => {
  const doc = pure.parseYamlSubset("text: >\n  line one\n  line two\n");
  assert.equal(doc.text, "line one line two\n");
});

test("parseYamlSubset: rejects tabs, duplicate keys, and deep nesting", () => {
  assert.throws(() => pure.parseYamlSubset("a:\n\tb: 1"), /Tab indentation/);
  assert.throws(() => pure.parseYamlSubset("a: 1\na: 2"), /Duplicate key/);
  let deep = "";
  for (let i = 0; i < 20; i++) deep += " ".repeat(i) + "k:\n";
  assert.throws(() => pure.parseYamlSubset(deep), /Too deeply nested/);
});

test("parseYamlSubset: rejects unsupported YAML constructs", () => {
  assert.throws(() => pure.parseYamlSubset("a: &anchor"), /Unsupported YAML/);
  assert.throws(() => pure.parseYamlSubset("a: [1, 2]"), /Unsupported YAML/);
});

test("lyricsfileToLines: word-timed lyricsfile", () => {
  const result = pure.lyricsfileToLines(
    [
      "version: '1.0'",
      "metadata:",
      "  title: Song",
      "  artist: Artist",
      "  duration_ms: 20000",
      "lines:",
      "  - text: Hello world",
      "    start_ms: 1000",
      "    end_ms: 3000",
      "    words:",
      "      - text: Hello",
      "        start_ms: 1000",
      "        end_ms: 2000",
      "      - text: ' '",
      "        start_ms: 2000",
      "        end_ms: 2000",
      "      - text: world",
      "        start_ms: 2000",
      "        end_ms: 3000",
    ].join("\n"),
  );
  assert.equal(result.wordTimed, true);
  assert.equal(result.lines.length, 1);
  assert.equal(result.lines[0].exact, true);
  assert.equal(result.lines[0].text, "Hello world");
  assert.deepEqual(
    result.lines[0].words.map((w) => [w.text, w.ms, w.endTime]),
    [
      ["Hello ", 1000, 2000],
      ["world", 2000, 3000],
    ],
  );
});

test("lyricsfileToLines: rejects wrong version and invalid times", () => {
  assert.throws(
    () => pure.lyricsfileToLines("version: '2.0'\nmetadata: {}\nlines: []"),
    /Unsupported lyricsfile/,
  );
  assert.throws(
    () =>
      pure.lyricsfileToLines(
        "version: '1.0'\nmetadata: {}\nlines:\n  - text: Hi\n    start_ms: -1",
      ),
    /Invalid line start/,
  );
  assert.throws(
    () =>
      pure.lyricsfileToLines(
        "version: '1.0'\nmetadata: {}\nlines:\n  - text: Hi\n    start_ms: 100\n    end_ms: 50",
      ),
    /Invalid line end/,
  );
});

test("lyricsfileToLines: empty lines are not word-timed", () => {
  const result = pure.lyricsfileToLines("version: '1.0'\nmetadata: {}\nlines: []");
  assert.deepEqual(result.lines, []);
  assert.equal(result.wordTimed, false);
});

test("normalizeName: strips accents, brackets, and edition suffixes", () => {
  assert.equal(pure.normalizeName("Café del Mar"), "cafe del mar");
  assert.equal(pure.normalizeName("Song (Remastered 2011)"), "song");
  assert.equal(pure.normalizeName("Song - Live at Wembley"), "song");
  assert.equal(pure.normalizeName("Rock & Roll"), "rock and roll");
  assert.equal(pure.normalizeName(""), "");
});

test("sameName: tolerates small title differences but not unrelated titles", () => {
  assert.equal(pure.sameName("Hello", "Hello (Remastered)"), true);
  assert.equal(pure.sameName("Hello", "Hello, Goodbye"), false);
  assert.equal(pure.sameName("", "Hello"), false);
});

test("splitArtists: splits common separators and features", () => {
  assert.deepEqual(pure.splitArtists("A & B feat. C"), ["A", "B", "C"]);
  assert.deepEqual(pure.splitArtists("A, B; C/D"), ["A", "B", "C", "D"]);
  assert.deepEqual(pure.splitArtists(""), []);
});

test("trackMatches: accepts a matching record", () => {
  const record = { trackName: "Hello", artistName: "Adele", duration: 295 };
  const metadata = { title: "Hello", artist: "Adele", duration_ms: 295000 };
  const track = { title: "Hello", artists: ["Adele"], durationMs: 295000 };
  assert.deepEqual(pure.trackMatches(record, metadata, track), { ok: true });
});

test("trackMatches: rejects title, artist, and duration mismatches", () => {
  const track = { title: "Hello", artists: ["Adele"], durationMs: 295000 };
  assert.equal(
    pure.trackMatches({ trackName: "Other" }, {}, track).reason,
    "title",
  );
  assert.equal(
    pure.trackMatches({ artistName: "Someone" }, {}, track).reason,
    "artist",
  );
  assert.equal(
    pure.trackMatches({ duration: 100 }, {}, track).reason,
    "duration",
  );
});

test("trackMatches: rejects records with no comparable metadata", () => {
  assert.deepEqual(
    pure.trackMatches({}, {}, { title: "Hello", artists: ["Adele"] }),
    { ok: false, reason: "no metadata" },
  );
});

test("pickLyrics: prefers valid word-timed lyricsfile", () => {
  const lyricsfile = [
    "version: '1.0'",
    "metadata:",
    "  title: Hello",
    "  artist: Adele",
    "  duration_ms: 295000",
    "lines:",
    "  - text: Hello",
    "    start_ms: 1000",
    "    words:",
    "      - text: Hello",
    "        start_ms: 1000",
    "        end_ms: 2000",
  ].join("\n");
  const result = pure.pickLyrics(
    { lyricsfile, syncedLyrics: "[00:01.00]fallback" },
    { title: "Hello", artists: ["Adele"], durationMs: 295000 },
  );
  assert.equal(result.source, "word-timed");
  assert.equal(result.lines[0].exact, true);
});

test("pickLyrics: falls back to synced lyrics when lyricsfile is unusable", () => {
  const result = pure.pickLyrics(
    { lyricsfile: "not: valid: yaml: [", syncedLyrics: "[00:01.00]Fallback" },
    { title: "Hello", artists: ["Adele"], durationMs: 1000 },
  );
  assert.equal(result.source, "synced");
  assert.equal(result.lines[0].text, "Fallback");
});

test("pickLyrics: ignores word-timed lyrics for a different track", () => {
  const lyricsfile = [
    "version: '1.0'",
    "metadata:",
    "  title: Different",
    "  artist: Someone",
    "lines:",
    "  - text: Hello",
    "    start_ms: 0",
    "    words:",
    "      - text: Hello",
    "        start_ms: 0",
  ].join("\n");
  const result = pure.pickLyrics(
    { lyricsfile },
    { title: "Hello", artists: ["Adele"], durationMs: 1000 },
  );
  assert.equal(result.source, "none");
});

test("pickLyrics: no lyrics returns none", () => {
  assert.deepEqual(pure.pickLyrics({}, {}), { lines: [], source: "none" });
});

test("escapeStep: Escape closes menu, then settings, then overlay", () => {
  const base = {
    overlayOpen: true,
    menuOpen: false,
    settingsOpen: false,
    inRoot: true,
    editable: false,
  };
  assert.equal(pure.escapeStep({ ...base, menuOpen: true }), "menu");
  assert.equal(pure.escapeStep({ ...base, settingsOpen: true }), "settings");
  assert.equal(pure.escapeStep(base), "overlay");
});

test("escapeStep: does nothing when closed, outside, or typing", () => {
  const base = {
    overlayOpen: true,
    menuOpen: false,
    settingsOpen: false,
    inRoot: true,
    editable: false,
  };
  assert.equal(pure.escapeStep({ ...base, overlayOpen: false }), null);
  assert.equal(pure.escapeStep({ ...base, editable: true }), null);
  assert.equal(pure.escapeStep({ ...base, inRoot: false }), null);
});

test("endOfWord: exact timing uses the word's own end", () => {
  const line = {
    exact: true,
    end: 9000,
    display: [
      { ms: 1000, endTime: 1600 },
      { ms: 2000, endTime: 8500 },
    ],
  };
  assert.equal(pure.endOfWord(line, 0), 1600);
  assert.equal(pure.endOfWord(line, 1), 8500);
});

test("endOfWord: exact timing never collapses to zero length", () => {
  const line = {
    exact: true,
    end: 9000,
    display: [{ ms: 1000, endTime: 1000 }],
  };
  assert.equal(pure.endOfWord(line, 0), 1001);
});

test("endOfWord: estimated timing runs to the next word", () => {
  const line = {
    exact: false,
    end: 9000,
    display: [{ ms: 1000 }, { ms: 2500 }],
  };
  assert.equal(pure.endOfWord(line, 0), 2500);
  assert.equal(pure.endOfWord(line, 1), 9000);
});

test("wordFlowOpacity: upcoming, active, and sung words", () => {
  // Far ahead of the word: dim.
  assert.equal(pure.wordFlowOpacity(1000, 1400, 0), 0.5);
  // Just before the word: begins to brighten.
  assert.ok(pure.wordFlowOpacity(1000, 1400, 950) > 0.5);
  assert.ok(pure.wordFlowOpacity(1000, 1400, 950) < 0.62);
  // At the start: the active ramp begins.
  assert.equal(pure.wordFlowOpacity(1000, 1400, 1000), 0.62);
  // Halfway through: mid ramp.
  assert.equal(pure.wordFlowOpacity(1000, 1400, 1200), 0.81);
  // At the end and after: fully settled.
  assert.equal(pure.wordFlowOpacity(1000, 1400, 1400), 1);
  assert.equal(pure.wordFlowOpacity(1000, 1400, 5000), 1);
});

test("wordFlowOpacity: long words settle within half a second", () => {
  assert.ok(pure.wordFlowOpacity(1000, 6000, 1400) < 1);
  assert.equal(pure.wordFlowOpacity(1000, 6000, 1500), 1);
});

test("wordFlowOpacity: clamps progress outside the word", () => {
  assert.equal(pure.wordFlowOpacity(1000, 1400, -500), 0.5);
  assert.equal(pure.wordFlowOpacity(1000, 1400, 999999), 1);
});


test("romanizeText: Korean Hangul", () => {
  assert.equal(romanizeText("안녕하세요"), "annyeonghaseyo");
});

test("romanizeText: Japanese kana and small kana", () => {
  assert.equal(romanizeText("こんにちは"), "konnichiha");
  assert.equal(romanizeText("きゃ"), "kya");
});

test("romanizeText: Cyrillic preserves case", () => {
  assert.equal(romanizeText("Привет"), "Privet");
});

test("romanizeText: Latin and Chinese text need no romanization", () => {
  assert.equal(romanizeText("Hello"), "");
  assert.equal(romanizeText("你好"), "");
});

test("translation service: batches, caches, and preserves empty lines", async () => {
  const requests = [];
  const service = createTranslationService({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => [[["Hola\nMundo", ""]]],
      };
    },
  });
  const result = await service.translateLines(["Hello", "", "World"], "es");
  assert.deepEqual(result, ["Hola", "", "Mundo"]);
  assert.equal(requests.length, 1);
  assert.deepEqual(await service.translateLines(["Hello", "", "World"], "es"), result);
  assert.equal(requests.length, 1);
  assert.equal(service.cacheSize, 3);
});

test("translation service: propagates HTTP failures", async () => {
  const service = createTranslationService({
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  await assert.rejects(service.translateLines(["Hello"], "fr"), /HTTP 429/);
});

test("translation service: forwards abort signals", async () => {
  const controller = new AbortController();
  let receivedSignal;
  const service = createTranslationService({
    fetchImpl: async (_url, options) => {
      receivedSignal = options.signal;
      return { ok: true, json: async () => [[["Bonjour", ""]]] };
    },
  });
  await service.translateLines(["Hello"], "fr", controller.signal);
  assert.equal(receivedSignal, controller.signal);
});

test("translation service: evicts old entries when the cache reaches its limit", async () => {
  const service = createTranslationService({
    maxCacheEntries: 2,
    fetchImpl: async (url) => {
      const query = new URL(url).searchParams.get("q");
      return { ok: true, json: async () => [[[`translated:${query}`, ""]]] };
    },
  });
  await service.translateLines(["one"], "en");
  await service.translateLines(["two"], "en");
  await service.translateLines(["three"], "en");
  assert.equal(service.cacheSize, 2);
});


test("settings: loads defaults when storage is empty", async () => {
  const { defaultOptions, loadSettings } = await import("../src/core/settings.js");
  const storage = { getItem: () => null, setItem: () => {} };
  const loaded = loadSettings(storage);
  assert.deepEqual(loaded.options, defaultOptions);
  assert.equal(loaded.migratedDefaultDim, false);
});

test("settings: migrates the old dim default and retired slider preference", async () => {
  const { defaultOptions, loadSettings } = await import("../src/core/settings.js");
  let stored;
  const storage = {
    getItem: () => JSON.stringify({ dim: 0.4, sliderStyle: "glow", lyricMode: "gentle" }),
    setItem: (_key, value) => { stored = JSON.parse(value); },
  };
  const loaded = loadSettings(storage);
  assert.equal(loaded.options.dim, defaultOptions.dim);
  assert.equal(loaded.options.lyricMode, "gentle");
  assert.equal("sliderStyle" in loaded.options, false);
  assert.equal(loaded.migratedDefaultDim, true);
  assert.equal("sliderStyle" in stored, false);
});

test("settings: malformed or blocked storage falls back without throwing", async () => {
  const { loadSettings, saveSettings } = await import("../src/core/settings.js");
  const broken = {
    getItem: () => "{not json",
    setItem: () => { throw new Error("storage blocked"); },
  };
  const loaded = loadSettings(broken);
  assert.equal(loaded.options.lyricMode, "word");
  assert.doesNotThrow(() => saveSettings(loaded.options, broken));
});


test("styles: installs all overlay style layers without runtime globals", () => {
  const appended = [];
  const document = {
    createElement: (tagName) => ({ tagName, textContent: "" }),
    head: { append: (element) => appended.push(element) },
  };
  installStyles(document);
  assert.equal(appended.length, 9);
  assert.ok(appended.every((element) => element.tagName === "style" && element.textContent.length > 0));
  assert.match(appended[8].textContent, /control-button-lyrics/);
  assert.match(appended[0].textContent, /#luma-root \.layout/);
  assert.match(appended[2].textContent, /control-button-lyrics/);
  assert.match(appended[2].textContent, /aria-label=\\?"Luma Lyrics/);
  assert.match(appended[6].textContent, /player \.volume\\?\{display:flex!important/);
  assert.match(appended[6].textContent, /volume-value/);
  assert.match(appended[6].textContent, /max-width:560px/);
});


test("artwork palette: default accent populates Material and Spotify variables", () => {
  const values = new Map();
  const style = { setProperty: (key, value) => values.set(key, value) };
  const palette = createArtworkPalette({ style }, { documentElement: { style } });
  palette.setDefaultAccent();
  assert.ok(values.has("--md-primary"));
  assert.ok(values.has("--accent"));
  assert.ok(values.has("--luma-primary"));
  assert.ok(values.has("--luma-surface-container"));
});

test("artwork palette: artwork sampling uses a canvas and applies an accent", () => {
  const values = new Map();
  const style = { setProperty: (key, value) => values.set(key, value) };
  const pixels = new Uint8ClampedArray(32 * 32 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 190;
    pixels[i + 1] = 70;
    pixels[i + 2] = 90;
    pixels[i + 3] = 255;
  }
  const context = { drawImage: () => {}, getImageData: () => ({ data: pixels }) };
  const document = {
    documentElement: { style },
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  };
  const palette = createArtworkPalette({ style }, document);
  palette.setArtworkAccent({});
  assert.ok(values.has("--md-primary"));
  assert.ok(values.has("--accent-rgb"));
});


test("settings and vinyl styling stay restrained and playback-aware", () => {
  const appended = [];
  const document = {
    head: { append(style) { appended.push(style.textContent); } },
    createElement() { return { textContent: "", disabled: false }; },
  };
  installStyles(document);
  const styles = appended.join("\\n");
  assert.match(styles, /luma-vinyl-rotation/);
  assert.match(styles, /repeating-radial-gradient/);
  assert.match(styles, /animation-play-state:paused/);
  assert.match(styles, /#luma-root\\.vinyl\\.playing \\.artwork-stage\\{animation-play-state:running\\}/);
  assert.doesNotMatch(styles, /luma-vinyl-spin/);
  assert.match(styles, /content:none!important/);
  assert.match(styles, /transform:none!important/);
  assert.match(styles, /box-shadow:none!important/);
  assert.doesNotMatch(styles, /luma-settings-pulse/);
});
