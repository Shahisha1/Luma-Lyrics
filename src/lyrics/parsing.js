export function parse(text) {
  const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0),
    result = [];
  for (const row of text.split(/\r?\n/)) {
    const tags = [
      ...row.matchAll(/<(\d+):(\d+(?:\.\d+)?)>|\[(\d+):(\d+(?:\.\d+)?)\]/g),
    ];
    if (!tags.length) continue;
    const timeOf = (tag) =>
        (Number(tag[1] ?? tag[3]) * 60 + Number(tag[2] ?? tag[4])) * 1000 +
        offset,
      hasEnhancedTags = tags.some((tag) => tag[1] !== undefined),
      hasInlineSquareWordTags = tags.some(
        (tag, i) =>
          tag[3] !== undefined &&
          i < tags.length - 1 &&
          /\S/.test(row.slice(tag.index + tag[0].length, tags[i + 1].index)),
      );
    if (hasEnhancedTags || hasInlineSquareWordTags) {
      const words = tags
        .map((tag, i) => ({
          ms: Math.max(0, timeOf(tag)),
          text: row.slice(
            tag.index + tag[0].length,
            tags[i + 1]?.index ?? row.length,
          ),
        }))
        .filter((word) => word.text.trim());
      if (!words.length) continue;
      result.push({
        ms: Math.max(0, timeOf(tags[0])),
        text:
          words
            .map((word) => word.text)
            .join("")
            .trim() || "♪",
        words,
        exact: true,
      });
      continue;
    }
    const body = row.replace(/\[[^\]]*\]/g, "").trim() || "♪";
    for (const tag of tags)
      result.push({
        ms: Math.max(0, timeOf(tag)),
        text: body,
        words: [],
        exact: false,
      });
  }
  result.sort((a, b) => a.ms - b.ms);
  result.forEach((line, i) => {
    line.lineIndex = i;
    line.words.forEach((word, j) => {
      word.endTime =
        line.words[j + 1]?.ms ?? result[i + 1]?.ms ?? line.ms + 4000;
    });
  });
  return result;
}
// LRCLIB "Lyricsfile" adapter. LRCLIB returns a YAML `lyricsfile` string with word timing
// alongside the legacy `syncedLyrics`. Spec: https://github.com/tranxuanthang/lyricsfile
// The spec only allows mappings, sequences, strings, integers, booleans and null, so a small
// parser for that subset is enough (no dependency). Anything else throws and we fall back.
export function parseYamlSubset(source) {
  if (typeof source !== "string" || !source.trim() || source.length > 1500000)
    throw new Error("Unusable lyricsfile");
  const rows = source.replace(/^\uFEFF/, "").split(/\r?\n/);
  const KEY =
    /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[A-Za-z0-9_][A-Za-z0-9_.-]*)[ \t]*:(?:[ \t]+(.*))?$/;
  const isDash = (s) => s === "-" || s.startsWith("- ");
  let i = 0,
    depth = 0;
  const indentOf = (row) => {
    const n = /^ */.exec(row)[0].length;
    if (row[n] === "\t") throw new Error("Tab indentation");
    return n;
  };
  const skip = () => {
    while (i < rows.length) {
      const t = rows[i].trim();
      if (!t || t[0] === "#") i++;
      else break;
    }
  };
  const scalar = (raw) => {
    const s = raw.trim();
    if (s === "" || s === "~" || /^(null|Null|NULL)$/.test(s)) return null;
    if (s === "[]") return [];
    if (s === "{}") return {};
    if (s[0] === '"') {
      const m = /^"((?:[^"\\]|\\.)*)"\s*(?:#.*)?$/.exec(s);
      if (!m) throw new Error("Bad string");
      return JSON.parse('"' + m[1] + '"');
    }
    if (s[0] === "'") {
      const m = /^'((?:[^']|'')*)'\s*(?:#.*)?$/.exec(s);
      if (!m) throw new Error("Bad string");
      return m[1].replace(/''/g, "'");
    }
    if ("&*!|>%@`[{".includes(s[0])) throw new Error("Unsupported YAML");
    const plain = s.replace(/\s+#.*$/, "");
    if (/^[+-]?\d+$/.test(plain)) return Number(plain);
    if (/^(true|True|TRUE)$/.test(plain)) return true;
    if (/^(false|False|FALSE)$/.test(plain)) return false;
    return plain;
  };
  const blockScalar = (header, parentIndent) => {
    const literal = header[0] === "|",
      out = [];
    let blockIndent = -1;
    while (i < rows.length) {
      const row = rows[i];
      if (!row.trim()) {
        out.push("");
        i++;
        continue;
      }
      const ind = indentOf(row);
      if (ind <= parentIndent) break;
      if (blockIndent < 0) blockIndent = ind;
      out.push(row.slice(Math.min(ind, blockIndent)));
      i++;
    }
    while (out.length && out[out.length - 1] === "") out.pop();
    const body = literal ? out.join("\n") : out.join(" ");
    return header.includes("-") ? body : body + "\n";
  };
  const parseNode = (minIndent) => {
    skip();
    if (i >= rows.length) return null;
    const ind = indentOf(rows[i]);
    if (ind < minIndent) return null;
    const content = rows[i].slice(ind);
    if (++depth > 16) throw new Error("Too deeply nested");
    try {
      if (isDash(content)) return parseSeq(ind);
      if (KEY.test(content)) return parseMap(ind);
      i++;
      return scalar(content);
    } finally {
      depth--;
    }
  };
  const parseMap = (ind) => {
    const obj = Object.create(null);
    for (;;) {
      skip();
      if (i >= rows.length) break;
      const here = indentOf(rows[i]);
      if (here < ind) break;
      if (here > ind) throw new Error("Bad indentation");
      const content = rows[i].slice(ind);
      if (isDash(content)) break;
      const m = KEY.exec(content);
      if (!m) throw new Error("Bad mapping");
      const key = m[1][0] === '"' || m[1][0] === "'" ? scalar(m[1]) : m[1];
      if (key in obj) throw new Error("Duplicate key");
      i++;
      const rest = (m[2] || "").trim();
      let value;
      if (rest === "" || rest[0] === "#") {
        skip();
        const next = i < rows.length ? indentOf(rows[i]) : -1;
        if (next > ind) value = parseNode(ind + 1);
        else if (next === ind && isDash(rows[i].slice(next)))
          value = parseSeq(ind);
        else value = null;
      } else if (/^[|>][+-]?\d*\s*(#.*)?$/.test(rest))
        value = blockScalar(rest, ind);
      else value = scalar(rest);
      obj[key] = value;
    }
    return obj;
  };
  const parseSeq = (ind) => {
    const arr = [];
    for (;;) {
      skip();
      if (i >= rows.length) break;
      const here = indentOf(rows[i]);
      if (here < ind) break;
      if (here > ind) throw new Error("Bad indentation");
      const content = rows[i].slice(ind);
      if (!isDash(content)) break;
      const after = content.slice(1),
        rest = after.trimStart(),
        restIndent = ind + 1 + (after.length - rest.length);
      if (rest === "" || rest[0] === "#") {
        i++;
        arr.push(parseNode(ind + 1));
      } else if (KEY.test(rest)) {
        rows[i] = " ".repeat(restIndent) + rest;
        arr.push(parseMap(restIndent));
      } else {
        i++;
        arr.push(scalar(rest));
      }
    }
    return arr;
  };
  skip();
  if (rows[i]?.trim() === "---") i++;
  const doc = parseNode(0);
  skip();
  if (i < rows.length && rows[i].trim() !== "...")
    throw new Error("Unexpected content");
  return doc;
}
// Converts a lyricsfile into Luma's internal lines ({ ms, text, words, exact }).
// `wordTimed` is true only when real word timestamps cover most of the lyrics.
export function lyricsfileToLines(source) {
  const doc = parseYamlSubset(source),
    isMap = (v) => v && typeof v === "object" && !Array.isArray(v);
  if (!isMap(doc) || doc.version !== "1.0" || !isMap(doc.metadata))
    throw new Error("Unsupported lyricsfile");
  const metadata = doc.metadata,
    time = (v, label) => {
      if (!Number.isSafeInteger(v) || v < 0)
        throw new Error("Invalid " + label);
      return v;
    },
    optionalEnd = (v, start, label) => {
      if (v == null) return null;
      const end = time(v, label);
      if (end < start) throw new Error("Invalid " + label);
      return end;
    };
  if (!Array.isArray(doc.lines) || !doc.lines.length)
    return { metadata, lines: [], wordTimed: false };
  const parsed = doc.lines
    .map((raw) => {
      if (!isMap(raw) || typeof raw.text !== "string")
        throw new Error("Invalid line");
      const start = time(raw.start_ms, "line start"),
        end = optionalEnd(raw.end_ms, start, "line end");
      if (raw.words != null && !Array.isArray(raw.words))
        throw new Error("Invalid words");
      const words = [];
      for (const w of raw.words || []) {
        if (!isMap(w) || typeof w.text !== "string")
          throw new Error("Invalid word");
        const ms = time(w.start_ms, "word start"),
          wordEnd = optionalEnd(w.end_ms, ms, "word end");
        if (!w.text.trim()) {
          // Keep spacing that was written as its own segment.
          if (words.length) words[words.length - 1].text += w.text;
          continue;
        }
        words.push({ ms, text: w.text, end: wordEnd });
      }
      words.sort((a, b) => a.ms - b.ms);
      return { ms: start, end, text: raw.text, words };
    })
    .sort((a, b) => a.ms - b.ms);
  const out = parsed.map((l, idx) => {
    const hasWords = l.words.length > 0,
      fallbackEnd = l.end ?? parsed[idx + 1]?.ms;
    return {
      ms: hasWords ? Math.min(l.ms, l.words[0].ms) : l.ms,
      text:
        (hasWords ? l.words.map((w) => w.text).join("") : l.text).trim() || "♪",
      words: l.words.map((w, j) => ({
        ms: w.ms,
        text: w.text,
        endTime: Math.max(
          w.ms,
          w.end ?? l.words[j + 1]?.ms ?? fallbackEnd ?? w.ms + 4000,
        ),
      })),
      exact: hasWords,
      lineIndex: idx,
    };
  });
  const textLines = parsed.filter((l) => l.text.trim()).length,
    wordLines = out.filter((l) => l.exact).length;
  return {
    metadata,
    lines: out,
    wordTimed:
      wordLines > 0 &&
      wordLines >= textLines / 2 &&
      out.some((l) => l.words.some((w) => w.ms > 0)),
  };
}
export function normalizeName(value) {
  const base = String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ");
  const clean = (s) => s.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  return (
    clean(
      base
        .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
        .replace(
          /\s[-–—]\s.*\b(remaster(ed)?|version|mix|edit|live|mono|stereo|deluxe|radio|acoustic|feat\.?|ft\.?)\b.*$/,
          " ",
        ),
    ) || clean(base)
  );
}
export function sameName(a, b) {
  const x = normalizeName(a),
    y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tx = new Set(x.split(" ")),
    ty = new Set(y.split(" ")),
    shared = [...tx].filter((t) => ty.has(t)).length;
  return shared / new Set([...tx, ...ty]).size >= 0.6;
}
export function splitArtists(value) {
  return String(value ?? "")
    .split(/,|;|\/|&|\band\b|\bfeat\.?|\bft\.?|\bx\b|\bwith\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}
// Decides whether a lyrics record plausibly belongs to the playing track.
// Only fields that are actually present are compared; any disagreement rejects the record.
export function trackMatches(record, metadata, track) {
  let compared = 0;
  const present = (v) => typeof v === "string" && v.trim();
  for (const title of [record?.trackName, record?.name, metadata?.title])
    if (present(title) && present(track?.title)) {
      compared++;
      if (!sameName(title, track.title)) return { ok: false, reason: "title" };
    }
  const wanted = (track?.artists || []).flatMap(splitArtists);
  for (const artist of [record?.artistName, metadata?.artist])
    if (present(artist) && wanted.length) {
      compared++;
      const found = splitArtists(artist);
      if (!found.some((f) => wanted.some((w) => sameName(f, w))))
        return { ok: false, reason: "artist" };
    }
  if (track?.durationMs > 0)
    for (const ms of [
      Number(record?.duration) * 1000,
      Number(metadata?.duration_ms),
    ])
      if (Number.isFinite(ms) && ms > 0) {
        compared++;
        if (Math.abs(ms - track.durationMs) > 3000)
          return { ok: false, reason: "duration" };
      }
  return compared ? { ok: true } : { ok: false, reason: "no metadata" };
}
// Fallback order: verified word-timed lyricsfile -> existing LRCLIB synced lyrics.
// (Estimated word timing for line-only lyrics is applied later, in render().)
export function pickLyrics(record, track) {
  if (typeof record?.lyricsfile === "string" && record.lyricsfile.trim()) {
    try {
      const result = lyricsfileToLines(record.lyricsfile);
      if (result.wordTimed) {
        const match = trackMatches(record, result.metadata, track);
        if (match.ok) return { lines: result.lines, source: "word-timed" };
        console.debug(
          "[Luma Lyrics] Ignoring word-timed lyrics:",
          match.reason,
        );
      }
    } catch (error) {
      console.debug(
        "[Luma Lyrics] Ignoring unusable lyricsfile:",
        error.message,
      );
    }
  }
  const lines =
    typeof record?.syncedLyrics === "string" ? parse(record.syncedLyrics) : [];
  return { lines, source: lines.length ? "synced" : "none" };
}
// What Escape should do. Settings/menu close from anywhere while Luma is open; closing the
// whole overlay still requires focus inside it; text fields are never interrupted.
export function escapeStep({
  overlayOpen,
  menuOpen,
  settingsOpen,
  inRoot,
  editable,
}) {
  if (!overlayOpen || editable) return null;
  if (menuOpen) return "menu";
  if (settingsOpen) return "settings";
  return inRoot ? "overlay" : null;
}
// A word stays current until its real end time when the source has one, or
// until the next word starts when the timing is estimated.
export function endOfWord(line, j) {
  const word = line.display[j];
  return line.exact
    ? Math.max(word.ms + 1, word.endTime ?? line.end)
    : Math.min(line.display[j + 1]?.ms ?? line.end, line.end);
}
// Opacity for a single word: upcoming words sit dim, the current word ramps
// up across its duration, and sung words settle at full strength. The small
// pre-roll lets the highlight ease into the next word.
export function wordFlowOpacity(start, end, progress) {
  if (progress < start) {
    const lead = 180,
      approach = Math.max(0, Math.min(1, 1 - (start - progress) / lead));
    return 0.5 + approach * 0.12;
  }
  if (progress >= end) return 1;
  // Long words settle quickly instead of fading in for their whole duration.
  const ramp = Math.max(1, Math.min(end - start, 480));
  const fraction = Math.max(0, Math.min(1, (progress - start) / ramp));
  return 0.62 + fraction * 0.38;
}
