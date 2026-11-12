// ── Romanization (offline, built in) ──────────────────────────────
// Korean: Revised Romanization. Japanese: Hepburn (kana; kanji left as-is).
// Cyrillic: ISO 9-style. Latin text and Chinese return "" (nothing to do).
const KO_I = [
    "g",
    "kk",
    "n",
    "d",
    "tt",
    "r",
    "m",
    "b",
    "p",
    "s",
    "ss",
    "",
    "j",
    "jj",
    "ch",
    "k",
    "t",
    "p",
    "h",
  ],
  KO_M = [
    "a",
    "ae",
    "ya",
    "yae",
    "eo",
    "e",
    "yeo",
    "ye",
    "o",
    "wa",
    "wae",
    "oe",
    "yo",
    "u",
    "wo",
    "we",
    "wi",
    "yu",
    "eu",
    "ui",
    "i",
  ],
  KO_F = [
    "",
    "k",
    "k",
    "k",
    "n",
    "n",
    "n",
    "t",
    "l",
    "k",
    "m",
    "l",
    "l",
    "l",
    "p",
    "l",
    "m",
    "p",
    "p",
    "t",
    "t",
    "ng",
    "t",
    "t",
    "k",
    "t",
    "p",
    "t",
  ],
  CYR = {
    А: "A",
    Б: "B",
    В: "V",
    Г: "G",
    Д: "D",
    Е: "E",
    Ё: "Yo",
    Ж: "Zh",
    З: "Z",
    И: "I",
    Й: "Y",
    К: "K",
    Л: "L",
    М: "M",
    Н: "N",
    О: "O",
    П: "P",
    Р: "R",
    С: "S",
    Т: "T",
    У: "U",
    Ф: "F",
    Х: "Kh",
    Ц: "Ts",
    Ч: "Ch",
    Ш: "Sh",
    Щ: "Shch",
    Ъ: "",
    Ы: "Y",
    Ь: "",
    Э: "E",
    Ю: "Yu",
    Я: "Ya",
  },
  KANA = Object.fromEntries([
    ["あ", "a"],
    ["い", "i"],
    ["う", "u"],
    ["え", "e"],
    ["お", "o"],
    ["か", "ka"],
    ["き", "ki"],
    ["く", "ku"],
    ["け", "ke"],
    ["こ", "ko"],
    ["が", "ga"],
    ["ぎ", "gi"],
    ["ぐ", "gu"],
    ["げ", "ge"],
    ["ご", "go"],
    ["さ", "sa"],
    ["し", "shi"],
    ["す", "su"],
    ["せ", "se"],
    ["そ", "so"],
    ["ざ", "za"],
    ["じ", "ji"],
    ["ず", "zu"],
    ["ぜ", "ze"],
    ["ぞ", "zo"],
    ["た", "ta"],
    ["ち", "chi"],
    ["つ", "tsu"],
    ["て", "te"],
    ["と", "to"],
    ["だ", "da"],
    ["ぢ", "ji"],
    ["づ", "zu"],
    ["で", "de"],
    ["ど", "do"],
    ["な", "na"],
    ["に", "ni"],
    ["ぬ", "nu"],
    ["ね", "ne"],
    ["の", "no"],
    ["は", "ha"],
    ["ひ", "hi"],
    ["ふ", "fu"],
    ["へ", "he"],
    ["ほ", "ho"],
    ["ば", "ba"],
    ["び", "bi"],
    ["ぶ", "bu"],
    ["べ", "be"],
    ["ぼ", "bo"],
    ["ぱ", "pa"],
    ["ぴ", "pi"],
    ["ぷ", "pu"],
    ["ぺ", "pe"],
    ["ぽ", "po"],
    ["ま", "ma"],
    ["み", "mi"],
    ["む", "mu"],
    ["め", "me"],
    ["も", "mo"],
    ["や", "ya"],
    ["ゆ", "yu"],
    ["よ", "yo"],
    ["ら", "ra"],
    ["り", "ri"],
    ["る", "ru"],
    ["れ", "re"],
    ["ろ", "ro"],
    ["わ", "wa"],
    ["を", "wo"],
    ["ん", "n"],
    ["ゔ", "vu"],
  ]),
  SMALL = {
    ゃ: "ya",
    ゅ: "yu",
    ょ: "yo",
    ぁ: "a",
    ぃ: "i",
    ぅ: "u",
    ぇ: "e",
    ぉ: "o",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
  },
  romajiOf = (ch) =>
    KANA[ch] ??
    (ch >= "ァ" && ch <= "ヶ"
      ? KANA[String.fromCharCode(ch.charCodeAt(0) - 0x60)]
      : null);
export function romanizeText(text) {
  if (!text || !/[가-힣ㄱ-ㅎ\u3040-\u30FF\u0400-\u04FF]/.test(text)) return "";
  let out = "";
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i],
      code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const base = code - 0xac00;
      out +=
        KO_I[(base / 588) | 0] +
        KO_M[((base % 588) / 28) | 0] +
        KO_F[base % 28];
    } else if (code >= 0x1100 && code <= 0x11ff) {
      out += KO_F[code - 0x1100]; // lone jongseong cluster
    } else if (code >= 0x3131 && code <= 0x314e) {
      out += KO_I[code - 0x3131]; // jamo consonant
    } else if (code >= 0x314f && code <= 0x3163) {
      out += KO_M[code - 0x314f]; // jamo vowel
    } else if (ch === "っ" || ch === "ッ") {
      const next = romajiOf(chars[i + 1] || "") || chars[i + 1] || "";
      out +=
        next[0] === "c"
          ? "t"
          : /^[kstpbjgdzchg]/.test(next[0] || "")
            ? next[0]
            : "";
    } else if (ch === "ー") {
      out += /[aeiou]/.test(out.slice(-1)) ? out.slice(-1) : "";
    } else if (code >= 0x3040 && code <= 0x30ff) {
      const base = romajiOf(ch),
        small = SMALL[chars[i + 1]];
      if (base && small) {
        out += base.slice(0, -1) + small;
        i++; // consumed the combining small kana
      } else out += base ?? ch;
    } else if (code >= 0x400 && code <= 0x4ff) {
      const upper = ch.toUpperCase(),
        r = CYR[upper] ?? "";
      out += ch === upper ? r : r.toLowerCase();
    } else out += ch;
  }
  return out;
}
