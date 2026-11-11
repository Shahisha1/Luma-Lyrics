// Luma Lyrics v2.3.1

(async () => {
function parse(text) {
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
function parseYamlSubset(source) {
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
function lyricsfileToLines(source) {
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
        (hasWords ? l.words.map((w) => w.text).join("") : l.text).trim() ||
        "♪",
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
function normalizeName(value) {
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
function sameName(a, b) {
  const x = normalizeName(a),
    y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tx = new Set(x.split(" ")),
    ty = new Set(y.split(" ")),
    shared = [...tx].filter((t) => ty.has(t)).length;
  return shared / new Set([...tx, ...ty]).size >= 0.6;
}
function splitArtists(value) {
  return String(value ?? "")
    .split(/,|;|\/|&|\band\b|\bfeat\.?|\bft\.?|\bx\b|\bwith\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}
// Decides whether a lyrics record plausibly belongs to the playing track.
// Only fields that are actually present are compared; any disagreement rejects the record.
function trackMatches(record, metadata, track) {
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
function pickLyrics(record, track) {
  if (typeof record?.lyricsfile === "string" && record.lyricsfile.trim()) {
    try {
      const result = lyricsfileToLines(record.lyricsfile);
      if (result.wordTimed) {
        const match = trackMatches(record, result.metadata, track);
        if (match.ok) return { lines: result.lines, source: "word-timed" };
        console.debug("[Luma Lyrics] Ignoring word-timed lyrics:", match.reason);
      }
    } catch (error) {
      console.debug("[Luma Lyrics] Ignoring unusable lyricsfile:", error.message);
    }
  }
  const lines =
    typeof record?.syncedLyrics === "string" ? parse(record.syncedLyrics) : [];
  return { lines, source: lines.length ? "synced" : "none" };
}
// What Escape should do. Settings/menu close from anywhere while Luma is open; closing the
// whole overlay still requires focus inside it; text fields are never interrupted.
function escapeStep({ overlayOpen, menuOpen, settingsOpen, inRoot, editable }) {
  if (!overlayOpen || editable) return null;
  if (menuOpen) return "menu";
  if (settingsOpen) return "settings";
  return inRoot ? "overlay" : null;
}
// A word stays current until its real end time when the source has one, or
// until the next word starts when the timing is estimated.
function endOfWord(line, j) {
  const word = line.display[j];
  return line.exact
    ? Math.max(word.ms + 1, word.endTime ?? line.end)
    : Math.min(line.display[j + 1]?.ms ?? line.end, line.end);
}
// Opacity for a single word: upcoming words sit dim, the current word ramps
// up across its duration, and sung words settle at full strength. The small
// pre-roll lets the highlight ease into the next word.
function wordFlowOpacity(start, end, progress) {
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

// ── Offline romanization ─────────────────────────────────────────
// Korean: Revised Romanization. Japanese: Hepburn (kana; kanji left as-is).
// Cyrillic: readable Latin transliteration. Hindi: readable Devanagari transliteration.
const KO_I = ["g","kk","n","d","tt","r","m","b","p","s","ss","","j","jj","ch","k","t","p","h"],
  KO_M = ["a","ae","ya","yae","eo","e","yeo","ye","o","wa","wae","oe","yo","u","wo","we","wi","yu","eu","ui","i"],
  KO_F = ["","k","k","k","n","n","n","t","l","k","m","l","l","l","p","l","m","p","p","t","t","ng","t","t","k","t","p","t"],
  CYR = {А:"A",Б:"B",В:"V",Г:"G",Д:"D",Е:"E",Ё:"Yo",Ж:"Zh",З:"Z",И:"I",Й:"Y",К:"K",Л:"L",М:"M",Н:"N",О:"O",П:"P",Р:"R",С:"S",Т:"T",У:"U",Ф:"F",Х:"Kh",Ц:"Ts",Ч:"Ch",Ш:"Sh",Щ:"Shch",Ъ:"",Ы:"Y",Ь:"",Э:"E",Ю:"Yu",Я:"Ya"},
  HI_VOWELS = {"अ":"a","आ":"aa","इ":"i","ई":"ee","उ":"u","ऊ":"oo","ऋ":"ri","ॠ":"ree","ए":"e","ऐ":"ai","ओ":"o","औ":"au","ऑ":"o","ऍ":"e"},
  HI_MATRAS = {"ा":"aa","ि":"i","ी":"ee","ु":"u","ू":"oo","ृ":"ri","ॄ":"ree","े":"e","ै":"ai","ो":"o","ौ":"au","ॉ":"o","ॅ":"e"},
  HI_CONSONANTS = {"क":"k","ख":"kh","ग":"g","घ":"gh","ङ":"ng","च":"ch","छ":"chh","ज":"j","झ":"jh","ञ":"ny","ट":"t","ठ":"th","ड":"d","ढ":"dh","ण":"n","त":"t","थ":"th","द":"d","ध":"dh","न":"n","प":"p","फ":"ph","ब":"b","भ":"bh","म":"m","य":"y","र":"r","ल":"l","व":"v","श":"sh","ष":"sh","स":"s","ह":"h","ळ":"l"},
  HI_NUKTA = {"क़":"q","ख़":"kh","ग़":"gh","ज़":"z","ड़":"d","ढ़":"dh","फ़":"f","ऱ":"r","ऩ":"n"},
  KANA = Object.fromEntries(
    [
      ["あ","a"],["い","i"],["う","u"],["え","e"],["お","o"],["か","ka"],["き","ki"],["く","ku"],["け","ke"],["こ","ko"],
      ["が","ga"],["ぎ","gi"],["ぐ","gu"],["げ","ge"],["ご","go"],["さ","sa"],["し","shi"],["す","su"],["せ","se"],["そ","so"],
      ["ざ","za"],["じ","ji"],["ず","zu"],["ぜ","ze"],["ぞ","zo"],["た","ta"],["ち","chi"],["つ","tsu"],["て","te"],["と","to"],
      ["だ","da"],["ぢ","ji"],["づ","zu"],["で","de"],["ど","do"],["な","na"],["に","ni"],["ぬ","nu"],["ね","ne"],["の","no"],
      ["は","ha"],["ひ","hi"],["ふ","fu"],["へ","he"],["ほ","ho"],["ば","ba"],["び","bi"],["ぶ","bu"],["べ","be"],["ぼ","bo"],
      ["ぱ","pa"],["ぴ","pi"],["ぷ","pu"],["ぺ","pe"],["ぽ","po"],["ま","ma"],["み","mi"],["む","mu"],["め","me"],["も","mo"],
      ["や","ya"],["ゆ","yu"],["よ","yo"],["ら","ra"],["り","ri"],["る","ru"],["れ","re"],["ろ","ro"],["わ","wa"],["を","wo"],
      ["ん","n"],["ゔ","vu"],
    ],
  ),
  SMALL = {ゃ:"ya",ゅ:"yu",ょ:"yo",ぁ:"a",ぃ:"i",ぅ:"u",ぇ:"e",ぉ:"o",ャ:"ya",ュ:"yu",ョ:"yo"},
  romajiOf = (ch) =>
    KANA[ch] ??
    (ch >= "ァ" && ch <= "ヶ"
      ? KANA[String.fromCharCode(ch.charCodeAt(0) - 0x60)]
      : null);

function romanizeHindi(chars) {
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (HI_VOWELS[ch]) {
      out += HI_VOWELS[ch];
    } else if (HI_CONSONANTS[ch]) {
      const nuktaForm = ch + (chars[i + 1] === "़" ? "़" : "");
      const consonant = HI_NUKTA[nuktaForm] || HI_CONSONANTS[ch];
      if (nuktaForm !== ch) i++;
      out += consonant;
      const next = chars[i + 1];
      if (HI_MATRAS[next]) {
        out += HI_MATRAS[next];
        i++;
      } else if (next === "्") {
        i++;
      } else if (!next || /[\s.,!?;:।॥…()[\]{}"'“”‘’]/u.test(next)) {
        // Drop the inherent vowel at the end of a word.
      } else {
        out += "a";
      }
    } else if (ch === "ं" || ch === "ँ") {
      out += "n";
    } else if (ch === "ः") {
      out += "h";
    } else if (ch === "़" || ch === "्") {
      // Combining marks are consumed with their base character.
    } else {
      out += ch;
    }
  }
  return out;
}

function romanizeText(text) {
  if (!text || !/[가-힣ㄱ-ㅎ\u3040-\u30FF\u0400-\u04FF\u0900-\u097F]/u.test(text)) return "";
  const chars = [...text];
  if (/[\u0900-\u097F]/u.test(text)) return romanizeHindi(chars);
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const base = code - 0xac00;
      out += KO_I[(base / 588) | 0] + KO_M[((base % 588) / 28) | 0] + KO_F[base % 28];
    } else if (code >= 0x1100 && code <= 0x11ff) {
      out += KO_F[code - 0x1100];
    } else if (code >= 0x3131 && code <= 0x314e) {
      out += KO_I[code - 0x3131];
    } else if (code >= 0x314f && code <= 0x3163) {
      out += KO_M[code - 0x314f];
    } else if (ch === "っ" || ch === "ッ") {
      const next = romajiOf(chars[i + 1] || "") || chars[i + 1] || "";
      out += next[0] === "c" ? "t" : /^[kstpbjgdzchg]/.test(next[0] || "") ? next[0] : "";
    } else if (ch === "ー") {
      out += /[aeiou]/.test(out.slice(-1)) ? out.slice(-1) : "";
    } else if (code >= 0x3040 && code <= 0x30ff) {
      const base = romajiOf(ch), small = SMALL[chars[i + 1]];
      if (base && small) {
        out += base.slice(0, -1) + small;
        i++;
      } else out += base ?? ch;
    } else if (code >= 0x400 && code <= 0x4ff) {
      const upper = ch.toUpperCase(), r = CYR[upper] ?? "";
      out += ch === upper ? r : r.toLowerCase();
    } else out += ch;
  }
  return out;
}

// Translation requests are isolated from the overlay so batching, caching, and
// cancellation can be tested without a Spotify runtime.

function createTranslationService({
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

    for (let i = 0; i < todo.length;) {
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

      const parts = (await response.json())[0].map((part) => part[0]).join("").split("\n");
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

const defaultOptions = {
  size: 40,
  dim: 0.25,
  estimated: true,
  desktop: false,
  vinyl: false,
  syncOffset: 0,
  lyricMode: "word",
  scrollSmoothness: 65,
  translate: false,
  translateLang: "en",
  romanize: false,
};

function loadSettings(storage) {
  let options = { ...defaultOptions };
  let migratedDefaultDim = false;

  try {
    const target = storage ?? globalThis.localStorage;
    const savedOptions = JSON.parse(target.getItem("luma-settings") || "{}");
    options = { ...options, ...savedOptions };
    if (savedOptions.dim === 0.4) {
      options.dim = defaultOptions.dim;
      migratedDefaultDim = true;
    }
  } catch {}

  if ("sliderStyle" in options) {
    delete options.sliderStyle;
    try {
      (storage ?? globalThis.localStorage).setItem("luma-settings", JSON.stringify(options));
    } catch (error) {
      console.warn("[Luma Lyrics] Could not remove the retired slider preference.", error);
    }
  }

  return { options, migratedDefaultDim };
}

function saveSettings(options, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem("luma-settings", JSON.stringify(options));
  } catch {}
}

// Overlay and Spotify styles live here so visual changes stay separate from
// player state, lyric timing, and event handling.

function installStyles(document) {
  const style = document.createElement("style");
  style.textContent =
    "\n#luma-root{position:fixed;inset:0;z-index:999999;background:#151517;color:#fff;font-family:'Segoe UI',sans-serif;overflow:hidden;--lyric-size:36px;--dim:.25}\n#luma-root[hidden],#luma-root [hidden]{display:none!important}\n#luma-root *{box-sizing:border-box}\n#luma-root .backdrop{position:absolute;inset:-100px;background:center/cover;filter:blur(85px) saturate(1.5);opacity:.8;transform:scale(1.1);pointer-events:none}\n#luma-root .shade{position:absolute;inset:0;background:rgba(0,0,0,var(--dim));pointer-events:none}\n#luma-root .bar{position:absolute;inset:20px 25px auto;display:flex;align-items:center;gap:10px;z-index:3}\n#luma-root button{font:inherit;color:inherit;cursor:pointer}\n#luma-root .tool{border:1px solid #ffffff18;border-radius:50%;width:38px;height:38px;background:#ffffff0c;display:grid;place-items:center}\n#luma-root button:hover{background:#ffffff10}\n#luma-root svg{width:20px;height:20px;fill:currentColor}\n#luma-root .status{margin-left:auto;font-size:12px;color:#ffffffa0}\n#luma-root .layout{position:relative;height:100%;padding:85px 9vw 45px;display:grid;grid-template-columns:minmax(230px,360px) minmax(0,1fr);gap:8vw;align-items:center}\n#luma-root .cover{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:13px;background:#28282b;box-shadow:0 30px 80px #0007}\n#luma-root .title{font-size:23px;font-weight:700;margin:22px 0 4px;letter-spacing:-.6px}\n#luma-root .artist{font-size:16px;color:#ffffffaa;margin-bottom:20px}\n#luma-root input[type=range]{width:100%;height:5px;accent-color:white;cursor:pointer}\n#luma-root .times{display:flex;justify-content:space-between;color:#ffffff90;font-size:12px;margin-top:6px}\n#luma-root .controls{display:flex;justify-content:center;gap:24px;margin:15px 0}\n#luma-root .controls button{background:none;border:0;padding:8px;display:grid;place-items:center}\n#luma-root .controls svg{width:29px;height:29px}\n#luma-root .controls .play svg{width:38px;height:38px}\n#luma-root .volume{display:flex;align-items:center;gap:12px;margin-top:14px;color:#ffffffa0}\n#luma-root .lyrics{position:relative;height:100%;overflow:auto;scrollbar-width:none;padding:40vh 8px;mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}\n#luma-root .line{display:block;width:100%;text-align:left;border:0;background:transparent;padding:15px 0;font-size:var(--lyric-size);font-weight:750;letter-spacing:-1px;line-height:1.35;white-space:pre-wrap;opacity:.25;transform:scale(.96);transform-origin:left;transition:transform .5s,opacity .4s}\n#luma-root .line.active{opacity:1;transform:scale(1)}\n#luma-root .line.past{opacity:.35}\n#luma-root .word{display:inline-block;white-space:pre;color:transparent;background:linear-gradient(90deg,#fff var(--fill,0%),#ffffff55 var(--fill,0%));background-clip:text;-webkit-background-clip:text}\n#luma-root .line:not(.active) .word{background:none;color:inherit}\n#luma-root .message{font-size:22px;line-height:1.6;white-space:pre-wrap;color:#ffffffc0}\n#luma-root .settings{position:absolute;right:25px;top:68px;width:300px;max-height:75vh;overflow:auto;z-index:4;padding:20px;border-radius:16px;background:#232326f5;box-shadow:0 20px 60px #0007;border:1px solid #ffffff15}\n#luma-root .settings h2{margin:0 0 15px;font-size:18px}\n#luma-root .settings label{display:block;margin:16px 0;font-size:13px;line-height:1.5}\n#luma-root .settings small{display:block;color:#ffffff90;margin-top:6px;line-height:1.5}\n#luma-root .settings button{border:1px solid #ffffff20;background:#ffffff0c;border-radius:8px;padding:8px 12px;margin:3px}\n@media(max-width:760px){#luma-root .layout{padding:78px 25px 25px;gap:25px;grid-template-columns:minmax(170px,1fr) minmax(0,1.2fr)}#luma-root .line{font-size:26px}#luma-root .status{font-size:10px}}\n@media(prefers-reduced-motion:reduce){#luma-root .line{transition:none;transform:none}}\n";
  document.head.append(style);
  const desktop = document.createElement("style");
  desktop.textContent =
    ':root{--spice-main:var(--luma-surface,#141218);--spice-sidebar:var(--luma-surface-low,#1d1b20);--spice-player:var(--luma-surface-container,#211f26);--spice-card:var(--luma-surface-high,#2b2930);--spice-button:var(--luma-primary,#d0bcff);--spice-button-active:var(--luma-primary,#d0bcff)}.Root__main-view,.Root__nav-bar,.main-card-card{border-radius:12px!important}.main-nowPlayingBar-nowPlayingBar{background:var(--luma-surface-container,#211f26)!important}button[data-testid="play-button"]{background:var(--luma-primary,#d0bcff)!important;color:var(--luma-on-primary,#381e72)!important}';
  document.head.append(desktop);
  const polish = document.createElement("style");
  polish.textContent =
    '@property --luma-word-fill{syntax:"<percentage>";inherits:false;initial-value:0%}#luma-root .bar{top:56px;justify-content:flex-end}#luma-root .bar .status{order:0;margin-left:0}#luma-root .bar [data-action=settings]{order:1}#luma-root .bar [data-action=full]{order:2}#luma-root .bar [data-action=close]{order:3}#luma-root .settings{top:104px}#luma-root .lyrics{scroll-behavior:auto;overscroll-behavior:contain}#luma-root .line{transition:transform .65s cubic-bezier(.22,1,.36,1),opacity .65s ease,filter .65s ease;text-shadow:0 0 0 transparent}#luma-root .line:not(.active){filter:blur(.35px)}#luma-root .line.active{transform:translateX(5px) scale(1);text-shadow:0 8px 32px #ffffff20}#luma-root .word{--luma-word-fill:var(--fill,0%);background:linear-gradient(90deg,#fff var(--luma-word-fill),#ffffff55 var(--luma-word-fill));transition:--luma-word-fill 40ms linear}@media(max-width:500px){#luma-root .bar .status{display:none}}@media(prefers-reduced-motion:reduce){#luma-root .line,#luma-root .word{transition:none}#luma-root .line:not(.active){filter:none}#luma-root .line.active{text-shadow:none;transform:none}}';
  polish.textContent +=
    "#luma-root .lyrics .line .luma-lyric-token{display:inline-block;white-space:pre-wrap;background:transparent!important;background-image:none!important;background-clip:border-box!important;-webkit-background-clip:border-box!important;color:#ffffffa8!important;-webkit-text-fill-color:#ffffffa8!important;text-shadow:none;transform:scale(1);transform-origin:bottom center;transition:color .2s ease,opacity .12s linear,transform .2s ease,text-shadow .2s ease}#luma-root .lyrics .line .luma-lyric-token.active{color:var(--accent)!important;-webkit-text-fill-color:var(--accent)!important;font-weight:850;text-shadow:0 0 18px rgba(var(--accent-rgb),.48);transform:scale(1.08);opacity:1!important}#luma-root .lyrics .line .luma-lyric-token.upcoming{color:#ffffff78!important;-webkit-text-fill-color:#ffffff78!important;opacity:.72!important}@media(prefers-reduced-motion:reduce){#luma-root .lyrics .line .luma-lyric-token{transition:none}}";
  polish.textContent +=
    "#luma-root .lyrics{scroll-padding-block:38vh}#luma-root .line{padding:13px 0;letter-spacing:-.7px;transition:transform .7s cubic-bezier(.22,1,.36,1),opacity .7s ease,filter .7s ease}#luma-root .line:not(.active){filter:blur(.15px);opacity:.38}#luma-root .line.past{opacity:.48}#luma-root .line.active{transform:translateX(2px);text-shadow:0 4px 24px rgba(var(--accent-rgb),.12)}#luma-root .lyrics .line .luma-lyric-token{font-weight:inherit;transform:none;transition:color .24s ease,opacity .18s ease,text-shadow .24s ease}#luma-root .lyrics .line .luma-lyric-token.active{color:#fff!important;-webkit-text-fill-color:#fff!important;font-weight:780;text-shadow:0 0 12px rgba(var(--accent-rgb),.28);transform:none;opacity:inherit}#luma-root .lyrics .line .luma-lyric-token.upcoming{color:#ffffff88!important;-webkit-text-fill-color:#ffffff88!important;opacity:.78!important}";
  polish.textContent +=
    "#luma-root .lyrics .line .luma-lyric-token.active{color:var(--accent)!important;-webkit-text-fill-color:var(--accent)!important;font-weight:850;text-shadow:0 0 18px rgba(var(--accent-rgb),.48);transform:scale(1.08);opacity:1!important}";
  polish.textContent +=
    "#luma-root .line{white-space:normal}#luma-root .lyric-main{display:block;font-size:calc(var(--lyric-size) + 2px);line-height:1.28}#luma-root .lyric-secondary{display:block;margin-top:.12em;color:#ffffffa0;font-size:.68em;font-weight:500;letter-spacing:-.25px;line-height:1.25;opacity:.82}#luma-root .lyric-secondary .luma-lyric-token{font-size:inherit;font-weight:inherit}#luma-root .line.active .lyric-secondary{opacity:.9}#luma-root .line:not(.active) .lyric-secondary{opacity:.65}@media(max-width:760px){#luma-root .lyric-main{font-size:28px}}";
  document.head.append(polish);
  const appearance = document.createElement("style");
  appearance.textContent =
    '#luma-root .tool{width:42px;height:42px;border-color:#ffffff24;backdrop-filter:blur(16px);transition:background .2s,border-color .2s,transform .2s}#luma-root .tool:hover{background:#ffffff20;border-color:#ffffff50;transform:translateY(-1px)}#luma-root .artwork-stage{position:relative;width:100%;aspect-ratio:1;border-radius:13px}#luma-root .cover{height:100%}#luma-root.vinyl .artwork-stage{overflow:hidden;border-radius:50%;background:radial-gradient(circle,#242428 0 2%,#0d0d0f 2.3% 5%,#222226 5.3% 5.8%,#111113 6% 100%);box-shadow:0 28px 70px #0009}#luma-root.vinyl .artwork-stage:before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at center,transparent 0 3px,#ffffff12 3.5px,#0008 4px,#0000 4.5px 7px);pointer-events:none}#luma-root.vinyl .artwork-stage:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;border:2px solid #ffffffb0;border-radius:50%;background:#111;transform:translate(-50%,-50%);box-shadow:0 0 0 3px #0008;pointer-events:none}#luma-root.vinyl .cover{position:absolute;left:18%;top:18%;width:64%;height:64%;border:3px solid #111;border-radius:50%;box-shadow:0 2px 14px #0009}#luma-root input[type=range]{--range-color:#fff;appearance:none;-webkit-appearance:none;width:100%;height:20px;margin:0;background:transparent;cursor:pointer}#luma-root input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]::-moz-range-thumb{width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root input[type=range]:hover::-moz-range-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root[data-slider-style=glow] input[type=range]{--range-color:#b9a3ff}#luma-root[data-slider-style=glow] input[type=range]::-webkit-slider-runnable-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=glow] input[type=range]::-moz-range-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-runnable-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-5px;background:#fff;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-thumb{width:9px;height:9px;background:#fff;box-shadow:none}#luma-root .controls button{width:46px;height:46px;border-radius:50%;color:#ffffffc0;transition:background .2s,color .2s,transform .2s}#luma-root .controls button:hover{background:#ffffff16;color:#fff;transform:scale(1.06)}#luma-root .controls .play{width:58px;height:58px;background:#ffffffed;color:#171719;box-shadow:0 6px 24px #0004}#luma-root .controls .play:hover{background:#fff;transform:scale(1.07)}#luma-root .controls .play svg{width:30px;height:30px}#luma-root .settings select{display:block;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff0c;color:#fff;font:inherit}#luma-root .settings select option{background:#232326;color:#fff}#luma-root .settings input[type=checkbox]{accent-color:#b9a3ff}@media(prefers-reduced-motion:reduce){#luma-root.vinyl.playing .artwork-stage{animation:none}}';
  appearance.textContent +=
    "#luma-root input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,var(--range-color) var(--range-progress,0%),#ffffff3a var(--range-progress,0%))}#luma-root input[type=range]::-moz-range-track{background:linear-gradient(90deg,var(--range-color) var(--range-progress,0%),#ffffff3a var(--range-progress,0%))}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,#fff var(--range-progress,0%),#ffffff40 var(--range-progress,0%))}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-track{background:linear-gradient(90deg,#fff var(--range-progress,0%),#ffffff40 var(--range-progress,0%))}";
  appearance.textContent +=
    "#luma-root[data-slider-style=bar] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=bar] input[type=range]::-moz-range-track{height:8px;border-radius:99px}#luma-root[data-slider-style=bar] input[type=range]::-webkit-slider-thumb{width:16px;height:16px;margin-top:-4px}#luma-root[data-slider-style=bar] input[type=range]::-moz-range-thumb{width:12px;height:12px}#luma-root[data-slider-style=wavy] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=wavy] input[type=range]::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 10%,8% 0,12% 10%,16% 50%,20% 90%,24% 100%,28% 90%,32% 50%,36% 10%,40% 0,44% 10%,48% 50%,52% 90%,56% 100%,60% 90%,64% 50%,68% 10%,72% 0,76% 10%,80% 50%,84% 90%,88% 100%,92% 90%,96% 50%,100% 10%)}#luma-root[data-slider-style=wavy] input[type=range]::-webkit-slider-thumb{width:14px;height:14px;margin-top:-2px}#luma-root[data-slider-style=wavy] input[type=range]::-moz-range-thumb{width:10px;height:10px}#luma-root[data-slider-style=slim] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=slim] input[type=range]::-moz-range-track{height:2px;border-radius:99px}#luma-root[data-slider-style=slim] input[type=range]::-webkit-slider-thumb{width:12px;height:12px;margin-top:-5px}#luma-root[data-slider-style=slim] input[type=range]::-moz-range-thumb{width:8px;height:8px}#luma-root[data-slider-style=squiggly] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=squiggly] input[type=range]::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 0,8% 50%,12% 100%,16% 50%,20% 0,24% 50%,28% 100%,32% 50%,36% 0,40% 50%,44% 100%,48% 50%,52% 0,56% 50%,60% 100%,64% 50%,68% 0,72% 50%,76% 100%,80% 50%,84% 0,88% 50%,92% 100%,96% 50%,100% 0);mask-image:repeating-linear-gradient(90deg,#000 0 7px,transparent 7px 11px)}#luma-root[data-slider-style=squiggly] input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-2px}#luma-root[data-slider-style=squiggly] input[type=range]::-moz-range-thumb{width:9px;height:9px}";
  appearance.textContent += `
    #luma-root[data-slider-style=bar] .player .seek::-webkit-slider-runnable-track,
    #luma-root[data-slider-style=bar] .player .seek::-moz-range-track{height:8px;border-radius:99px}
    #luma-root[data-slider-style=wavy] .player .seek::-webkit-slider-runnable-track,
    #luma-root[data-slider-style=wavy] .player .seek::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 10%,8% 0,12% 10%,16% 50%,20% 90%,24% 100%,28% 90%,32% 50%,36% 10%,40% 0,44% 10%,48% 50%,52% 90%,56% 100%,60% 90%,64% 50%,68% 10%,72% 0,76% 10%,80% 50%,84% 90%,88% 100%,92% 90%,96% 50%,100% 10%)}
    #luma-root[data-slider-style=slim] .player .seek::-webkit-slider-runnable-track,
    #luma-root[data-slider-style=slim] .player .seek::-moz-range-track{height:2px;border-radius:99px}
    #luma-root[data-slider-style=squiggly] .player .seek::-webkit-slider-runnable-track,
    #luma-root[data-slider-style=squiggly] .player .seek::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 0,8% 50%,12% 100%,16% 50%,20% 0,24% 50%,28% 100%,32% 50%,36% 0,40% 50%,44% 100%,48% 50%,52% 0,56% 50%,60% 100%,64% 50%,68% 0,72% 50%,76% 100%,80% 50%,84% 0,88% 50%,92% 100%,96% 50%,100% 0)}
    #luma-root[data-slider-style=ring] .player .seek::-webkit-slider-runnable-track,
    #luma-root[data-slider-style=ring] .player .seek::-moz-range-track{height:4px;border-radius:99px}
    #luma-root[data-slider-style=ring] .player .seek::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;margin-top:-8px;border:4px solid #b9a3ff;border-radius:50%;background:#1b1b20;box-shadow:0 0 0 3px #b9a3ff30,0 0 15px #b9a3ff80}
    #luma-root[data-slider-style=ring] .player .seek::-moz-range-thumb{width:12px;height:12px;border:4px solid #b9a3ff;border-radius:50%;background:#1b1b20;box-shadow:0 0 0 3px #b9a3ff30,0 0 15px #b9a3ff80}
    #luma-root[data-slider-style=blocks] .player .seek::-webkit-slider-runnable-track{height:9px;border-radius:2px;-webkit-mask-image:repeating-linear-gradient(90deg,#000 0 8px,transparent 8px 12px);mask-image:repeating-linear-gradient(90deg,#000 0 8px,transparent 8px 12px)}
    #luma-root[data-slider-style=blocks] .player .seek::-moz-range-track{height:9px;border-radius:2px;mask-image:repeating-linear-gradient(90deg,#000 0 8px,transparent 8px 12px)}
    #luma-root[data-slider-style=blocks] .player .seek::-webkit-slider-thumb{width:13px;height:13px;margin-top:-2px}
    #luma-root[data-slider-style=blocks] .player .seek::-moz-range-thumb{width:9px;height:9px}
    #luma-root[data-slider-style=liquid] .player .seek::-webkit-slider-runnable-track{height:8px;border-radius:99px;box-shadow:0 0 10px #b9a3ff45}
    #luma-root[data-slider-style=liquid] .player .seek::-moz-range-track{height:8px;border-radius:99px;box-shadow:0 0 10px #b9a3ff45}
    #luma-root[data-slider-style=liquid] .player .seek::-webkit-slider-thumb{width:17px;height:17px;margin-top:-4px;border:2px solid #fff;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 5%,#d8caff 12%,#a78bfa 50%,#6d4aca 100%);box-shadow:0 0 0 4px #b9a3ff20,0 0 16px #b9a3ffb0}
    #luma-root[data-slider-style=liquid] .player .seek::-moz-range-thumb{width:13px;height:13px;border:2px solid #fff;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 5%,#d8caff 12%,#a78bfa 50%,#6d4aca 100%);box-shadow:0 0 0 4px #b9a3ff20,0 0 16px #b9a3ffb0}
    #luma-root .seek-control{position:relative;height:20px}
    #luma-root .seek-ring{display:none;width:48px;height:48px;overflow:visible;cursor:pointer;touch-action:none;pointer-events:all}
    #luma-root .seek-ring:focus-visible{outline:2px solid #b9a3ff;outline-offset:3px;border-radius:50%}
    #luma-root .seek-ring circle{fill:none;stroke-width:4}
    #luma-root .seek-ring .ring-track{stroke:#ffffff35}
    #luma-root .seek-ring .ring-progress{stroke:#b9a3ff;stroke-linecap:round;transform:rotate(-90deg);transform-origin:28px 28px;filter:drop-shadow(0 0 4px #b9a3ff90)}
    #luma-root[data-slider-style=ring] .seek-control{display:flex;height:52px;justify-content:center;align-items:center}
    #luma-root[data-slider-style=ring] .seek-control .seek{display:none}
    #luma-root[data-slider-style=ring] .seek-control .seek-ring{display:block}
    #luma-root .volume input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;clip-path:none;-webkit-mask-image:none;mask-image:none;box-shadow:inset 0 0 0 1px #ffffff12}
    #luma-root .volume input[type=range]::-moz-range-track{height:5px;border-radius:99px;clip-path:none;mask-image:none;box-shadow:inset 0 0 0 1px #ffffff12}
    #luma-root .volume input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5px;border:2px solid #fff;border-radius:50%;background:#fff;box-shadow:0 1px 8px #0008}
    #luma-root .volume input[type=range]::-moz-range-thumb{width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:#fff;box-shadow:0 1px 8px #0008}
    #luma-root .slider-options{grid-template-columns:repeat(4,minmax(0,1fr))}
    #luma-root .preview-ring:before,#luma-root .preview-ring i{left:12px;top:50%;width:13px;height:13px;border:2px solid #b9a3ff;border-radius:50%;background:transparent;transform:translateY(-50%)}
    #luma-root .preview-ring:before{display:none}
    #luma-root .preview-blocks:before,#luma-root .preview-blocks i{height:8px;border-radius:0;mask-image:repeating-linear-gradient(90deg,#000 0 5px,transparent 5px 8px)}
    #luma-root .preview-liquid i{width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#a78bfa 55%,#6d4aca)}
    @media(max-width:340px){#luma-root .slider-options{grid-template-columns:repeat(3,minmax(0,1fr))}}
  `;
  appearance.textContent +=
    "#luma-root[data-lyric-mode=block] .line.active{transform:none}#luma-root[data-lyric-mode=gentle] .line{transform:none;filter:none;opacity:.4;transition:opacity .8s ease}#luma-root[data-lyric-mode=gentle] .line.active{opacity:.9}#luma-root[data-lyric-mode=static] .line{transform:none;filter:none;transition:none;opacity:.55}#luma-root[data-lyric-mode=static] .line.active{opacity:1}#luma-root .placeholder{height:1.35em;margin:15px 0;border-radius:8px;background:linear-gradient(90deg,#ffffff0b 20%,#ffffff1b 45%,#ffffff0b 70%);background-size:220% 100%;animation:luma-placeholder 1.5s ease-in-out infinite}#luma-root .placeholder:nth-child(3n){width:76%}#luma-root .placeholder:nth-child(3n + 1){width:91%}#luma-root .placeholder:nth-child(3n + 2){width:62%}@keyframes luma-placeholder{to{background-position-x:-220%}}@media(prefers-reduced-motion:reduce){#luma-root .placeholder{animation:none}}";
  appearance.textContent += `
    #luma-root .settings{border-radius:18px;background:linear-gradient(145deg,rgba(var(--accent-rgb),.1),rgba(255,255,255,.035) 48%,rgba(var(--accent-rgb),.055)),rgba(20,21,24,.72);backdrop-filter:blur(30px) saturate(1.45);-webkit-backdrop-filter:blur(30px) saturate(1.45);box-shadow:0 22px 70px #0007,0 1px 0 #ffffff20 inset,0 0 34px rgba(var(--accent-rgb),.08)}
    #luma-root .settings-header{background:linear-gradient(110deg,rgba(var(--accent-rgb),.09),rgba(28,28,32,.74));backdrop-filter:blur(30px) saturate(1.45);-webkit-backdrop-filter:blur(30px) saturate(1.45);border-bottom-color:#ffffff15}
    #luma-root .settings-eyebrow{color:#ffffff8a;font-size:9px;letter-spacing:1.1px}
    #luma-root .settings-header h2{font-size:20px;font-weight:650;letter-spacing:-.3px}
    #luma-root .settings-section{padding-top:15px;padding-bottom:13px;border-bottom-color:#ffffff10}
    #luma-root .settings-section h3{color:#ffffffa0;font-size:10px;letter-spacing:.6px;text-transform:none}
    #luma-root .settings .setting-control{margin:14px 0;gap:8px}
    #luma-root .settings .mode-control{position:relative;z-index:2}
    #luma-root .mode-trigger{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:42px;padding:9px 12px;border:1px solid #ffffff22;border-radius:11px;background:rgba(255,255,255,.055);color:#fff;text-align:left;font:inherit;transition:border-color .18s,background .18s,box-shadow .18s}
    #luma-root .mode-trigger:hover,#luma-root .mode-trigger[aria-expanded=true]{border-color:rgba(var(--accent-rgb),.58);background:rgba(var(--accent-rgb),.08)}
    #luma-root .mode-trigger[aria-expanded=true]{box-shadow:0 0 0 3px rgba(var(--accent-rgb),.1)}
    #luma-root .mode-trigger svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .18s}
    #luma-root .mode-trigger[aria-expanded=true] svg{transform:rotate(180deg)}
    #luma-root .mode-options{position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:5;padding:5px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:linear-gradient(145deg,rgba(var(--accent-rgb),.09),rgba(255,255,255,.035)),rgba(24,25,29,.94);backdrop-filter:blur(30px) saturate(1.45);-webkit-backdrop-filter:blur(30px) saturate(1.45);box-shadow:0 16px 42px #0008,0 1px 0 #ffffff18 inset;transform-origin:top center;animation:luma-menu-in .16s ease-out}
    #luma-root .mode-options[hidden]{display:none}
    #luma-root .mode-options button{display:flex;align-items:center;width:100%;min-height:36px;margin:2px 0;padding:8px 10px;border:1px solid transparent;border-radius:8px;background:transparent;color:#ffffffc9;text-align:left;font:inherit;font-size:13px;transition:background .15s,color .15s,border-color .15s}
    #luma-root .mode-options button:hover,#luma-root .mode-options button:focus-visible{outline:none;border-color:rgba(var(--accent-rgb),.22);background:rgba(255,255,255,.075);color:#fff}
    #luma-root .mode-options button[aria-selected=true]{background:rgba(var(--accent-rgb),.15);color:#fff}
    @keyframes luma-menu-in{from{opacity:0;transform:translateY(-4px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
    #luma-root .settings .setting-toggle{margin:14px 0}
    #luma-root .setting-toggle small,#luma-root .settings-section>small{color:#ffffff78}
    #luma-root .settings select{background:rgba(255,255,255,.045);border-color:#ffffff1c}
    #luma-root .settings-footer{padding-top:10px}
    #luma-root .settings .settings-footer button{background:rgba(255,255,255,.045);border-color:#ffffff1c;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    #luma-root .settings .settings-footer button:hover{background:rgba(var(--accent-rgb),.12);border-color:rgba(var(--accent-rgb),.45)}
  `;
  appearance.textContent += `
    #luma-root[data-slider-style=bar] .layout input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:99px}
    #luma-root[data-slider-style=bar] .layout input[type=range]::-moz-range-track{height:8px;border-radius:99px}
    #luma-root[data-slider-style=bar] .layout input[type=range]::-webkit-slider-thumb{width:16px;height:16px;margin-top:-4px}
    #luma-root[data-slider-style=bar] .layout input[type=range]::-moz-range-thumb{width:12px;height:12px}
    #luma-root[data-slider-style=wavy] .layout input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:0;clip-path:polygon(0 50%,4% 10%,8% 0,12% 10%,16% 50%,20% 90%,24% 100%,28% 90%,32% 50%,36% 10%,40% 0,44% 10%,48% 50%,52% 90%,56% 100%,60% 90%,64% 50%,68% 10%,72% 0,76% 10%,80% 50%,84% 90%,88% 100%,92% 90%,96% 50%,100% 10%)}
    #luma-root[data-slider-style=wavy] .layout input[type=range]::-moz-range-track{height:12px;border-radius:0;clip-path:polygon(0 50%,4% 10%,8% 0,12% 10%,16% 50%,20% 90%,24% 100%,28% 90%,32% 50%,36% 10%,40% 0,44% 10%,48% 50%,52% 90%,56% 100%,60% 90%,64% 50%,68% 10%,72% 0,76% 10%,80% 50%,84% 90%,88% 100%,92% 90%,96% 50%,100% 10%)}
    #luma-root[data-slider-style=wavy] .layout input[type=range]::-webkit-slider-thumb{width:14px;height:14px;margin-top:-1px}
    #luma-root[data-slider-style=wavy] .layout input[type=range]::-moz-range-thumb{width:10px;height:10px}
    #luma-root[data-slider-style=slim] .layout input[type=range]::-webkit-slider-runnable-track{height:2px;border-radius:99px}
    #luma-root[data-slider-style=slim] .layout input[type=range]::-moz-range-track{height:2px;border-radius:99px}
    #luma-root[data-slider-style=slim] .layout input[type=range]::-webkit-slider-thumb{width:12px;height:12px;margin-top:-5px}
    #luma-root[data-slider-style=slim] .layout input[type=range]::-moz-range-thumb{width:8px;height:8px}
    #luma-root[data-slider-style=squiggly] .layout input[type=range]::-webkit-slider-runnable-track{height:12px;border-radius:0;clip-path:polygon(0 50%,4% 0,8% 50%,12% 100%,16% 50%,20% 0,24% 50%,28% 100%,32% 50%,36% 0,40% 50%,44% 100%,48% 50%,52% 0,56% 50%,60% 100%,64% 50%,68% 0,72% 50%,76% 100%,80% 50%,84% 0,88% 50%,92% 100%,96% 50%,100% 0)}
    #luma-root[data-slider-style=squiggly] .layout input[type=range]::-moz-range-track{height:12px;border-radius:0;clip-path:polygon(0 50%,4% 0,8% 50%,12% 100%,16% 50%,20% 0,24% 50%,28% 100%,32% 50%,36% 0,40% 50%,44% 100%,48% 50%,52% 0,56% 50%,60% 100%,64% 50%,68% 0,72% 50%,76% 100%,80% 50%,84% 0,88% 50%,92% 100%,96% 50%,100% 0)}
    #luma-root[data-slider-style=squiggly] .layout input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-1px}
    #luma-root[data-slider-style=squiggly] .layout input[type=range]::-moz-range-thumb{width:9px;height:9px}
    #luma-root .settings{top:104px;right:24px;width:min(390px,calc(100vw - 32px));max-height:calc(100vh - 128px);overflow:auto;padding:0;border:1px solid #ffffff1c;border-radius:20px;background:rgba(25,25,28,.96);backdrop-filter:blur(28px) saturate(1.3);box-shadow:0 24px 80px #0009}
    #luma-root .settings-header{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;background:rgba(25,25,28,.96);border-bottom:1px solid #ffffff12}
    #luma-root .settings-eyebrow{font-size:10px;font-weight:700;letter-spacing:1.5px;color:#b9a3ff}
    #luma-root .settings-header h2{margin:4px 0 0;font-size:22px;letter-spacing:-.5px}
    #luma-root .settings .settings-close{display:grid;place-items:center;width:36px;height:36px;padding:0;margin:0;border:1px solid #ffffff18;border-radius:50%;background:#ffffff0a;color:#ffffffc9}
    #luma-root .settings .settings-close:hover{background:#ffffff18;color:#fff}
    #luma-root .settings-close svg{width:18px;height:18px}
    #luma-root .settings-section{padding:16px 22px;border-bottom:1px solid #ffffff12}
    #luma-root .settings-section h3{margin:0 0 13px;color:#ffffff78;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase}
    #luma-root .settings .setting-control{display:grid;gap:9px;margin:16px 0;color:#ffffffeb;font-size:13px}
    #luma-root .setting-control>span{display:flex;align-items:center;justify-content:space-between;gap:12px}
    #luma-root .setting-control output{color:#ffffff95;font-variant-numeric:tabular-nums}
    #luma-root .settings select{width:100%;min-height:38px;margin:0;padding:8px 11px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff0b;color:#fff;font:inherit}
    #luma-root .settings select:focus-visible,#luma-root .settings button:focus-visible,#luma-root .settings input:focus-visible{outline:2px solid #b9a3ff;outline-offset:2px}
    #luma-root .settings select option{background:#202023;color:#fff}
    #luma-root .settings .setting-control input[type=range]{height:18px;padding:0;accent-color:#b9a3ff}
    #luma-root .settings input[type=range]::-webkit-slider-runnable-track{height:4px;border-radius:99px;background:linear-gradient(90deg,#b9a3ff var(--range-progress,50%),#ffffff24 var(--range-progress,50%));box-shadow:none}
    #luma-root .settings input[type=range]::-moz-range-track{height:4px;border-radius:99px;background:linear-gradient(90deg,#b9a3ff var(--range-progress,50%),#ffffff24 var(--range-progress,50%));box-shadow:none}
    #luma-root .settings input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-5px;border:2px solid #fff;background:#b9a3ff;box-shadow:0 0 0 3px #b9a3ff25}
    #luma-root .settings input[type=range]::-moz-range-thumb{width:9px;height:9px;border:2px solid #fff;background:#b9a3ff;box-shadow:0 0 0 3px #b9a3ff25}
    #luma-root .settings .setting-toggle{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:16px 0;color:#fff;font-size:13px}
    #luma-root .setting-toggle strong{display:block;font-weight:600}
    #luma-root .setting-toggle small,#luma-root .settings-section>small{display:block;margin-top:5px;color:#ffffff80;font-size:11px;line-height:1.5}
    #luma-root .settings .setting-toggle input[type=checkbox]{flex:none;width:36px;height:20px;margin:0;appearance:none;border:1px solid #ffffff25;border-radius:99px;background:#ffffff20;cursor:pointer;transition:background .18s,border-color .18s}
    #luma-root .settings .setting-toggle input[type=checkbox]:before{content:"";display:block;width:14px;height:14px;margin:2px;border-radius:50%;background:#ffffffc0;transition:transform .18s,background .18s}
    #luma-root .settings .setting-toggle input[type=checkbox]:checked{border-color:#b9a3ff;background:#9274eb}
    #luma-root .settings .setting-toggle input[type=checkbox]:checked:before{transform:translateX(16px);background:#fff}
    #luma-root .settings{border-color:rgba(255,255,255,.32);background:linear-gradient(145deg,rgba(var(--accent-rgb),.15),rgba(255,255,255,.07) 48%,rgba(var(--accent-rgb),.08)),rgba(19,20,24,.55);backdrop-filter:blur(38px) saturate(1.8);-webkit-backdrop-filter:blur(38px) saturate(1.8);box-shadow:0 28px 90px #0008,0 1px 0 #ffffff30 inset,0 0 42px rgba(var(--accent-rgb),.12)}
    #luma-root .settings-header{background:linear-gradient(110deg,rgba(var(--accent-rgb),.14),rgba(28,28,32,.62));backdrop-filter:blur(38px) saturate(1.8);-webkit-backdrop-filter:blur(38px) saturate(1.8);border-bottom-color:rgba(255,255,255,.2)}
    #luma-root .settings-eyebrow{color:var(--accent)}
    #luma-root .settings .setting-control input[type=range]{accent-color:var(--accent)}
    #luma-root .settings input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,var(--accent) var(--range-progress,50%),#ffffff35 var(--range-progress,50%))}
    #luma-root .settings input[type=range]::-moz-range-track{background:linear-gradient(90deg,var(--accent) var(--range-progress,50%),#ffffff35 var(--range-progress,50%))}
    #luma-root .settings input[type=range]::-webkit-slider-thumb{background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.25)}
    #luma-root .settings input[type=range]::-moz-range-thumb{background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.25)}
    #luma-root .settings .setting-toggle input[type=checkbox]:checked{border-color:var(--accent);background:var(--accent)}
    #luma-root .settings button:focus-visible,#luma-root .settings input:focus-visible,#luma-root .settings select:focus-visible{outline-color:var(--accent)}
    #luma-root .settings .settings-close{background:rgba(255,255,255,.11);border-color:rgba(255,255,255,.25);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    #luma-root .settings-footer{display:flex;justify-content:flex-end;padding:12px 22px 16px}
    #luma-root .settings .settings-footer button{display:inline-flex;align-items:center;gap:8px;margin:0;padding:9px 12px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(var(--accent-rgb),.08));color:#ffffffd9;font-size:12px;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:background .18s,border-color .18s,transform .18s}
    #luma-root .settings .settings-footer button:hover{transform:translateY(-1px);border-color:rgba(var(--accent-rgb),.6);background:rgba(var(--accent-rgb),.2)}
    #luma-root .settings-footer svg{width:16px;height:16px}
    #luma-root .player{padding:18px;border:1px solid rgba(255,255,255,.18);border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.09),rgba(var(--accent-rgb),.045)),rgba(18,19,23,.16);backdrop-filter:blur(24px) saturate(1.45);-webkit-backdrop-filter:blur(24px) saturate(1.45);box-shadow:0 18px 55px #0002,0 1px 0 #ffffff1c inset}
    #luma-root .player .seek{--range-color:var(--accent)}
    #luma-root .seek-ring .ring-progress{stroke:var(--accent);filter:drop-shadow(0 0 5px rgba(var(--accent-rgb),.65))}
    #luma-root .player .controls .play{background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(var(--accent-rgb),.4));box-shadow:0 6px 24px #0004,0 0 22px rgba(var(--accent-rgb),.23)}
    #luma-root .player .controls .play:hover{background:linear-gradient(145deg,#fff,rgba(var(--accent-rgb),.62))}
    @media(max-width:760px){#luma-root .player{padding:12px}}
    @media(max-width:600px){#luma-root .settings{top:100px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 112px)}#luma-root .settings-section{padding-right:18px;padding-left:18px}#luma-root .settings-header{padding-right:18px;padding-left:18px}}
  `;
  appearance.textContent += `
    #luma-root{--material-surface:rgba(28,29,34,.72);--material-surface-high:rgba(255,255,255,.085);--material-outline:rgba(255,255,255,.14);--material-on-surface:#f5f2f8}
    #luma-root .shade{background:linear-gradient(135deg,rgba(5,7,11,.48),rgba(8,9,13,.24) 55%,rgba(5,7,11,.48))}
    #luma-root .bar{inset:22px 28px auto}
    #luma-root .tool{width:44px;height:44px;border:1px solid var(--material-outline);background:rgba(28,29,34,.32);backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5);box-shadow:0 1px 0 #ffffff12 inset;transition:background .18s,border-color .18s,transform .18s}
    #luma-root .tool:hover{background:rgba(var(--accent-rgb),.14);border-color:rgba(var(--accent-rgb),.42);transform:translateY(-1px)}
    #luma-root .layout{grid-template-columns:minmax(250px,390px) minmax(0,1fr);gap:clamp(32px,6vw,96px);padding:96px clamp(32px,8vw,120px) 40px}
    #luma-root .player{padding:clamp(18px,2vw,28px);border:1px solid var(--material-outline);border-radius:28px;background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(var(--accent-rgb),.045) 62%,rgba(255,255,255,.025)),var(--material-surface);backdrop-filter:blur(32px) saturate(1.55);-webkit-backdrop-filter:blur(32px) saturate(1.55);box-shadow:0 24px 70px #0004,0 1px 0 #ffffff16 inset}
    #luma-root .artwork-stage{margin-bottom:24px;border-radius:20px}
    #luma-root .cover{border-radius:20px;box-shadow:0 18px 42px #0004}
    #luma-root.vinyl .artwork-stage{margin-bottom:24px}
    #luma-root .title{margin:0 0 5px;color:var(--material-on-surface);font-size:24px;font-weight:650;letter-spacing:-.45px;line-height:1.2}
    #luma-root .artist{margin:0 0 20px;color:#e2dfe8b8;font-size:14px}
    #luma-root .player .seek{--range-color:var(--accent);height:22px}
    #luma-root .player .seek::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(255,255,255,.2) var(--range-progress,0%));box-shadow:0 0 14px rgba(var(--accent-rgb),.12)}
    #luma-root .player .seek::-moz-range-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(255,255,255,.2) var(--range-progress,0%));box-shadow:0 0 14px rgba(var(--accent-rgb),.12)}
    #luma-root .player .seek::-webkit-slider-thumb{width:13px;height:13px;margin-top:-4px;border:0;background:var(--accent);box-shadow:0 0 0 4px rgba(var(--accent-rgb),.17),0 1px 5px #0005}
    #luma-root .player .seek::-moz-range-thumb{width:13px;height:13px;border:0;background:var(--accent);box-shadow:0 0 0 4px rgba(var(--accent-rgb),.17),0 1px 5px #0005}
    #luma-root .times{margin-top:1px;color:#e5e1e9a8;font-size:11px;font-variant-numeric:tabular-nums}
    #luma-root .controls{align-items:center;gap:24px;margin:12px 0}
    #luma-root .controls button{width:44px;height:44px;padding:8px;border:0;border-radius:50%;background:transparent;color:#e7e3ebd0;transition:color .18s,background .18s,transform .18s}
    #luma-root .controls button:not(.play):hover{background:rgba(var(--accent-rgb),.12);color:#fff;transform:scale(1.05)}
    #luma-root .controls button:not(.play) svg{width:24px;height:24px}
    #luma-root .controls .play{width:54px;height:54px;padding:8px;border:0;border-radius:50%;background:transparent!important;box-shadow:none!important;color:var(--accent);transform:none}
    #luma-root .controls .play:hover{background:transparent!important;color:#fff;box-shadow:none!important;transform:scale(1.08)}
    #luma-root .controls .play svg{width:36px;height:36px}
    #luma-root .volume{gap:12px;margin-top:11px;color:#e7e3ebac}
    #luma-root .volume>svg{width:18px;height:18px;flex:none}
    #luma-root .volume input[type=range]::-webkit-slider-runnable-track{height:4px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(255,255,255,.2) var(--range-progress,0%));box-shadow:none}
    #luma-root .volume input[type=range]::-moz-range-track{height:4px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(255,255,255,.2) var(--range-progress,0%));box-shadow:none}
    #luma-root .volume input[type=range]::-webkit-slider-thumb{width:11px;height:11px;margin-top:-3px;border:0;background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.15)}
    #luma-root .volume input[type=range]::-moz-range-thumb{width:11px;height:11px;border:0;background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.15)}
    #luma-root .settings{top:82px;right:24px;width:min(420px,calc(100vw - 36px));max-height:calc(100vh - 108px);padding:8px;border:1px solid rgba(255,255,255,.18);border-radius:28px;background:linear-gradient(150deg,rgba(var(--accent-rgb),.1),rgba(255,255,255,.035) 45%,rgba(var(--accent-rgb),.04)),rgba(25,26,31,.78);backdrop-filter:blur(38px) saturate(1.6);-webkit-backdrop-filter:blur(38px) saturate(1.6);box-shadow:0 24px 80px #0006,0 1px 0 #ffffff18 inset}
    #luma-root .settings-header{top:-8px;padding:22px 20px 15px;border:0;border-bottom:1px solid rgba(255,255,255,.1);border-radius:22px 22px 0 0;background:rgba(29,30,35,.66);backdrop-filter:blur(38px) saturate(1.6);-webkit-backdrop-filter:blur(38px) saturate(1.6)}
    #luma-root .settings-eyebrow{color:rgba(var(--accent-rgb),.95);font-size:10px;letter-spacing:1.25px}
    #luma-root .settings-header h2{font-size:22px;font-weight:650;letter-spacing:-.35px}
    #luma-root .settings-section{margin:10px 4px;padding:16px;border:1px solid rgba(255,255,255,.085);border-radius:20px;background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(var(--accent-rgb),.025)),rgba(255,255,255,.018)}
    #luma-root .settings-section h3{margin-bottom:14px;color:rgba(var(--accent-rgb),.9);font-size:11px;letter-spacing:.5px;text-transform:uppercase}
    #luma-root .settings .setting-control{margin:13px 0;color:var(--material-on-surface)}
    #luma-root .settings .setting-toggle{margin:13px 0;color:var(--material-on-surface)}
    #luma-root .settings select{background:rgba(255,255,255,.055);border-color:rgba(255,255,255,.16)}
    #luma-root .settings-footer{padding:10px 10px 12px}
    #luma-root .settings .settings-footer button{border-color:rgba(255,255,255,.16);background:rgba(255,255,255,.05)}
    @media(max-width:760px){#luma-root .layout{padding:82px 20px 22px;gap:20px;grid-template-columns:minmax(180px,.85fr) minmax(0,1.15fr)}#luma-root .player{padding:14px;border-radius:22px}#luma-root .artwork-stage,#luma-root.vinyl .artwork-stage{margin-bottom:18px}#luma-root .title{font-size:20px}#luma-root .controls{gap:12px}}
    @media(max-width:520px){#luma-root .layout{grid-template-columns:minmax(0,1fr);align-content:start;overflow:auto;padding:82px 18px 20px;gap:16px}#luma-root .player{display:grid;grid-template-columns:72px minmax(0,1fr);column-gap:14px;align-items:center;padding:13px 15px}#luma-root .artwork-stage,#luma-root.vinyl .artwork-stage{grid-row:1 / span 3;width:72px;height:72px;margin:0}#luma-root .player .title,#luma-root .player .artist{grid-column:2}#luma-root .player .title{align-self:end;font-size:17px}#luma-root .player .artist{align-self:start;margin:2px 0 0;font-size:12px}#luma-root .player .seek,#luma-root .times,#luma-root .controls,#luma-root .volume{grid-column:1 / -1}#luma-root .player .seek{margin-top:12px}#luma-root .controls{margin:5px 0}#luma-root .settings{top:76px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 92px)}#luma-root .lyrics{min-height:42vh;padding:20vh 8px}}
    @media(prefers-reduced-motion:reduce){#luma-root .controls button,#luma-root .tool{transition:none}}
  `;
  appearance.textContent += `
    #luma-root .bar{inset:76px 28px auto;justify-content:flex-end}
    #luma-root .settings{top:132px;max-height:calc(100vh - 156px)}
    #luma-root .shade{background:rgba(0,0,0,var(--dim));transition:background .2s ease}
    #luma-root .player{background:linear-gradient(145deg,rgba(255,255,255,.11),rgba(var(--accent-rgb),.07) 42%,rgba(255,255,255,.025)),rgba(20,21,26,.36);backdrop-filter:blur(30px) saturate(1.55);-webkit-backdrop-filter:blur(30px) saturate(1.55);box-shadow:0 20px 56px #0003,0 1px 0 #ffffff24 inset}
    #luma-root .settings{border-color:rgba(255,255,255,.28);background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(var(--accent-rgb),.075) 40%,rgba(255,255,255,.025)),rgba(19,20,25,.4);backdrop-filter:blur(44px) saturate(1.7);-webkit-backdrop-filter:blur(44px) saturate(1.7);box-shadow:0 28px 80px #0006,0 1px 0 #ffffff24 inset,0 0 38px rgba(var(--accent-rgb),.08)}
    #luma-root .settings-header{background:linear-gradient(110deg,rgba(255,255,255,.09),rgba(var(--accent-rgb),.065)),rgba(24,25,30,.38);backdrop-filter:blur(36px) saturate(1.6);-webkit-backdrop-filter:blur(36px) saturate(1.6);border-bottom-color:rgba(255,255,255,.16)}
    #luma-root .settings-section{margin:8px 10px;padding:16px;border:1px solid rgba(255,255,255,.11);border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,.065),rgba(var(--accent-rgb),.035)),rgba(255,255,255,.018)}
    #luma-root .controls .play{position:relative;isolation:isolate;background:transparent!important;color:#fff;box-shadow:none!important}
    #luma-root .controls .play:before{content:"";position:absolute;z-index:0;inset:5px;border-radius:50%;background:var(--accent);box-shadow:0 2px 12px rgba(var(--accent-rgb),.25);transition:inset .18s,filter .18s}
    #luma-root .controls .play svg{position:relative;z-index:1}
    #luma-root .controls .play:hover:before{inset:2px;filter:brightness(1.08)}
    #luma-root .controls button:not(.play):hover{background:rgba(255,255,255,.08)}
    @media(max-width:600px){#luma-root .bar{inset:72px 16px auto}#luma-root .settings{top:126px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 146px)}}
  `;
  document.head.append(appearance);
  const material = document.createElement("style");
  const track = (sel, decl) =>
    `${sel}::-webkit-slider-runnable-track{${decl}}${sel}::-moz-range-track{${decl}}`;
  const thumb = (sel, decl, webkitOnly = "") =>
    `${sel}::-webkit-slider-thumb{-webkit-appearance:none;${decl};${webkitOnly}}${sel}::-moz-range-thumb{${decl}}`;
  const fill = (alpha) =>
    `linear-gradient(90deg,var(--md-primary) var(--range-progress,0%),rgba(var(--md-on-surface-rgb),${alpha}) var(--range-progress,0%))`;
  const handle =
    "width:5px;border:0;border-radius:3px;background:var(--md-primary);box-shadow:0 1px 5px rgba(0,0,0,.4)";
  const playerRange = "#luma-root[data-slider-style] .layout input[type=range]";
  const panel = "#luma-root .settings input[type=range]";
  material.textContent = `
    #luma-root{background:var(--md-surface);color:var(--md-on-surface);accent-color:var(--md-primary)}
    #luma-root .shade{background:rgba(var(--md-surface-rgb),var(--dim))}
    #luma-root button:focus-visible,#luma-root input:focus-visible,#luma-root .lyrics:focus-visible{outline:2px solid var(--md-primary);outline-offset:2px}

    #luma-root .tool{border:0;background:rgba(var(--md-secondary-container-rgb),.55);color:var(--md-on-secondary-container);box-shadow:inset 0 1px 0 rgba(var(--md-on-surface-rgb),.14)}
    #luma-root .tool:hover{border:0;background:rgba(var(--md-secondary-container-rgb),.8);transform:translateY(-1px)}
    #luma-root .tool:active{transform:scale(.94)}
    #luma-root .status{color:var(--md-on-surface-variant)}

    #luma-root .player{border:1px solid rgba(var(--md-outline-variant-rgb),.55);border-radius:28px;background:linear-gradient(160deg,rgba(var(--md-primary-rgb),.1),transparent 55%),rgba(var(--md-surface-container-rgb),.58);backdrop-filter:blur(32px) saturate(1.6);-webkit-backdrop-filter:blur(32px) saturate(1.6);box-shadow:0 20px 56px rgba(0,0,0,.28),inset 0 1px 0 rgba(var(--md-on-surface-rgb),.16)}
    #luma-root .title{color:var(--md-on-surface)}
    #luma-root .artist,#luma-root .times,#luma-root .volume{color:var(--md-on-surface-variant)}

    ${track(playerRange, `height:6px;border-radius:99px;background:${fill(".16")};box-shadow:none;clip-path:none;-webkit-mask-image:none;mask-image:none`)}
    ${thumb(playerRange, `${handle};height:26px`, "margin-top:-10px")}
    #luma-root[data-slider-style] .layout input[type=range]{--range-color:var(--md-primary)}
    ${track("#luma-root[data-slider-style] .layout .volume input[type=range]", `height:4px;background:${fill(".16")}`)}
    ${thumb("#luma-root[data-slider-style] .layout .volume input[type=range]", `${handle};height:20px`, "margin-top:-8px")}
    #luma-root[data-slider-style] .layout input[type=range]:hover::-webkit-slider-thumb{transform:scaleY(1.12);box-shadow:0 0 0 5px rgba(var(--md-primary-rgb),.14)}

    #luma-root .controls{gap:12px}
    #luma-root .controls button:not(.play){width:58px;height:46px;border-radius:23px;background:rgba(var(--md-secondary-container-rgb),.7);color:var(--md-on-secondary-container)}
    #luma-root .controls button:not(.play):hover{background:rgba(var(--md-secondary-container-rgb),.95);color:var(--md-on-secondary-container);transform:none}
    #luma-root .controls button:not(.play):active{transform:scale(.94)}
    #luma-root .controls .play{width:64px;height:64px;padding:0;color:var(--md-on-primary)}
    #luma-root .controls .play:hover{color:var(--md-on-primary);transform:none}
    #luma-root .controls .play:before{inset:0;border-radius:50%;background:var(--md-primary);box-shadow:0 4px 18px rgba(var(--md-primary-rgb),.3);transition:border-radius .3s cubic-bezier(.2,0,0,1),filter .18s,transform .18s}
    #luma-root.playing .controls .play:before{border-radius:32%}
    #luma-root .controls .play:hover:before{inset:0;filter:brightness(1.07)}
    #luma-root .controls .play:active:before{transform:scale(.94)}
    #luma-root .controls .play svg{width:30px;height:30px}

    #luma-root .line{color:var(--md-on-surface)}
    #luma-root .lyrics .line .luma-lyric-token{color:rgba(var(--md-on-surface-rgb),.66)!important;-webkit-text-fill-color:rgba(var(--md-on-surface-rgb),.66)!important}
    #luma-root .lyrics .line .luma-lyric-token.upcoming{color:rgba(var(--md-on-surface-rgb),.5)!important;-webkit-text-fill-color:rgba(var(--md-on-surface-rgb),.5)!important}
    #luma-root .lyrics .line .luma-lyric-token.active{color:var(--md-primary)!important;-webkit-text-fill-color:var(--md-primary)!important;text-shadow:0 0 18px rgba(var(--md-primary-rgb),.4)}
    #luma-root .lyric-secondary{color:var(--md-on-surface-variant)}
    #luma-root .message{color:var(--md-on-surface-variant)}
    #luma-root .placeholder{background:linear-gradient(90deg,rgba(var(--md-on-surface-rgb),.05) 20%,rgba(var(--md-on-surface-rgb),.12) 45%,rgba(var(--md-on-surface-rgb),.05) 70%);background-size:220% 100%}

    #luma-root .settings{border:1px solid rgba(var(--md-outline-variant-rgb),.6);border-radius:28px;background:linear-gradient(155deg,rgba(var(--md-primary-rgb),.08),transparent 50%),rgba(var(--md-surface-container-rgb),.62);backdrop-filter:blur(40px) saturate(1.7);-webkit-backdrop-filter:blur(40px) saturate(1.7);box-shadow:0 28px 80px rgba(0,0,0,.4),inset 0 1px 0 rgba(var(--md-on-surface-rgb),.14)}
    #luma-root .settings-header{background:rgba(var(--md-surface-container-rgb),.5);border-bottom:1px solid rgba(var(--md-outline-variant-rgb),.5)}
    #luma-root .settings-header h2{color:var(--md-on-surface)}
    #luma-root .settings-eyebrow{color:var(--md-primary)}
    #luma-root .settings .settings-close{border:0;background:rgba(var(--md-secondary-container-rgb),.6);color:var(--md-on-secondary-container)}
    #luma-root .settings .settings-close:hover{background:rgba(var(--md-secondary-container-rgb),.9);color:var(--md-on-secondary-container)}
    #luma-root .settings-section{border:0;border-radius:24px;background:rgba(var(--md-surface-high-rgb),.5)}
    #luma-root .settings-section h3{color:var(--md-primary);text-transform:none;letter-spacing:.1px;font-size:12px}
    #luma-root .settings .setting-control,#luma-root .settings .setting-toggle{color:var(--md-on-surface)}
    #luma-root .setting-control output,#luma-root .settings small,#luma-root .setting-toggle small,#luma-root .settings-section>small{color:var(--md-on-surface-variant)}

    ${track(panel, `height:4px;border-radius:99px;background:${fill(".18")}`)}
    ${thumb(panel, `${handle};height:20px`, "margin-top:-8px")}
    #luma-root .settings .setting-control input[type=range]{accent-color:var(--md-primary)}

    #luma-root .settings .setting-toggle input[type=checkbox]{width:52px;height:32px;border:2px solid var(--md-outline);background:rgba(var(--md-surface-highest-rgb),.9)}
    #luma-root .settings .setting-toggle input[type=checkbox]:before{width:16px;height:16px;margin:6px;background:var(--md-outline);transition:width .18s,height .18s,margin .18s,transform .18s,background .18s}
    #luma-root .settings .setting-toggle input[type=checkbox]:checked{border-color:var(--md-primary);background:var(--md-primary)}
    #luma-root .settings .setting-toggle input[type=checkbox]:checked:before{width:24px;height:24px;margin:2px;transform:translateX(20px);background:var(--md-on-primary)}

    #luma-root .mode-trigger{border:1px solid rgba(var(--md-outline-rgb),.7);border-radius:16px;background:transparent;color:var(--md-on-surface)}
    #luma-root .mode-trigger:hover{border-color:var(--md-primary);background:rgba(var(--md-primary-rgb),.08);box-shadow:none}
    #luma-root .mode-trigger[aria-expanded=true]{border-color:var(--md-primary);background:rgba(var(--md-primary-rgb),.08);box-shadow:0 0 0 1px var(--md-primary)}
    #luma-root .mode-options{border:1px solid rgba(var(--md-outline-variant-rgb),.7);border-radius:16px;background:rgba(var(--md-surface-high-rgb),.92)}
    #luma-root .mode-options button{border-radius:12px;color:var(--md-on-surface)}
    #luma-root .mode-options button:hover,#luma-root .mode-options button:focus-visible{border-color:transparent;background:rgba(var(--md-on-surface-rgb),.08);color:var(--md-on-surface)}
    #luma-root .mode-options button[aria-selected=true]{background:var(--md-secondary-container);color:var(--md-on-secondary-container)}
    #luma-root .settings select{border-color:rgba(var(--md-outline-rgb),.7);background:transparent;color:var(--md-on-surface)}
    #luma-root .settings select option{background:var(--md-surface-high);color:var(--md-on-surface)}

    #luma-root .settings .settings-footer button{border:1px solid rgba(var(--md-outline-rgb),.7);border-radius:20px;background:transparent;color:var(--md-primary)}
    #luma-root .settings .settings-footer button:hover{border-color:rgba(var(--md-outline-rgb),.7);background:rgba(var(--md-primary-rgb),.1);transform:none}
    #luma-root .settings-footer{flex-wrap:wrap;gap:8px}
    @media(prefers-reduced-motion:reduce){#luma-root .controls .play:before,#luma-root .settings .setting-toggle input[type=checkbox]:before{transition:none}}
  `;
  document.head.append(material);
  // Final word-flow pass: opacity is driven per frame by tick(), so the
  // highlight can cross-fade into the next word instead of jumping. The active
  // word keeps the same font weight as its neighbours to avoid reflow, and the
  // old per-line blur is dropped so text stays crisp and cheap to composite.
  const flow = document.createElement("style");
  flow.textContent = `
    #luma-root .lyrics .line .luma-lyric-token,
    #luma-root .lyrics .line .luma-lyric-token.active,
    #luma-root .lyrics .line .luma-lyric-token.upcoming{opacity:var(--flow-opacity,.52)!important;font-weight:inherit!important;transition:color .3s cubic-bezier(.22,1,.36,1),text-shadow .3s ease,transform .3s cubic-bezier(.22,1,.36,1)!important}
    #luma-root .lyrics .line .luma-lyric-token.active{transform:translateY(-.02em) scale(1.045)!important;text-shadow:0 0 16px rgba(var(--accent-rgb),.38)!important}
    #luma-root .line:not(.active){filter:none!important}
    #luma-root .line{transition:transform .75s cubic-bezier(.22,1,.36,1),opacity .6s ease!important}
    @media(prefers-reduced-motion:reduce){
      #luma-root .lyrics .line .luma-lyric-token,#luma-root .lyrics .line .luma-lyric-token.active{transition:none!important;transform:none!important;text-shadow:none!important}
      #luma-root .line{transition:none!important}
    }
  `;
  document.head.append(flow);
  // Final layout pass: restore the player's progress metadata and volume
  // control, then apply one consistent spacing rhythm across the overlay.
  const ui = document.createElement("style");
  ui.textContent = `
    #luma-root .bar{top:22px;inset-inline:24px;z-index:6}
    #luma-root .status{padding:6px 10px;border-radius:999px;background:rgba(var(--md-surface-container-rgb,.2),.5);color:var(--md-on-surface-variant,#ffffffa8);font-size:11px;line-height:1;white-space:nowrap;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
    #luma-root .layout{grid-template-columns:minmax(280px,390px) minmax(0,1fr)!important;gap:clamp(32px,4.5vw,64px)!important;padding:82px clamp(28px,5vw,72px) 32px!important;align-items:center}
    #luma-root .player{display:flex!important;flex-direction:column;gap:12px;padding:22px!important;border:1px solid rgba(var(--md-outline-variant-rgb),.72);border-radius:24px;max-width:390px;background:var(--md-surface-container);backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 14px 36px rgba(0,0,0,.22);transition:background-color .24s ease,border-color .24s ease}
    #luma-root .player>.artwork-stage{width:100%;margin-bottom:4px}
    #luma-root .player .title{margin:0!important;font-size:25px;line-height:1.18;letter-spacing:-.55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #luma-root .player .artist{margin:3px 0 2px!important;font-size:15px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--md-on-surface-variant)}
    #luma-root .player .seek{margin:2px 0 0;height:20px}
    #luma-root .player .times{display:flex!important;justify-content:space-between;margin-top:-5px;color:var(--md-on-surface-variant);font-size:11px;font-variant-numeric:tabular-nums}
    #luma-root .player .controls{margin:3px 0 1px!important;gap:16px}
    #luma-root .player .controls button{width:46px;height:46px}
    #luma-root .player .controls .play{width:56px;height:56px}
    #luma-root .player .volume{display:flex!important;align-items:center;gap:10px;width:100%;margin:0;padding:2px 1px;color:var(--md-on-surface-variant)}
    #luma-root .player .volume-icon{display:grid;place-items:center;flex:none;width:20px;height:20px}
    #luma-root .player .volume-icon svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    #luma-root .player .volume input[type=range]{flex:1 1 auto;min-width:0;width:100%;height:20px}
    #luma-root .player .volume-value{flex:none;min-width:36px;text-align:right;color:var(--md-on-surface-variant);font-size:11px;font-variant-numeric:tabular-nums}
    #luma-root:fullscreen .layout{grid-template-columns:minmax(340px,460px) minmax(0,1fr)!important;gap:clamp(40px,6vw,76px)!important}
    #luma-root:fullscreen .player{max-width:460px;padding:24px!important}
    #luma-root:fullscreen .player .title{font-size:29px}
    #luma-root:fullscreen .player .artist{font-size:17px}
    #luma-root:fullscreen .player .controls{gap:20px}
    #luma-root:fullscreen .player .controls button{width:50px;height:50px}
    #luma-root:fullscreen .player .controls .play{width:62px;height:62px}
    #luma-root .lyrics{padding:36vh 10px 40vh;overscroll-behavior:contain}
    #luma-root .line{font-weight:780;letter-spacing:-.65px;padding:11px 0;transition:transform .65s cubic-bezier(.22,1,.36,1),opacity .65s ease}
    #luma-root[data-lyric-mode=word] .line:not(.active),#luma-root[data-lyric-mode=block] .line:not(.active){opacity:.36}
    #luma-root[data-lyric-mode=word] .line.past,#luma-root[data-lyric-mode=block] .line.past{opacity:.46}
    #luma-root[data-lyric-mode=word] .line.active,#luma-root[data-lyric-mode=block] .line.active{transform:translateX(3px)}
    #luma-root[data-lyric-mode=gentle] .line.active,#luma-root[data-lyric-mode=static] .line.active{transform:none}
    #luma-root .lyric-translation{display:block;margin-top:.18em;font-size:.6em;font-weight:600;letter-spacing:-.2px;line-height:1.3;color:var(--md-on-surface-variant);white-space:pre-wrap}
    #luma-root .line.active .lyric-translation{color:var(--md-on-surface)}
    #luma-root .message{max-width:34rem}
    #luma-root .message-actions{margin-top:14px}
    #luma-root .retry-lyrics,#luma-root .sync-adjust button{margin:0;border:1px solid rgba(var(--md-outline-rgb,255,255,255),.35);border-radius:999px;background:rgba(var(--md-secondary-container-rgb,80,80,90),.45);color:var(--md-on-secondary-container,#fff);padding:8px 12px;font-size:12px;line-height:1}
    #luma-root .retry-lyrics:hover,#luma-root .sync-adjust button:hover{background:rgba(var(--md-primary-rgb,180,160,255),.16);border-color:rgba(var(--md-primary-rgb,180,160,255),.55)}
    #luma-root .retry-lyrics:disabled{opacity:.65;cursor:default}
    #luma-root .sync-adjust{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    #luma-root .sync-adjust input[type=range]{flex:1 1 100%;min-width:0}
    #luma-root .settings .privacy-note{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(var(--md-surface-high-rgb,50,50,58),.45);color:var(--md-on-surface-variant,#ffffff9a)}
    #luma-root .player{
      background:
        radial-gradient(ellipse at 8% 0%,rgba(var(--accent-rgb),.18),transparent 58%),
        linear-gradient(145deg,rgba(255,255,255,.075),rgba(var(--accent-rgb),.055) 54%,rgba(255,255,255,.018)),
        rgba(18,19,24,.52)!important;
      border-color:rgba(var(--accent-rgb),.24)!important;
      backdrop-filter:blur(28px) saturate(1.55);
      -webkit-backdrop-filter:blur(28px) saturate(1.55);
      box-shadow:0 18px 48px rgba(0,0,0,.22),0 1px 0 rgba(255,255,255,.12) inset;
      transition:background 900ms ease,border-color 900ms ease,box-shadow 900ms ease;
    }
    #luma-root .player .cover{transition:filter 700ms ease}
    #luma-root .settings{top:74px;max-height:calc(100vh - 96px);z-index:7}
    #luma-root .settings-section{margin:8px 4px;padding:18px}
    #luma-root .settings .setting-control,#luma-root .settings .setting-toggle{margin:12px 0}
    #luma-root .settings select{margin-top:6px;width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(var(--md-outline-rgb),.7);background:transparent;color:inherit;font:inherit}
    @media(max-width:900px){#luma-root .layout{grid-template-columns:minmax(230px,.88fr) minmax(0,1.12fr)!important;gap:28px!important;padding:78px 28px 24px!important}#luma-root .player{padding:18px!important}}
    @media(max-width:760px){#luma-root .bar{top:16px;inset-inline:14px}#luma-root .status{font-size:10px;padding:5px 8px}#luma-root .layout{gap:22px!important;padding:76px 20px 22px!important}#luma-root .player .title{font-size:21px}#luma-root .player .controls{gap:12px}}
    @media(max-width:560px){#luma-root .status{max-width:46vw;overflow:hidden;text-overflow:ellipsis}#luma-root .layout{grid-template-columns:minmax(0,1fr)!important;align-content:start;overflow:auto;gap:14px!important;padding:76px 16px 20px!important}#luma-root .player{display:grid!important;grid-template-columns:72px minmax(0,1fr);column-gap:14px;row-gap:7px;max-width:none;padding:12px!important;border-radius:20px}#luma-root .player>.artwork-stage{grid-row:1/span 2;width:72px;height:72px;margin:0}#luma-root .player .title,#luma-root .player .artist{grid-column:2}#luma-root .player .title{align-self:end;font-size:18px}#luma-root .player .artist{align-self:start;margin:0!important;font-size:12px}#luma-root .player .seek,#luma-root .player .times,#luma-root .player .controls,#luma-root .player .volume{grid-column:1/-1}#luma-root .player .seek{margin-top:6px}#luma-root .player .times{margin-top:-7px}#luma-root .player .controls{margin:0!important}#luma-root .player .volume{margin-top:-2px}#luma-root .lyrics{min-height:38vh;padding:18vh 8px 22vh}}
    @media(max-height:700px) and (min-width:561px){#luma-root .layout{padding-top:68px!important;padding-bottom:20px!important}#luma-root .lyrics{padding-top:28vh;padding-bottom:32vh}#luma-root .player{gap:9px}}
    @media(prefers-reduced-motion:reduce){#luma-root .player{transition:none}#luma-root .line{transition:none!important;transform:none!important}}
  `;
  document.head.append(ui);

  // Preserve the existing vinyl artwork treatment independently of settings.
  const vinylRefinement = document.createElement("style");
  vinylRefinement.textContent = `
    #luma-root.vinyl .artwork-stage{isolation:isolate;overflow:hidden;border-radius:50%;background:radial-gradient(circle at 50% 50%,#303034 0 1.2%,#111113 1.5% 4.2%,#29292d 4.5% 5.1%,#101012 5.4% 100%);box-shadow:0 20px 44px rgba(0,0,0,.48),0 1px 0 rgba(255,255,255,.12) inset}
    #luma-root.vinyl .artwork-stage:before{z-index:1;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%,transparent 0 2.4px,rgba(255,255,255,.095) 2.7px,rgba(0,0,0,.62) 3.1px,transparent 3.5px 5.1px),conic-gradient(from 18deg,transparent 0deg,rgba(255,255,255,.16) 34deg,transparent 78deg 180deg,rgba(255,255,255,.07) 226deg,transparent 270deg 360deg),radial-gradient(circle,rgba(var(--accent-rgb),.13),transparent 57%);box-shadow:inset 0 0 12px rgba(0,0,0,.72),inset 0 0 2px rgba(255,255,255,.18);pointer-events:none}
    #luma-root.vinyl .cover{z-index:2;left:14%;top:14%;width:72%;height:72%;object-fit:cover;image-rendering:auto;border:2px solid rgba(8,8,10,.9);border-radius:50%;box-shadow:0 0 0 1px rgba(255,255,255,.16),0 3px 16px rgba(0,0,0,.68);backface-visibility:hidden}
    #luma-root.vinyl .artwork-stage:after{z-index:3;width:7px;height:7px;border:1px solid rgba(255,255,255,.65);background:#111;box-shadow:0 0 0 2px rgba(0,0,0,.75),0 0 0 3px rgba(255,255,255,.12);pointer-events:none}
    #luma-root.vinyl .artwork-stage{animation:luma-vinyl-rotation 7.2s linear infinite;animation-play-state:paused;will-change:transform}
    #luma-root.vinyl.playing .artwork-stage{animation-play-state:running}
    @keyframes luma-vinyl-rotation{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){#luma-root.vinyl .artwork-stage{animation:none!important}}
  `;
  document.head.append(vinylRefinement);

  const spotifyControls = document.createElement("style");
  spotifyControls.textContent = `
    button[data-testid="control-button-lyrics"],
    button[data-testid="lyrics-button"],
    button[aria-label="Lyrics"],
    button[aria-label="Show lyrics"]{display:none!important}
    button[aria-label="Luma Lyrics"]{
      box-sizing:border-box!important;display:inline-grid!important;place-items:center!important;
      flex:0 0 36px!important;width:36px!important;min-width:36px!important;max-width:36px!important;
      height:36px!important;min-height:36px!important;padding:0!important;margin:0 2px!important;
      overflow:visible!important;vertical-align:middle!important
    }
    button[aria-label="Luma Lyrics"] svg{display:block!important;width:18px!important;height:18px!important;
      min-width:18px!important;min-height:18px!important;max-width:18px!important;max-height:18px!important;
      overflow:visible!important;flex:none!important}
  `;
  document.head.append(spotifyControls);

  // One authoritative settings panel stylesheet. Keep this consolidated so
  // earlier experimental glass/glow treatments cannot compete in the cascade.
  const settingsStyles = document.createElement("style");
  settingsStyles.textContent = `
    #luma-root .settings{
      position:absolute;
      top:74px;
      right:24px;
      z-index:7;
      width:min(380px,calc(100vw - 32px));
      max-height:calc(100vh - 96px);
      overflow-x:hidden;
      overflow-y:auto;
      padding:0;
      border:1px solid rgba(var(--md-outline-variant-rgb),.72);
      border-radius:20px;
      background:var(--md-surface-container);
      box-shadow:0 8px 24px rgba(0,0,0,.24);
      backdrop-filter:none;
      -webkit-backdrop-filter:none;
      scrollbar-width:thin;
      scrollbar-color:rgba(var(--md-on-surface-rgb),.24) transparent;
      transform-origin:top right;
      animation:none;
    }
    #luma-root .settings-header{
      position:sticky;top:0;z-index:2;display:flex;align-items:center;
      justify-content:space-between;gap:16px;padding:18px 20px 15px;
      border:0;border-bottom:1px solid rgba(var(--md-outline-variant-rgb),.48);
      background:var(--md-surface-container);
    }
    #luma-root .settings-header h2{margin:0;font-size:20px;line-height:1.3;font-weight:650;letter-spacing:-.3px}
    #luma-root .settings-description{margin:4px 0 0;color:var(--md-on-surface-variant);font-size:12px;line-height:1.45}
    #luma-root .settings .settings-close{flex:none;display:grid;place-items:center;width:36px;height:36px;margin:0;padding:0;border:1px solid transparent;border-radius:50%;background:transparent;color:var(--md-on-surface-variant)}
    #luma-root .settings .settings-close:hover{background:var(--md-surface-container-high);color:var(--md-on-surface)}
    #luma-root .settings-section{margin:0!important;padding:16px 20px 14px!important;border:0!important;border-bottom:1px solid rgba(var(--md-outline-variant-rgb),.42)!important;border-radius:0!important;background:transparent!important}
    #luma-root .settings-section h3{margin:0 0 10px;color:var(--md-on-surface);font-size:13px;line-height:1.35;font-weight:650;letter-spacing:0;text-transform:none}
    #luma-root .settings .setting-control,#luma-root .settings .setting-toggle{margin:0;padding:10px 0;border-radius:0;background:transparent;font-size:12px;line-height:1.45}
    #luma-root .settings .setting-control+.setting-control,#luma-root .settings .setting-control+.setting-toggle,#luma-root .settings .setting-toggle+.setting-control,#luma-root .settings .setting-toggle+.setting-toggle{border-top:1px solid rgba(var(--md-outline-variant-rgb),.28)}
    #luma-root .settings .setting-control>span,#luma-root .settings .setting-toggle>span{display:block;min-width:0}
    #luma-root .settings .setting-toggle{display:flex;align-items:center;justify-content:space-between;gap:16px}
    #luma-root .settings .setting-toggle strong{display:block;color:var(--md-on-surface);font-size:12px;font-weight:600;line-height:1.4}
    #luma-root .settings .setting-toggle small,#luma-root .settings .setting-control small{max-width:29em;margin-top:4px;color:var(--md-on-surface-variant);font-size:11px;line-height:1.45}
    #luma-root .settings .setting-control output{float:right;color:var(--md-on-surface-variant);font-size:11px;font-variant-numeric:tabular-nums}
    #luma-root .settings input[type=range]{display:block;width:100%;margin:8px 0 0;accent-color:var(--md-primary);cursor:pointer}
    #luma-root .settings .mode-control{display:grid;grid-template-columns:minmax(0,1fr) minmax(128px,.9fr);align-items:center;gap:12px}
    #luma-root .settings .mode-trigger{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:40px;margin:0;padding:8px 11px;border:1px solid rgba(var(--md-outline-rgb),.6);border-radius:10px;background:var(--md-surface-container-high);font-size:12px;transition:background-color .12s ease,border-color .12s ease}
    #luma-root .settings .mode-trigger:hover{background:var(--md-surface-high);border-color:rgba(var(--md-outline-rgb),.9)}
    #luma-root .settings .mode-options{top:calc(100% + 6px);border:1px solid rgba(var(--md-outline-variant-rgb),.8);border-radius:12px;background:var(--md-surface-container-high);box-shadow:0 8px 20px rgba(0,0,0,.2)}
    #luma-root .settings .mode-options button{border-radius:8px;transition:background-color .12s ease,color .12s ease}
    #luma-root .settings .mode-options button:hover{background:rgba(var(--md-on-surface-rgb),.07)}
    #luma-root .settings .sync-adjust{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-top:8px}
    #luma-root .settings .sync-adjust button{min-height:31px;margin:0;padding:6px 9px;border:1px solid rgba(var(--md-outline-rgb),.55);border-radius:8px;background:var(--md-surface-container-high);color:var(--md-on-surface);font-size:11px}
    #luma-root .settings .sync-adjust button:hover{background:var(--md-surface-high);border-color:rgba(var(--md-outline-rgb),.9)}
    #luma-root .settings select{display:block;width:100%;min-height:40px;margin-top:8px;padding:9px 11px;border:1px solid rgba(var(--md-outline-rgb),.6);border-radius:10px;background:var(--md-surface-container-high);color:var(--md-on-surface);font:inherit;font-size:12px}
    #luma-root .settings select option{background:var(--md-surface-container);color:var(--md-on-surface)}
    #luma-root .settings .privacy-note{display:block;margin:11px 0 0;padding:9px 11px;border:1px solid rgba(var(--md-outline-variant-rgb),.36);border-radius:10px;background:var(--md-surface-container-high);color:var(--md-on-surface-variant);font-size:10px;line-height:1.5}
    #luma-root .settings-footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0;padding:12px 20px;border-top:1px solid rgba(var(--md-outline-variant-rgb),.48);background:var(--md-surface-container)}
    #luma-root .settings .settings-footer button{min-height:36px;margin:0;padding:7px 12px;border:1px solid rgba(var(--md-outline-rgb),.55);border-radius:10px;background:transparent;color:var(--md-on-surface);font-size:12px;transition:background-color .12s ease,border-color .12s ease}
    #luma-root .settings .settings-footer button:hover{background:var(--md-surface-container-high);border-color:rgba(var(--md-outline-rgb),.9)}
    #luma-root .settings .settings-footer button:last-child{border-color:var(--md-primary);background:var(--md-primary);color:var(--md-on-primary);font-weight:600}
    #luma-root .settings .settings-footer button:last-child:hover{background:var(--md-primary);filter:brightness(1.05)}
    #luma-root .settings button:focus-visible,#luma-root .settings select:focus-visible,#luma-root .settings input:focus-visible{outline:2px solid var(--md-primary);outline-offset:2px}
    #luma-root .settings *{animation:none!important}
    #luma-root .settings button,#luma-root .settings input,#luma-root .settings select{box-shadow:none;text-shadow:none}
    #luma-root .settings button:hover,#luma-root .settings input:hover,#luma-root .settings select:hover{filter:none}
    #luma-root .settings .setting-control:hover,#luma-root .settings .setting-toggle:hover{background:transparent}
    #luma-root .settings-header:before,#luma-root .settings-header h2:after,#luma-root .settings-section h3:before,#luma-root .settings-section h3:after{content:none!important;display:none!important}
    @media(max-width:560px){
      #luma-root .settings{top:68px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 84px);border-radius:18px}
      #luma-root .settings-header{padding:15px 16px 13px}
      #luma-root .settings-section{padding:13px 16px!important}
      #luma-root .settings-footer{padding:10px 16px}
    }
    @media(prefers-reduced-motion:reduce){#luma-root .settings *{animation:none!important;transition:none!important}}
  `;
  document.head.append(settingsStyles);


  // Consolidated player refinement: artwork-led Material surfaces, measured
  // translucency, consistent controls, and predictable responsive layouts.
  const refinement = document.createElement("style");
  refinement.textContent = `
    #luma-root .backdrop{
      filter:blur(78px) saturate(1.12);
      opacity:.42;
      transform:scale(1.06);
    }
    #luma-root .bar{gap:8px}
    #luma-root .bar .tool{
      width:40px;height:40px;
      border:1px solid rgba(var(--md-outline-variant-rgb),.42);
      background:rgba(var(--md-surface-container-rgb),.78);
      color:var(--md-on-surface);
      box-shadow:none;
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
      transition:background-color .16s ease,border-color .16s ease,transform .16s ease;
    }
    #luma-root .bar .tool:hover{
      background:var(--md-surface-high);
      border-color:rgba(var(--md-outline-rgb),.72);
      transform:translateY(-1px);
    }
    #luma-root .status{
      border:1px solid rgba(var(--md-outline-variant-rgb),.38);
      background:rgba(var(--md-surface-container-rgb),.72);
      backdrop-filter:blur(14px);
      -webkit-backdrop-filter:blur(14px);
    }
    #luma-root .player{
      background:rgba(var(--md-surface-container-rgb),.78);
      border-color:rgba(var(--md-outline-variant-rgb),.68);
      box-shadow:0 12px 34px rgba(0,0,0,.2),inset 0 1px 0 rgba(var(--md-on-surface-rgb),.09);
      backdrop-filter:blur(18px) saturate(1.18);
      -webkit-backdrop-filter:blur(18px) saturate(1.18);
    }
    #luma-root .player>.artwork-stage{margin-bottom:2px}
    #luma-root .player .cover{border-radius:16px;box-shadow:0 10px 28px rgba(0,0,0,.2)}
    #luma-root .player .title{font-size:clamp(20px,2vw,25px);letter-spacing:-.55px}
    #luma-root .player .artist{font-size:14px}
    #luma-root .player .controls{gap:14px;margin:2px 0}
    #luma-root .player .controls button:not(.play){
      width:48px;height:46px;border-radius:15px;
      background:rgba(var(--md-secondary-container-rgb),.58);
      color:var(--md-on-secondary-container);
      transition:background-color .16s ease,transform .16s ease;
    }
    #luma-root .player .controls button:not(.play):hover{
      background:rgba(var(--md-secondary-container-rgb),.88);
      transform:translateY(-1px);
    }
    #luma-root .player .controls .play{
      width:58px;height:58px;
    }
    #luma-root .player .controls .play:before{
      box-shadow:0 2px 10px rgba(var(--md-primary-rgb),.2);
    }
    #luma-root .player .volume{gap:11px;margin-top:2px}
    #luma-root .player .volume input[type=range]{
      min-width:64px;height:24px;touch-action:pan-y;
    }
    #luma-root .player .volume input[type=range]::-webkit-slider-runnable-track{
      height:4px;border-radius:99px;
      background:linear-gradient(90deg,var(--md-primary) var(--range-progress,0%),rgba(var(--md-on-surface-rgb),.18) var(--range-progress,0%));
    }
    #luma-root .player .volume input[type=range]::-moz-range-track{
      height:4px;border-radius:99px;
      background:linear-gradient(90deg,var(--md-primary) var(--range-progress,0%),rgba(var(--md-on-surface-rgb),.18) var(--range-progress,0%));
    }
    #luma-root .player .volume input[type=range]::-webkit-slider-thumb{
      width:12px;height:12px;margin-top:-4px;border:0;background:var(--md-primary);box-shadow:0 0 0 3px rgba(var(--md-primary-rgb),.14);
    }
    #luma-root .player .volume input[type=range]::-moz-range-thumb{
      width:12px;height:12px;border:0;background:var(--md-primary);box-shadow:0 0 0 3px rgba(var(--md-primary-rgb),.14);
    }
    #luma-root .lyrics{scrollbar-width:none}
    #luma-root .line{
      letter-spacing:-.55px;
      text-shadow:none!important;
      filter:none!important;
    }
    #luma-root .line.active{transform:translateX(2px)!important}
    #luma-root .lyrics .line .luma-lyric-token.active{
      text-shadow:0 0 9px rgba(var(--md-primary-rgb),.2)!important;
      transform:none!important;
    }
    #luma-root .settings{
      background:rgba(var(--md-surface-container-rgb),.94);
      border-color:rgba(var(--md-outline-variant-rgb),.72);
      box-shadow:0 14px 38px rgba(0,0,0,.3);
      backdrop-filter:blur(18px) saturate(1.12);
      -webkit-backdrop-filter:blur(18px) saturate(1.12);
    }
    #luma-root .settings-header{background:rgba(var(--md-surface-container-rgb),.96)}
    #luma-root .settings-eyebrow{display:none!important}
    #luma-root .settings button,#luma-root .settings select{
      transition:background-color .14s ease,border-color .14s ease,color .14s ease;
    }
    #luma-root .settings .setting-control input[type=range]{height:24px}
    #luma-root .settings .setting-toggle input[type=checkbox]{flex:none}
    #luma-root button:focus-visible,#luma-root input:focus-visible,
    #luma-root select:focus-visible,#luma-root .lyrics:focus-visible{
      outline:2px solid var(--md-primary);
      outline-offset:3px;
    }
    @media(max-width:1100px) and (min-width:561px){
      #luma-root .layout{
        grid-template-columns:minmax(230px,34vw) minmax(0,1fr)!important;
        gap:clamp(22px,3.2vw,38px)!important;
        padding-inline:clamp(22px,4vw,44px)!important;
      }
      #luma-root .player{padding:17px!important}
      #luma-root .player .title{font-size:21px}
      #luma-root .lyrics{padding-inline:4px}
    }
    @media(max-width:760px) and (min-width:561px){
      #luma-root .layout{grid-template-columns:minmax(190px,.82fr) minmax(0,1.18fr)!important;gap:20px!important;padding-inline:18px!important}
      #luma-root .player .controls{gap:8px}
      #luma-root .player .controls button:not(.play){width:42px;height:42px}
      #luma-root .player .controls .play{width:52px;height:52px}
      #luma-root .player .volume{gap:7px}
      #luma-root .player .volume-value{min-width:30px}
      #luma-root .line{font-size:clamp(23px,3.4vw,29px)}
    }
    @media(max-width:560px){
      #luma-root .bar{top:12px;inset-inline:12px}
      #luma-root .bar .tool{width:36px;height:36px}
      #luma-root .layout{padding:64px 14px 18px!important;gap:13px!important}
      #luma-root .player{padding:12px!important;border-radius:18px}
      #luma-root .player>.artwork-stage{width:68px;height:68px}
      #luma-root .player .title{font-size:17px;line-height:1.2}
      #luma-root .player .artist{font-size:12px}
      #luma-root .player .controls{gap:10px}
      #luma-root .player .controls button:not(.play){width:42px;height:40px}
      #luma-root .player .controls .play{width:48px;height:48px}
      #luma-root .player .volume{gap:9px}
      #luma-root .player .volume-value{min-width:32px}
      #luma-root .lyrics{min-height:38vh;padding:16vh 7px 20vh}
      #luma-root .line{padding:9px 0;font-size:clamp(24px,7vw,var(--lyric-size))}
      #luma-root .lyric-main{font-size:clamp(24px,7vw,32px)}
      #luma-root .settings{top:58px;right:10px;width:calc(100vw - 20px);max-height:calc(100dvh - 70px)}
    }
    @media(max-height:540px) and (min-width:561px){
      #luma-root .layout{
        grid-template-columns:minmax(170px,24vw) minmax(0,1fr)!important;
        gap:24px!important;padding:62px 28px 14px!important;
      }
      #luma-root .player{gap:7px;padding:12px!important}
      #luma-root .player>.artwork-stage{width:min(30vh,170px);margin-inline:auto}
      #luma-root .player .title{font-size:18px}
      #luma-root .player .artist{font-size:12px;margin:0!important}
      #luma-root .player .controls{margin:0!important}
      #luma-root .player .controls button:not(.play){width:38px;height:38px}
      #luma-root .player .controls .play{width:44px;height:44px}
      #luma-root .player .volume{margin:0}
      #luma-root .lyrics{padding:18vh 6px 20vh}
      #luma-root .line{padding:7px 0;font-size:clamp(20px,3.4vh,27px)}
    }
    @media(prefers-reduced-motion:reduce){
      #luma-root .bar .tool,#luma-root .controls button,
      #luma-root .settings button,#luma-root .settings select{transition:none!important}
      #luma-root .line,#luma-root .lyrics .line .luma-lyric-token{transition:none!important;transform:none!important}
    }
  `;
  document.head.append(refinement);

  return desktop;
}

// Artwork sampling and Material 3 tonal palette generation.
function createArtworkPalette(root, document) {
const toneToL = (t) =>
  Math.cbrt(t > 8 ? Math.pow((t + 16) / 116, 3) : t / 903.3);
const oklchToRgb = (L, C, hue) => {
  const rad = (hue * Math.PI) / 180;
  for (let i = 0; i < 80; i++) {
    const a = C * Math.cos(rad),
      b = C * Math.sin(rad),
      l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3,
      m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3,
      s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3,
      lin = [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
      ];
    if (C <= 0.0005 || lin.every((v) => v >= -0.0005 && v <= 1.0005))
      return lin.map((v) => {
        v = Math.max(0, Math.min(1, v));
        v = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return Math.round(v * 255);
      });
    C = i > 70 ? 0 : C * 0.94;
  }
  return [128, 128, 128];
};
const srgbToOklab = (r, g, b) => {
  const lin = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  const l = Math.cbrt(
      0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2],
    ),
    m = Math.cbrt(
      0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2],
    ),
    s = Math.cbrt(
      0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2],
    );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};
const hex = (rgb) =>
  "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const applyPalette = (hue, chroma) => {
  const primaryC =
      chroma < 0.05 ? chroma : Math.max(0.08, Math.min(0.13, chroma * 0.9)),
    secondaryC = primaryC * 0.42,
    tertiaryC = primaryC * 0.66,
    neutralC = Math.min(0.014, primaryC * 0.2),
    variantC = Math.min(0.022, primaryC * 0.3),
    P = (t) => oklchToRgb(toneToL(t), primaryC, hue),
    S = (t) => oklchToRgb(toneToL(t), secondaryC, hue),
    T = (t) => oklchToRgb(toneToL(t), tertiaryC, hue + 60),
    N = (t) => oklchToRgb(toneToL(t), neutralC, hue),
    V = (t) => oklchToRgb(toneToL(t), variantC, hue);
  const roles = {
    primary: P(80),
    "on-primary": P(20),
    "primary-container": P(30),
    "on-primary-container": P(90),
    secondary: S(80),
    "on-secondary": S(20),
    "secondary-container": S(30),
    "on-secondary-container": S(90),
    tertiary: T(80),
    "on-tertiary": T(20),
    "tertiary-container": T(30),
    "on-tertiary-container": T(90),
    surface: N(6),
    "surface-low": N(10),
    "surface-container": N(12),
    "surface-high": N(17),
    "surface-highest": N(22),
    "on-surface": N(90),
    "on-surface-variant": V(80),
    outline: V(60),
    "outline-variant": V(30),
  };
  for (const [name, rgb] of Object.entries(roles)) {
    root.style.setProperty("--md-" + name, "rgb(" + rgb.join(",") + ")");
    root.style.setProperty("--md-" + name + "-rgb", rgb.join(","));
  }
  root.style.setProperty("--accent-rgb", roles.primary.join(","));
  root.style.setProperty("--accent", "rgb(" + roles.primary.join(",") + ")");
  const page = document.documentElement.style;
  page.setProperty("--luma-primary", hex(roles.primary));
  page.setProperty("--luma-on-primary", hex(roles["on-primary"]));
  page.setProperty("--luma-surface", hex(roles.surface));
  page.setProperty("--luma-surface-low", hex(roles["surface-low"]));
  page.setProperty(
    "--luma-surface-container",
    hex(roles["surface-container"]),
  );
  page.setProperty("--luma-surface-high", hex(roles["surface-high"]));
};
const setDefaultAccent = () => applyPalette(295, 0.13);
function setArtworkAccent(image) {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    console.warn(
      "[Luma Lyrics] Could not sample album artwork for its accent color.",
    );
    return;
  }
  try {
    context.drawImage(image, 0, 0, 32, 32);
    const pixels = context.getImageData(0, 0, 32, 32).data;
    let sumA = 0,
      sumB = 0,
      sumC = 0,
      sumW = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 128) continue;
      const [L, a, b] = srgbToOklab(pixels[i], pixels[i + 1], pixels[i + 2]),
        c = Math.hypot(a, b);
      if (c < 0.04 || L < 0.2 || L > 0.96) continue;
      const w = c * c;
      sumA += a * w;
      sumB += b * w;
      sumC += c * w;
      sumW += w;
    }
    if (!sumW) {
      // Near-monochrome artwork: keep the palette close to neutral.
      applyPalette(295, 0.02);
      return;
    }
    const hue = ((Math.atan2(sumB, sumA) * 180) / Math.PI + 360) % 360,
      // Keep highlights readable on the dark overlay: avoid very low-chroma
      // artwork accents that blend into the text, and avoid oversaturated ones.
      chroma = Math.max(0.055, Math.min(0.15, sumC / sumW));
    applyPalette(hue, chroma);
  } catch (error) {
    setDefaultAccent();
    console.warn(
      "[Luma Lyrics] Could not sample album artwork for its accent color.",
      error,
    );
  }
}
  return { applyPalette, setDefaultAccent, setArtworkAccent };
}

  while (
    !globalThis.Spicetify?.Player ||
    !globalThis.Spicetify?.Playbar?.Button ||
    !document.body
  )
    await new Promise((r) => setTimeout(r, 300));
  if (document.getElementById("luma-root")) return;
  const player = () => globalThis.Spicetify.Player;
  let { options, migratedDefaultDim } = loadSettings();
  const save = () => saveSettings(options);
  const desktop = installStyles(document);
  const paths = {
    close: "M6 6l12 12M18 6 6 18",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    settings: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
    down: "m6 9 6 6 6-6",
  };
  const stroke = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${paths[name]}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const svg = (d) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const icons = {
    play: svg("M7 4v16l14-8z"),
    pause: svg("M6 4h4v16H6zm8 0h4v16h-4z"),
    previous: svg("M4 5h3v14H4zm4 7 12-8v16z"),
    next: svg("M17 5h3v14h-3zM4 4l12 8-12 8z"),
  };
  const root = document.createElement("section");
  root.id = "luma-root";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Luma Lyrics");
  root.innerHTML = `<div class="backdrop"></div><div class="shade"></div><div class="bar"><button class="tool" data-action="close" aria-label="Close" title="Close">${stroke("close")}</button><button class="tool" data-action="full" aria-label="Toggle fullscreen" title="Fullscreen">${stroke("full")}</button><span class="status">LRCLIB · line sync</span><button class="tool" data-action="settings" aria-label="Settings" aria-expanded="false" title="Settings">${stroke("settings")}</button></div>
 <div class="layout"><div class="player"><img class="cover" alt="Album artwork"><div class="title">Nothing playing</div><div class="artist"></div><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Playback position"><div class="times"><span class="elapsed">0:00</span><span class="duration">0:00</span></div><div class="controls"><button data-action="previous" aria-label="Previous">${icons.previous}</button><button class="play" data-action="play" aria-label="Play or pause">${icons.play}</button><button data-action="next" aria-label="Next">${icons.next}</button></div><label class="volume"><span class="volume-icon" aria-hidden="true">${svg("M3 9h4l5-4v14l-5-4H3z")}</span><input id="luma-volume" type="range" class="vol" min="0" max="1" step=".01" aria-label="Volume" aria-valuetext="100%"><output class="volume-value" for="luma-volume">100%</output></label></div><div class="lyrics" tabindex="0" aria-label="Lyrics"></div></div>
 <div class="settings" role="region" aria-label="Lyrics settings" hidden></div>`;
  document.body.append(root);
  const q = (s) => root.querySelector(s),
    pane = q(".lyrics"),
    seek = q(".seek");
  function updateRangeVisual(input) {
    const min = Number(input.min) || 0;
    const max = Number(input.max);
    const value = Number(input.value);
    const progress =
      max > min
        ? Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
        : 0;
    input.style.setProperty("--range-progress", progress.toFixed(1) + "%");
  }
  const updateSeekVisual = () => updateRangeVisual(seek);
  function updateVolumeVisual(value) {
    const input = q(".vol");
    const volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (document.activeElement !== input) input.value = String(volume);
    updateRangeVisual(input);
    const percent = Math.round(volume * 100);
    const output = q(".volume-value");
    if (output.textContent !== percent + "%") output.textContent = percent + "%";
    input.setAttribute("aria-valuetext", percent + "%");
    const level = volume === 0 ? "muted" : volume < 0.5 ? "low" : "high";
    const paths = {
      muted: "M3 9h4l5-4v14l-5-4H3zM16 9l5 6m0-6-5 6",
      low: "M3 9h4l5-4v14l-5-4H3zM16 9a5 5 0 0 1 0 6",
      high: "M3 9h4l5-4v14l-5-4H3zM16 9a5 5 0 0 1 0 6M19 5a10 10 0 0 1 0 14",
    };
    const icon = q(".volume-icon");
    if (icon.dataset.level !== level) {
      icon.innerHTML = svg(paths[level]);
      icon.dataset.level = level;
    }
  }
  const cover = q(".cover"),
    artworkStage = document.createElement("div");
  // Material You style dynamic color: one hue from the artwork -> tonal palette.
  // Tones follow Material 3 dark-scheme roles; tone is approximated in OKLCH.
  const { setDefaultAccent, setArtworkAccent } = createArtworkPalette(root, document);
  artworkStage.className = "artwork-stage";
  cover.before(artworkStage);
  artworkStage.append(cover);
  q(".settings").innerHTML =
    `<header class="settings-header"><div><h2>Settings</h2></div><button class="settings-close" data-action="settings-close" aria-label="Close settings and return to lyrics" title="Close settings (Esc)">${stroke("close")}</button></header>
    <section class="settings-section"><h3>Lyrics</h3>
      <div class="setting-control mode-control"><span>Display style</span><button class="mode-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="lyric-mode-options"><span class="mode-label">Word by word</span>${stroke("down")}</button><div class="mode-options" id="lyric-mode-options" role="listbox" aria-label="Lyrics display style" hidden><button type="button" role="option" data-mode-value="word">Word by word</button><button type="button" role="option" data-mode-value="block">Line by line</button><button type="button" role="option" data-mode-value="gentle">Gentle</button><button type="button" role="option" data-mode-value="static">Static</button></div></div>
      <label class="setting-toggle"><span><strong>Estimated word animation</strong></span><input type="checkbox" class="estimated"></label>
      <div class="setting-control"><span>Lyrics sync <output class="sync-offset-value">0.00 s</output></span><div class="sync-adjust"><button type="button" data-sync-adjust="-50" aria-label="Move lyrics 0.05 seconds earlier">−0.05s</button><input class="sync-offset" type="range" min="-5000" max="5000" step="50" aria-label="Lyrics sync offset"><button type="button" data-sync-adjust="50" aria-label="Move lyrics 0.05 seconds later">+0.05s</button><button type="button" data-sync-adjust="0" aria-label="Reset lyrics sync">Reset</button></div></div>
      <label class="setting-control"><span>Scroll smoothness <output class="scroll-smoothness-value">65%</output></span><input class="scroll-smoothness" type="range" min="0" max="100" step="5"></label>
      
    </section>
    <section class="settings-section"><h3>Appearance</h3>
      <label class="setting-control"><span>Text size <output class="size-value"></output></span><input class="size" type="range" min="24" max="72" step="1"></label>
      <label class="setting-control"><span>Background darkness <output class="darkness-value"></output></span><input class="darkness" type="range" min=".15" max=".8" step=".05"></label>
      <label class="setting-toggle"><span><strong>Spinning vinyl artwork</strong></span><input type="checkbox" class="vinyl"></label>
      <label class="setting-toggle"><span><strong>Desktop colors</strong></span><input type="checkbox" class="desktop"></label>
    </section>
    <section class="settings-section"><h3>Translation</h3>
      <label class="setting-toggle"><span><strong>Translate lyrics</strong></span><input type="checkbox" class="translate"></label>
      <label class="setting-control"><span>Translate into</span><select class="translate-lang" aria-label="Translation language"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="pt">Portuguese</option><option value="it">Italian</option><option value="ru">Russian</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="zh-CN">Chinese</option><option value="hi">Hindi</option><option value="ar">Arabic</option></select></label>
      <label class="setting-toggle"><span><strong>Romanize lyrics</strong><small>Romanizes Korean, Japanese, Cyrillic, and Hindi lyrics offline.</small></span><input type="checkbox" class="romanize"></label>
      
    </section>
    <footer class="settings-footer"><button data-action="reset-settings">${svg("M3 12a9 9 0 1 0 2.64-6.36L3 8m0-5v5h5")}<span>Reset to defaults</span></button><button data-action="settings-close">Done</button></footer>`;
  let key = null,
    lines = [],
    active = -1,
    token = 0,
    highlightedWord = null,
    upcomingWord = null,
    controller = null,
    previousFocus = null,
    scrollUntil = 0,
    centerFrame = 0,
    wheelFrame = 0,
    wheelTarget = 0,
    lastCentered = -1,
    lastFetch = 0,
    cooldown = 0,
    frameId = 0,
    busy = Promise.resolve();
  const cache = new Map();
  let sourceState = null;
  function setSourceState(state) {
    sourceState = state;
    const labels = {
      idle: "",
      loading: "Searching LRCLIB",
      "word-timed": "Word timestamps",
      synced: "Line timing",
      estimated: "Estimated words",
      gentle: "Gentle",
      static: "Static",
      plain: "Unsynced lyrics",
      instrumental: "Instrumental",
      missing: "No lyrics found",
      error: "Could not load",
      podcast: "Not a music track",
    };
    const label = labels[state] || state || "";
    q(".status").textContent = label ? "LRCLIB · " + label : "";
    q(".status").title = label
      ? state === "estimated"
        ? "LRCLIB provides line timing for this track; word timing is approximated."
        : state === "plain"
          ? "This track only has unsynchronized lyrics."
          : ""
      : "";
  }
  const fmt = (ms) => {
    const n = Math.max(0, Math.floor((ms || 0) / 1000));
    return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  };
  // Shows a message in the lyric pane. Pass { retry: true } to add a button
  // that forces the current track to be fetched again.
  const note = (text, opts = {}) => {
    lines = [];
    active = -1;
    lastCentered = -1;
    highlightedWord?.classList.remove("active");
    upcomingWord?.classList.remove("upcoming");
    highlightedWord = upcomingWord = null;
    pane.replaceChildren();
    const n = document.createElement("div");
    n.className = "message";
    n.textContent = text;
    pane.append(n);
    if (opts.retry) {
      const actions = document.createElement("div");
      actions.className = "message-actions";
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "retry-lyrics";
      retry.dataset.action = "retry-lyrics";
      retry.textContent = "Try again";
      actions.append(retry);
      pane.append(actions);
    }
  };
  function showLoading() {
    lines = [];
    active = -1;
    lastCentered = -1;
    pane.replaceChildren();
    for (let i = 0; i < 8; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "placeholder";
      placeholder.setAttribute("aria-hidden", "true");
      pane.append(placeholder);
    }
    setSourceState("loading");
  }
  function emitLuma(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {}
  }
  function setSyncOffset(ms, opts = {}) {
    options.syncOffset = Number.isFinite(Number(ms))
      ? Math.max(-5000, Math.min(5000, Number(ms)))
      : 0;
    if (opts.save !== false) save();
    applySettings();
    emitLuma("luma:sync-offset-changed", { ms: options.syncOffset });
  }
  function applySettings() {
    root.style.setProperty("--lyric-size", Number(options.size) + "px");
    root.style.setProperty("--dim", Number(options.dim));
    options.syncOffset = Number.isFinite(Number(options.syncOffset))
      ? Math.max(-5000, Math.min(5000, Number(options.syncOffset)))
      : 0;
    if (!["word", "block", "gentle", "static"].includes(options.lyricMode))
      options.lyricMode = "word";
    options.scrollSmoothness = Number.isFinite(Number(options.scrollSmoothness))
      ? Math.max(0, Math.min(100, Number(options.scrollSmoothness)))
      : 65;
    root.dataset.lyricMode = options.lyricMode;
    root.dataset.sliderStyle = "bar";
    root.classList.toggle("vinyl", Boolean(options.vinyl));
    desktop.disabled = !options.desktop;
    q(".size").value = options.size;
    q(".size-value").textContent = Number(options.size) + " px";
    q(".darkness").value = options.dim;
    q(".darkness-value").textContent =
      Math.round(Number(options.dim) * 100) + "%";
    const modeLabels = {
      word: "Word by word",
      block: "Line by line",
      gentle: "Gentle",
      static: "Static",
    };
    q(".mode-label").textContent = modeLabels[options.lyricMode];
    for (const option of q(".mode-options").querySelectorAll(
      "[data-mode-value]",
    ))
      option.setAttribute(
        "aria-selected",
        String(option.dataset.modeValue === options.lyricMode),
      );
    q(".scroll-smoothness").value = options.scrollSmoothness;
    q(".scroll-smoothness-value").textContent =
      Math.round(options.scrollSmoothness) + "%";
    q(".sync-offset").value = options.syncOffset;
    q(".sync-offset-value").textContent =
      (options.syncOffset > 0 ? "+" : "") +
      (options.syncOffset / 1000).toFixed(2) +
      " s";
    for (const input of q(".settings").querySelectorAll('input[type="range"]'))
      updateRangeVisual(input);
    q(".vinyl").checked = options.vinyl;
    q(".estimated").checked = options.estimated;
    q(".translate").checked = Boolean(options.translate);
    q(".romanize").checked = Boolean(options.romanize);
    q(".translate-lang").value = options.translateLang || "en";
    q(".desktop").checked = options.desktop;
  }
  applySettings();
  setDefaultAccent();
  const { translateLines } = createTranslationService();
  // Puts a romanized/translated line under each lyric line. Romanized
  // original wins; falls back to the translation.
  async function decorateLyrics() {
    const myToken = token,
      lineEls = [...pane.querySelectorAll(".line")];
    if (!lines.length || lineEls.length !== lines.length) return;
    const texts = lines.map((l) => l.text.replace(/\s+/g, " ").trim());
    const roms = options.romanize ? texts.map(romanizeText) : texts.map(() => "");
    const trs = options.translate
      ? await translateLines(texts, options.translateLang || "en", controller?.signal).catch((e) => {
          console.warn("[Luma Lyrics] Translation unavailable:", e.message);
          return texts.map(() => "");
        })
      : texts.map(() => "");
    if (myToken !== token) return; // track changed while fetching
    lineEls.forEach((el, i) => {
      let extra = el.querySelector(".lyric-translation");
      const secondary = roms[i] || trs[i];
      if (!secondary) {
        extra?.remove();
        return;
      }
      if (!extra) {
        extra = document.createElement("span");
        extra.className = "lyric-translation";
        el.append(extra);
      }
      extra.textContent = secondary;
    });
  }
  function render() {
    active = -1;
    lastCentered = -1;
    highlightedWord?.classList.remove("active");
    upcomingWord?.classList.remove("upcoming");
    highlightedWord = upcomingWord = null;
    pane.replaceChildren();
    const duration = player().getDuration() || 0;
    if (migratedDefaultDim) {
      migratedDefaultDim = false;
      save();
    }
    const modeState =
      options.lyricMode === "word"
        ? lines.some((l) => l.exact)
          ? "word-timed"
          : options.estimated
            ? "estimated"
            : "synced"
        : options.lyricMode === "block"
          ? "synced"
          : options.lyricMode;
    setSourceState(modeState);
    lines.forEach((line, i) => {
      line.end =
        lines[i + 1]?.ms ?? (duration > line.ms ? duration : line.ms + 4000);
      line.display = line.exact
        ? line.words.map((word) => ({
            ...word,
            ms: word.ms,
            endTime: Math.min(word.endTime, line.end),
          }))
        : [];
      if (!line.exact && options.estimated) {
        const words = line.text.match(/\S+\s*/g) || [line.text];
        // Weight each word by its length plus a small pause for punctuation, so
        // commas and full stops do not rush past like ordinary syllables.
        const weightOf = (text) => {
          const trimmed = text.trim();
          const pause = /[.!?…]$/.test(trimmed)
            ? 3
            : /[,;:]$/.test(trimmed)
              ? 2
              : /[-–—]$/.test(trimmed)
                ? 1
                : 0;
          return Math.max(1, trimmed.length + pause);
        };
        const total = words.reduce((s, w) => s + weightOf(w), 0) || 1;
        let used = 0;
        line.display = words.map((text) => {
          const ms = line.ms + (Math.max(0, line.end - line.ms) * used) / total;
          used += weightOf(text);
          return { ms, endTime: ms, text };
        });
      }
      const b = document.createElement("button");
      b.className = "line";
      b.id = `line-${i}`;
      b.onclick = () =>
        player().seek(Math.max(0, line.ms + options.syncOffset));
      const mainRow = document.createElement("span");
      mainRow.className = "lyric-main";
      const secondaryRow = document.createElement("span");
      secondaryRow.className = "lyric-secondary";
      let bracketStack = [];
      const addPlainSegments = (text) => {
        const segments = text.split(/(\([^)]*\)|\[[^\]]*\])/g);
        for (const segment of segments) {
          if (!segment) continue;
          const target = /^[([]/.test(segment.trimStart())
            ? secondaryRow
            : mainRow;
          target.append(document.createTextNode(segment));
        }
      };
      if (options.lyricMode === "word" && line.display.length) {
        for (let j = 0; j < line.display.length; j++) {
          const w = line.display[j];
          const span = document.createElement("span");
          span.className = "luma-lyric-token";
          span.id = `word-${i}-${j}`;
          span.textContent = w.text;
          span.style.setProperty("--flow-opacity", "0.52");
          let secondary = bracketStack.length > 0;
          for (const char of w.text) {
            if (char === "(" || char === "[") {
              if (!bracketStack.length) secondary = true;
              bracketStack.push(char === "(" ? ")" : "]");
            } else if (char === ")" || char === "]") {
              if (bracketStack.at(-1) === char) bracketStack.pop();
            }
          }
          (secondary ? secondaryRow : mainRow).append(span);
        }
      } else addPlainSegments(line.text);
      if (mainRow.childNodes.length) b.append(mainRow);
      if (secondaryRow.childNodes.length) b.append(secondaryRow);
      pane.append(b);
    });
    decorateLyrics();
  }
  function show(record, trackInfo) {
    if (record.instrumental) {
      setSourceState("instrumental");
      note("Instrumental — no lyrics.");
      return;
    }
    lines = pickLyrics(record, trackInfo).lines;
    if (lines.length) {
      render();
      return;
    }
    if (record.plainLyrics) {
      setSourceState("plain");
      note("Unsynchronized lyrics\n\n" + record.plainLyrics);
      return;
    }
    setSourceState("missing");
    note("No lyrics found for this recording.", { retry: true });
  }
  async function load(force = false) {
    const item = player().data?.item,
      m = item?.metadata || {};
    const current = JSON.stringify([
      item?.uri || "",
      m.title || "",
      m.artist_name || "",
      m.album_title || "",
    ]);
    if (!force && current === key) return;
    if (force && current) cache.delete(current);
    key = current;
    const id = ++token;
    controller?.abort();
    const c = new AbortController();
    controller = c;
    q(".title").textContent = m.title || "Nothing playing";
    q(".artist").textContent = m.artist_name || "";
    let art = m.image_xlarge_url || m.image_large_url || m.image_url || "";
    if (art.startsWith("spotify:image:"))
      art = "https://i.scdn.co/image/" + art.split(":").pop();
    if (/^https?:\/\//.test(art)) {
      setDefaultAccent();
      cover.crossOrigin = "anonymous";
      cover.onload = () => {
        if (cover.src === art) setArtworkAccent(cover);
      };
      cover.onerror = () => {
        console.warn(
          "[Luma Lyrics] Album artwork could not be loaded for its accent color.",
        );
      };
      q(".cover").src = art;
      q(".backdrop").style.backgroundImage = `url(${JSON.stringify(art)})`;
    } else {
      cover.onload = null;
      cover.onerror = null;
      q(".cover").removeAttribute("src");
      q(".backdrop").style.backgroundImage = "none";
      setDefaultAccent();
    }
    if (!m.title || !m.artist_name) {
      setSourceState("idle");
      note("Play a music track to load lyrics.");
      return;
    }
    if (item?.uri?.startsWith("spotify:episode:")) {
      setSourceState("podcast");
      note("Lyrics are available for music tracks.");
      return;
    }
    const trackInfo = {
      title: m.title,
      artists: Object.keys(m)
        .filter((k) => /^artist_name(:\d+)?$/.test(k))
        .map((k) => m[k]),
      album: m.album_title || "",
      durationMs: player().getDuration() || 0,
      uri: item?.uri || "",
    };
    emitLuma("luma:track", trackInfo);
    if (cache.has(key)) {
      show(cache.get(key), trackInfo);
      return;
    }
    showLoading();
    const params = new URLSearchParams({
      track_name: m.title,
      artist_name: m.artist_name,
    });
    if (m.album_title) params.set("album_name", m.album_title);
    const seconds = Math.round(player().getDuration() / 1000);
    if (seconds > 0 && seconds <= 3600) params.set("duration", String(seconds));
    const job = async () => {
      if (c.signal.aborted) return;
      await new Promise((r) =>
        setTimeout(r, Math.max(0, lastFetch + 500 - Date.now())),
      );
      if (c.signal.aborted) return;
      if (Date.now() < cooldown)
        throw Error("Lyrics service is busy. Try again in a minute.");
      lastFetch = Date.now();
      const timer = setTimeout(() => c.abort(), 15000);
      let response;
      try {
        response = await fetch("https://lrclib.net/api/get?" + params, {
          credentials: "omit",
          signal: c.signal,
          headers: {
            "Lrclib-Client":
              "LumaLyrics/2.0 (Spicetify independent extension)",
          },
        });
        if (response.status === 429 || response.status === 503) {
          const raw = response.headers.get("Retry-After"),
            n = Number(raw);
          cooldown =
            Date.now() +
            (raw && Number.isFinite(n)
              ? n * 1000
              : Math.max(60000, (Date.parse(raw) || 0) - Date.now()));
          throw Error("Lyrics service is busy. Try again later.");
        }
        if (response.status === 404)
          throw Error("No lyrics found for this track.");
        if (!response.ok)
          throw Error("Lyrics service error " + response.status);
        const record = await response.json();
        if (!record || typeof record !== "object")
          throw Error("Unexpected lyrics response.");
        cache.set(current, record);
        if (cache.size > 50) cache.delete(cache.keys().next().value);
        if (id === token) show(record, trackInfo);
      } finally {
        clearTimeout(timer);
      }
    };
    const pending = busy.then(job);
    busy = pending.catch(() => {});
    try {
      await pending;
    } catch (e) {
      if (id === token) {
        setSourceState("error");
        note(
          e.name === "AbortError"
            ? "Request timed out. Try again to fetch the lyrics."
            : "Could not load lyrics.\n" + e.message,
          { retry: true },
        );
      }
    }
  }
  function center(index) {
    if (index < 0 || Date.now() < scrollUntil) return;
    const el = pane.children[index];
    if (!el) return;
    lastCentered = index;
    const target = el.offsetTop - pane.clientHeight / 2 + el.offsetHeight / 2;
    cancelAnimationFrame(centerFrame);
    cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    wheelTarget = target;
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      options.lyricMode === "static" ||
      options.scrollSmoothness === 0
    ) {
      pane.scrollTop = target;
      return;
    }
    const start = pane.scrollTop,
      distance = target - start,
      began = performance.now(),
      duration =
        160 +
        options.scrollSmoothness * 3 +
        Math.min(240, Math.abs(distance) * 0.15);
    const animate = (now) => {
      const progress = Math.min(1, (now - began) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      pane.scrollTop = start + distance * eased;
      if (progress < 1) centerFrame = requestAnimationFrame(animate);
    };
    centerFrame = requestAnimationFrame(animate);
  }
  const pauseCentering = () => {
    cancelAnimationFrame(centerFrame);
    cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    wheelTarget = pane.scrollTop;
    lastCentered = -1;
    scrollUntil = Date.now() + 2500;
  };
  const smoothWheel = (event) => {
    event.preventDefault();
    cancelAnimationFrame(centerFrame);
    lastCentered = -1;
    scrollUntil = Date.now() + 2500;
    const max = pane.scrollHeight - pane.clientHeight;
    const base = wheelFrame ? wheelTarget : pane.scrollTop;
    wheelTarget = Math.max(0, Math.min(max, base + event.deltaY));
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      options.lyricMode === "static" ||
      options.scrollSmoothness === 0
    ) {
      cancelAnimationFrame(wheelFrame);
      wheelFrame = 0;
      pane.scrollTop = wheelTarget;
      return;
    }
    if (wheelFrame) return;
    const glide = () => {
      const distance = wheelTarget - pane.scrollTop;
      if (Math.abs(distance) < 0.6) {
        pane.scrollTop = wheelTarget;
        wheelFrame = 0;
        return;
      }
      pane.scrollTop += distance * (0.35 - options.scrollSmoothness * 0.0025);
      wheelFrame = requestAnimationFrame(glide);
    };
    wheelFrame = requestAnimationFrame(glide);
  };
  pane.addEventListener("wheel", smoothWheel, { passive: false });
  pane.addEventListener("touchstart", pauseCentering, { passive: true });
  // Only pen input pauses auto-centring here; a normal mouse click on a lyric
  // should seek and re-centre immediately instead of waiting out the pause.
  pane.addEventListener(
    "pointerdown",
    (event) => {
      if (event.pointerType === "pen") pauseCentering();
    },
    { passive: true },
  );
  function tick() {
    if (root.hidden) return;
    load().catch((e) => note("Player update failed: " + e.message));
    const p = player(),
      duration = p.getDuration() || 0,
      progress = p.getProgress() || 0,
      lyricProgress = Math.max(0, progress - options.syncOffset);
    q(".elapsed").textContent = fmt(progress);
    q(".duration").textContent = fmt(duration);
    if (document.activeElement !== seek)
      q(".seek").value = duration ? (progress / duration) * 1000 : 0;
    updateVolumeVisual(p.getVolume());
    updateSeekVisual();
    const playing = p.isPlaying();
    root.classList.toggle("playing", playing);
    const state = playing ? "pause" : "play";
    if (q(".play").dataset.icon !== state) {
      q(".play").innerHTML = icons[state];
      q(".play").dataset.icon = state;
    }
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].ms <= lyricProgress) index = i;
      else break;
    }
    if (index !== active) {
      active = index;
      for (let i = 0; i < lines.length; i++) {
        pane.children[i]?.classList.toggle("active", i === index);
        pane.children[i]?.classList.toggle("past", i < index);
      }
    }
    // Scroll a little before the next line starts, so the new line is already
    // centred when its first word is sung instead of sliding in late.
    if (index >= 0 && Date.now() >= scrollUntil) {
      const nextIndex = index + 1;
      let targetIndex = index;
      if (nextIndex < lines.length) {
        const gap = Math.max(0, lines[nextIndex].ms - lines[index].ms),
          lead = Math.min(600, gap * 0.5);
        if (lyricProgress >= lines[nextIndex].ms - lead)
          targetIndex = nextIndex;
      }
      if (targetIndex !== lastCentered) center(targetIndex);
    }
    const line = lines[active];
    if (line && options.lyricMode === "word" && line.display.length) {
      let wordIndex = -1;
      for (let j = 0; j < line.display.length; j++) {
        const word = line.display[j],
          end = endOfWord(line, j);
        if (lyricProgress >= word.ms && lyricProgress < end) {
          wordIndex = j;
          break;
        }
      }
      const wordElement =
        wordIndex >= 0
          ? pane.querySelector(`#word-${active}-${wordIndex}`)
          : null;
      if (wordElement !== highlightedWord) {
        highlightedWord?.classList.remove("active");
        highlightedWord = wordElement;
        highlightedWord?.classList.add("active");
      }
      let nextLineIndex = active,
        nextWordIndex = wordIndex + 1;
      if (wordIndex < 0) {
        nextWordIndex = line.display.findIndex(
          (word) => word.ms > lyricProgress,
        );
        if (nextWordIndex < 0) {
          nextLineIndex++;
          nextWordIndex = 0;
        }
      } else if (nextWordIndex >= line.display.length) {
        nextLineIndex++;
        nextWordIndex = 0;
      }
      while (
        nextLineIndex < lines.length &&
        !lines[nextLineIndex].display[nextWordIndex]
      ) {
        nextLineIndex++;
        nextWordIndex = 0;
      }
      const upcomingElement =
        nextLineIndex < lines.length
          ? pane.querySelector(`#word-${nextLineIndex}-${nextWordIndex}`)
          : null;
      if (upcomingElement !== upcomingWord) {
        upcomingWord?.classList.remove("upcoming");
        upcomingWord = upcomingElement;
        upcomingWord?.classList.add("upcoming");
      }
      line.display.forEach((word, j) => {
        const opacity = wordFlowOpacity(
          word.ms,
          endOfWord(line, j),
          lyricProgress,
        );
        pane
          .querySelector(`#word-${active}-${j}`)
          ?.style.setProperty("--flow-opacity", opacity.toFixed(3));
      });
    } else {
      highlightedWord?.classList.remove("active");
      upcomingWord?.classList.remove("upcoming");
      highlightedWord = upcomingWord = null;
    }
  }
  function animate() {
    if (root.hidden) {
      frameId = 0;
      return;
    }
    try {
      tick();
    } catch (e) {
      console.error("[Luma Lyrics]", e);
    }
    frameId = requestAnimationFrame(animate);
  }
  function setSettings(open, restoreFocus = false) {
    const gear = q('[data-action="settings"]');
    q(".settings").hidden = !open;
    gear.setAttribute("aria-expanded", String(open));
    q(".mode-options").hidden = true;
    q(".mode-trigger").setAttribute("aria-expanded", "false");
    if (open) q(".settings-close").focus();
    else if (restoreFocus) gear.focus();
  }
  document.addEventListener("pointerdown", (event) => {
    const settings = q(".settings");
    const gear = q('[data-action="settings"]');
    if (
      !settings.hidden &&
      !settings.contains(event.target) &&
      !gear.contains(event.target)
    )
      setSettings(false);
  });
  let launcher;
  async function close(opts = {}) {
    if (root.hidden) return;
    root.hidden = true;
    cancelAnimationFrame(frameId);
    frameId = 0;
    ++token;
    controller?.abort();
    setSettings(false);
    if (launcher) launcher.active = false;
    if (document.fullscreenElement === root)
      await document.exitFullscreen().catch(() => {});
    emitLuma("luma:close");
    if (opts.restoreFocus !== false) previousFocus?.focus?.();
  }
  function open() {
    if (!root.hidden) return;
    previousFocus = document.activeElement;
    root.hidden = false;
    key = null;
    scrollUntil = 0;
    if (launcher) launcher.active = true;
    if (!frameId) frameId = requestAnimationFrame(animate);
    q('[data-action="close"]').focus();
    emitLuma("luma:open");
  }
  function toggle() {
    root.hidden ? open() : close();
  }
  const loadIcon =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16m4-11h2m-2 3h2m-2 3h2"/></svg>';
  function createLauncher() {
    const onToggle = () => toggle();
    try {
      if (globalThis.Spicetify?.Playbar?.Button) {
        launcher = new Spicetify.Playbar.Button(
          "Luma Lyrics",
          loadIcon,
          onToggle,
          false,
          false,
          true,
        );
        let tries = 0;
        const fallbackTick = () => {
          try {
            if (launcher?.element?.isConnected) return;
            // Anchor on Spotify's own right-side buttons (stable testids); the
            // hashed class names differ per build, so clone the anchor's.
            // The queue/npv buttons each live in a narrow container built for
            // a single button, so mount beside that container (in the flex
            // row that holds it) — prepending inside it stacks the icons.
            const anchor =
              document.querySelector('[data-testid="control-button-queue"]') ||
              document.querySelector('[data-testid="control-button-npv"]');
            const mount =
              (anchor &&
                (anchor.parentElement?.parentElement ||
                  anchor.parentElement)) ||
              document.querySelector(".main-nowPlayingBar-extraControls") ||
              document.querySelector(".main-nowPlayingBar-right > div") ||
              document.querySelector(".main-nowPlayingBar-right") ||
              document.querySelector('[data-testid="now-playing-bar"]');
            if (!mount) {
              if (++tries < 12) setTimeout(fallbackTick, 1500);
              else
                console.warn(
                  "[Luma Lyrics] No playbar mount point found. Open Luma from the console: LumaLyrics.toggle()",
                );
              return;
            }
            const el = launcher.element || document.createElement("button");
            if (anchor && el !== anchor) el.className = anchor.className;
            else if (!el.classList.contains("main-genericButton-button"))
              el.classList.add("main-genericButton-button");
            if (!el.querySelector("svg"))
              el.innerHTML = `<span style="display:grid;place-items:center">${loadIcon}</span>`;
            el.type = "button";
            el.title = "Luma Lyrics";
            el.setAttribute("aria-label", "Luma Lyrics");
            el.onclick = onToggle;
            mount.append(el);
            console.info("[Luma Lyrics] Playbar toggle mounted via fallback.");
          } catch (error) {
            console.warn("[Luma Lyrics] Playbar fallback failed:", error);
          }
        };
        setTimeout(fallbackTick, 3000);
        return;
      }
    } catch (error) {
      console.warn("[Luma Lyrics] Playbar.Button failed:", error);
    }
    try {
      // Same reasoning as above: mount beside the anchor's own container.
      const anchor =
        document.querySelector('[data-testid="control-button-queue"]') ||
        document.querySelector('[data-testid="control-button-npv"]');
      const mount =
        (anchor && (anchor.parentElement?.parentElement || anchor.parentElement)) ||
        document.querySelector(".main-nowPlayingBar-extraControls") ||
        document.querySelector(".main-nowPlayingBar-right > div") ||
        document.querySelector(".main-nowPlayingBar-right") ||
        document.querySelector('[data-testid="now-playing-bar"]');
      if (!mount) return;
      const el = document.createElement("button");
      el.type = "button";
      el.className = anchor ? anchor.className : "main-genericButton-button";
      el.title = "Luma Lyrics";
      el.setAttribute("aria-label", "Luma Lyrics");
      el.innerHTML = `<span style="display:grid;place-items:center">${loadIcon}</span>`;
      el.onclick = onToggle;
      mount.append(el);
      launcher = {
        element: el,
        set active(v) {
          el.classList.toggle("main-genericButton-buttonActive", Boolean(v));
          el.classList.toggle("main-genericButton-buttonActiveDot", Boolean(v));
        },
        get active() {
          return el.classList.contains("main-genericButton-buttonActive");
        },
      };
    } catch (error) {
      console.warn("[Luma Lyrics] Could not create playbar toggle:", error);
    }
  }
  createLauncher();

  window.LumaLyrics = {
    version: "2.3.1",
    open,
    close: () => close(),
    toggle,
    setSyncOffset: (ms) => setSyncOffset(ms),
    getState: () => ({
      open: !root.hidden,
      syncOffset: options.syncOffset,
      vinyl: !!options.vinyl,
      lyricMode: options.lyricMode,
      trackUri: player().data?.item?.uri || "",
      source: sourceState,
    }),
    toggleVinyl: () => {
      options.vinyl = !options.vinyl;
      save();
      applySettings();
    },
  };
  window.addEventListener("luma:set-sync-offset", (e) => {
    if (typeof e?.detail?.ms === "number") setSyncOffset(e.detail.ms);
  });
  emitLuma("luma:ready", { version: "2.3.1" });
  root.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    const syncAdjust = e.target.closest("[data-sync-adjust]");
    try {
      if (syncAdjust) {
        const delta = Number(syncAdjust.dataset.syncAdjust);
        if (delta) setSyncOffset(options.syncOffset + delta);
        else setSyncOffset(0);
      }
      if (action === "toggle-vinyl") {
        options.vinyl = !options.vinyl;
        save();
        applySettings();
      }
      const modeOption = e.target.closest("[data-mode-value]");
      if (modeOption) {
        options.lyricMode = modeOption.dataset.modeValue;
        q(".mode-options").hidden = true;
        q(".mode-trigger").setAttribute("aria-expanded", "false");
        save();
        applySettings();
        if (lines.length) render();
        q(".mode-trigger").focus();
      } else if (e.target.closest(".mode-trigger")) {
        const menu = q(".mode-options"),
          expanded =
            q(".mode-trigger").getAttribute("aria-expanded") === "true";
        menu.hidden = expanded;
        q(".mode-trigger").setAttribute("aria-expanded", String(!expanded));
        if (!expanded)
          menu
            .querySelector(`[data-mode-value="${options.lyricMode}"]`)
            ?.focus();
      } else {
        q(".mode-options").hidden = true;
        q(".mode-trigger").setAttribute("aria-expanded", "false");
      }
      if (action === "close") await close();
      if (action === "full") {
        if (document.fullscreenElement === root)
          await document.exitFullscreen();
        else await root.requestFullscreen();
      }
      if (action === "settings") setSettings(q(".settings").hidden);
      if (action === "settings-close") setSettings(false, true);
      if (action === "reset-settings") {
        options = { ...defaultOptions };
        save();
        applySettings();
        if (lines.length) render();
      }
      if (action === "retry-lyrics") {
        const btn = e.target.closest("[data-action=retry-lyrics]");
        if (btn) {
          btn.disabled = true;
          btn.textContent = "Trying…";
        }
        key = null;
        await load(true).catch((err) => {
          setSourceState("error");
          note("Could not load lyrics.\n" + err.message, { retry: true });
        });
      }
      if (action === "play") player().togglePlay();
      if (action === "previous") player().back();
      if (action === "next") player().next();
    } catch (e) {
      Spicetify.showNotification("Luma: " + e.message);
    }
  });
  seek.oninput = updateSeekVisual;
  seek.onchange = () => player().seek(Number(seek.value) / 1000);
  q(".vol").oninput = (e) => {
    const value = Number(e.currentTarget.value);
    updateVolumeVisual(value);
    player().setVolume(value);
  };
  for (const [selector, field] of [
    [".size", "size"],
    [".darkness", "dim"],
    [".estimated", "estimated"],
    [".desktop", "desktop"],
    [".vinyl", "vinyl"],
    [".sync-offset", "syncOffset"],
    [".scroll-smoothness", "scrollSmoothness"],
    [".translate", "translate"],
    [".romanize", "romanize"],
    [".translate-lang", "translateLang"],
  ])
    q(selector).addEventListener("input", (e) => {
      options[field] =
        e.target.type === "checkbox"
          ? e.target.checked
          : e.target.tagName === "SELECT"
            ? e.target.value
            : Number(e.target.value);
      save();
      applySettings();
      if (
        ["estimated", "lyricMode", "translate", "romanize", "translateLang"].includes(field) &&
        lines.length
      )
        render();
    });
  const isEditable = (el) =>
    Boolean(el) &&
    (el.isContentEditable ||
      el.tagName === "TEXTAREA" ||
      (el.tagName === "INPUT" &&
        !["range", "checkbox", "radio", "button", "submit", "reset", "file", "color"].includes(el.type)));
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
      const step = escapeStep({
        overlayOpen: !root.hidden,
        menuOpen: !q(".mode-options").hidden,
        settingsOpen: !q(".settings").hidden,
        inRoot: root.contains(e.target),
        editable: isEditable(e.target),
      });
      if (!step) return;
      e.preventDefault();
      e.stopPropagation();
      if (step === "menu") {
        q(".mode-options").hidden = true;
        q(".mode-trigger").setAttribute("aria-expanded", "false");
        q(".mode-trigger").focus();
      } else if (step === "settings") setSettings(false, true);
      else close();
    },
    true,
  );
  root.addEventListener("keydown", (e) => {
    if (
      !q(".mode-options").hidden &&
      ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)
    ) {
      const choices = [...q(".mode-options").querySelectorAll("[role=option]")],
        selected = choices.findIndex(
          (choice) => choice.dataset.modeValue === options.lyricMode,
        );
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? choices.length - 1
            : ((choices.indexOf(document.activeElement) >= 0
                ? choices.indexOf(document.activeElement)
                : selected) +
                (e.key === "ArrowDown" ? 1 : choices.length - 1)) %
              choices.length;
      e.preventDefault();
      choices[next].focus();
    }
    if (e.key === "Tab") {
      const els = [
        ...root.querySelectorAll('button,input,select,[tabindex="0"]'),
      ].filter((el) => el.getClientRects().length && !el.disabled);
      const first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
})();
