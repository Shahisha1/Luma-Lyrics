import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = resolve(root, "src/main.js");
const outputPath = resolve(root, "luma-lyrics.js");
const imports = [
  'import { parse, parseYamlSubset, lyricsfileToLines, normalizeName, sameName, splitArtists, trackMatches, pickLyrics, escapeStep, endOfWord, wordFlowOpacity } from "./lyrics/parsing.js";',
  'import { romanizeText } from "./lyrics/romanization.js";',
  'import { createTranslationService } from "./services/translation.js";',
  'import { createLyricsClient } from "./services/lrclib.js";',
  'import { defaultOptions, loadSettings, saveSettings } from "./core/settings.js";',
  'import { getLocalLyrics, saveLocalLyrics, removeLocalLyrics } from "./core/local-lyrics.js";',
  'import { installStyles } from "./ui/styles.js";',
  'import { createArtworkPalette } from "./theme/artwork.js";',
].join("\n");

const [
  main,
  parsing,
  romanization,
  translation,
  lrclib,
  settings,
  localLyrics,
  styles,
  artwork,
] = await Promise.all([
  readFile(mainPath, "utf8"),
  readFile(resolve(root, "src/lyrics/parsing.js"), "utf8"),
  readFile(resolve(root, "src/lyrics/romanization.js"), "utf8"),
  readFile(resolve(root, "src/services/translation.js"), "utf8"),
  readFile(resolve(root, "src/services/lrclib.js"), "utf8"),
  readFile(resolve(root, "src/core/settings.js"), "utf8"),
  readFile(resolve(root, "src/core/local-lyrics.js"), "utf8"),
  readFile(resolve(root, "src/ui/styles.js"), "utf8"),
  readFile(resolve(root, "src/theme/artwork.js"), "utf8"),
]);

if (main.split(imports).length !== 2) {
  throw new Error(
    "Expected the source entry to contain the module import block exactly once.",
  );
}

const inline = [
  parsing,
  romanization,
  translation,
  lrclib,
  settings,
  localLyrics,
  styles,
  artwork,
]
  .map((moduleSource) => moduleSource.replace(/^export\s+/gm, ""))
  .join("\n");
const runtime = main.replace(imports, "");
const wrapper = "(async () => {";
if (runtime.split(wrapper).length !== 2) {
  throw new Error("Expected exactly one extension runtime wrapper.");
}
const bundle = runtime.replace(wrapper, wrapper + "\n" + inline);

await writeFile(outputPath, bundle);
process.stdout.write("Built " + outputPath.replace(root + "/", "") + "\n");
