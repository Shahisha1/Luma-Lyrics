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
].join("\n");

const [main, parsing, romanization, translation] = await Promise.all([
  readFile(mainPath, "utf8"),
  readFile(resolve(root, "src/lyrics/parsing.js"), "utf8"),
  readFile(resolve(root, "src/lyrics/romanization.js"), "utf8"),
  readFile(resolve(root, "src/services/translation.js"), "utf8"),
]);

if (main.split(imports).length !== 2) {
  throw new Error("Expected the source entry to contain the module import block exactly once.");
}

const inline = [parsing, romanization, translation]
  .map((moduleSource) => moduleSource.replace(/^export\s+/gm, ""))
  .join("\n");
const bundle = main.replace(imports, inline);

await writeFile(outputPath, bundle);
process.stdout.write(`Built ${outputPath.replace(root + "/", "")}\n`);
