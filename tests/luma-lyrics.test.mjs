// Tests for the pure helpers inside luma-lyrics.js.
//
// The extension ships as a single file, so the helpers that do not touch the
// DOM or Spicetify are wrapped in <luma-pure> ... </luma-pure>. This suite
// extracts that block and evaluates it, which keeps the tests dependency-free
// and guarantees they exercise the exact code that ships.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "..", "luma-lyrics.js"), "utf8");

const start = source.indexOf("// <luma-pure>");
const end = source.indexOf("// </luma-pure>");
assert.ok(start !== -1 && end > start, "luma-pure markers are present");

const pureSource = source.slice(start, end);
const names = [
  "parse",
  "parseYamlSubset",
  "lyricsfileToLines",
  "normalizeName",
  "sameName",
  "splitArtists",
  "trackMatches",
  "pickLyrics",
  "escapeStep",
  "endOfWord",
  "wordFlowOpacity",
];
const pure = new Function(`${pureSource}\nreturn { ${names.join(", ")} };`)();

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
