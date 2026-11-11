// Luma Lyrics v2.3.1
import { parse, parseYamlSubset, lyricsfileToLines, normalizeName, sameName, splitArtists, trackMatches, pickLyrics, escapeStep, endOfWord, wordFlowOpacity } from "./lyrics/parsing.js";
import { romanizeText } from "./lyrics/romanization.js";
import { createTranslationService } from "./services/translation.js";
import { defaultOptions, loadSettings, saveSettings } from "./core/settings.js";
import { installStyles } from "./ui/styles.js";
(async () => {
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
  installStyles(document);
  const style = document.createElement("style");
  style.textContent =
    "\n#luma-root{position:fixed;inset:0;z-index:999999;background:#151517;color:#fff;font-family:'Segoe UI',sans-serif;overflow:hidden;--lyric-size:36px;--dim:.25}\n#luma-root[hidden],#luma-root [hidden]{display:none!important}\n#luma-root *{box-sizing:border-box}\n#luma-root .backdrop{position:absolute;inset:-100px;background:center/cover;filter:blur(85px) saturate(1.5);opacity:.8;transform:scale(1.1);pointer-events:none}\n#luma-root .shade{position:absolute;inset:0;background:rgba(0,0,0,var(--dim));pointer-events:none}\n#luma-root .bar{position:absolute;inset:20px 25px auto;display:flex;align-items:center;gap:10px;z-index:3}\n#luma-root button{font:inherit;color:inherit;cursor:pointer}\n#luma-root .tool{border:1px solid #ffffff18;border-radius:50%;width:38px;height:38px;background:#ffffff0c;display:grid;place-items:center}\n#luma-root button:hover{background:#ffffff10}\n#luma-root svg{width:20px;height:20px;fill:currentColor}\n#luma-root .status{margin-left:auto;font-size:12px;color:#ffffffa0}\n#luma-root .layout{position:relative;height:100%;padding:85px 9vw 45px;display:grid;grid-template-columns:minmax(230px,360px) minmax(0,1fr);gap:8vw;align-items:center}\n#luma-root .cover{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:13px;background:#28282b;box-shadow:0 30px 80px #0007}\n#luma-root .title{font-size:23px;font-weight:700;margin:22px 0 4px;letter-spacing:-.6px}\n#luma-root .artist{font-size:16px;color:#ffffffaa;margin-bottom:20px}\n#luma-root input[type=range]{width:100%;height:5px;accent-color:white;cursor:pointer}\n#luma-root .times{display:flex;justify-content:space-between;color:#ffffff90;font-size:12px;margin-top:6px}\n#luma-root .controls{display:flex;justify-content:center;gap:24px;margin:15px 0}\n#luma-root .controls button{background:none;border:0;padding:8px;display:grid;place-items:center}\n#luma-root .controls svg{width:29px;height:29px}\n#luma-root .controls .play svg{width:38px;height:38px}\n#luma-root .volume{display:flex;align-items:center;gap:12px;margin-top:14px;color:#ffffffa0}\n#luma-root .lyrics{position:relative;height:100%;overflow:auto;scrollbar-width:none;padding:40vh 8px;mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}\n#luma-root .line{display:block;width:100%;text-align:left;border:0;background:transparent;padding:15px 0;font-size:var(--lyric-size);font-weight:750;letter-spacing:-1px;line-height:1.35;white-space:pre-wrap;opacity:.25;transform:scale(.96);transform-origin:left;transition:transform .5s,opacity .4s}\n#luma-root .line.active{opacity:1;transform:scale(1)}\n#luma-root .line.past{opacity:.35}\n#luma-root .word{display:inline-block;white-space:pre;color:transparent;background:linear-gradient(90deg,#fff var(--fill,0%),#ffffff55 var(--fill,0%));background-clip:text;-webkit-background-clip:text}\n#luma-root .line:not(.active) .word{background:none;color:inherit}\n#luma-root .message{font-size:22px;line-height:1.6;white-space:pre-wrap;color:#ffffffc0}\n#luma-root .settings{position:absolute;right:25px;top:68px;width:300px;max-height:75vh;overflow:auto;z-index:4;padding:20px;border-radius:16px;background:#232326f5;box-shadow:0 20px 60px #0007;border:1px solid #ffffff15}\n#luma-root .settings h2{margin:0 0 15px;font-size:18px}\n#luma-root .settings label{display:block;margin:16px 0;font-size:13px;line-height:1.5}\n#luma-root .settings small{display:block;color:#ffffff90;margin-top:6px;line-height:1.5}\n#luma-root .settings button{border:1px solid #ffffff20;background:#ffffff0c;border-radius:8px;padding:8px 12px;margin:3px}\n@media(max-width:760px){#luma-root .layout{padding:78px 25px 25px;gap:25px;grid-template-columns:minmax(170px,1fr) minmax(0,1.2fr)}#luma-root .line{font-size:26px}#luma-root .status{font-size:10px}}\n@media(prefers-reduced-motion:reduce){#luma-root .line{transition:none;transform:none}}\n";
  document.head.append(style);
  const desktop = document.createElement("style");
  desktop.textContent =
    ':root{--spice-main:var(--luma-surface,#141218);--spice-sidebar:var(--luma-surface-low,#1d1b20);--spice-player:var(--luma-surface-container,#211f26);--spice-card:var(--luma-surface-high,#2b2930);--spice-button:var(--luma-primary,#d0bcff);--spice-button-active:var(--luma-primary,#d0bcff)}.Root__main-view,.Root__nav-bar,.main-card-card{border-radius:12px!important}.main-nowPlayingBar-nowPlayingBar{background:var(--luma-surface-container,#211f26)!important}button[data-testid="play-button"]{background:var(--luma-primary,#d0bcff)!important;color:var(--luma-on-primary,#381e72)!important}';
  document.head.append(desktop);
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
 <div class="layout"><div class="player"><img class="cover" alt="Album artwork"><div class="title">Nothing playing</div><div class="artist"></div><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Playback position"><div class="times"><span class="elapsed">0:00</span><span class="duration">0:00</span></div><div class="controls"><button data-action="previous" aria-label="Previous">${icons.previous}</button><button class="play" data-action="play" aria-label="Play or pause">${icons.play}</button><button data-action="next" aria-label="Next">${icons.next}</button></div><label class="volume">${svg("M3 9h4l5-4v14l-5-4H3z")}<input type="range" class="vol" min="0" max="1" step=".01" aria-label="Volume"></label></div><div class="lyrics" tabindex="0" aria-label="Lyrics"></div></div>
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
  const cover = q(".cover"),
    artworkStage = document.createElement("div");
  // Material You style dynamic color: one hue from the artwork -> tonal palette.
  // Tones follow Material 3 dark-scheme roles; tone is approximated in OKLCH.
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
  artworkStage.className = "artwork-stage";
  cover.before(artworkStage);
  artworkStage.append(cover);
  q(".settings").innerHTML =
    `<header class="settings-header"><div><span class="settings-eyebrow">PERSONALIZE</span><h2>Settings</h2></div><button class="settings-close" data-action="settings-close" aria-label="Close settings and return to lyrics" title="Close settings (Esc)">${stroke("close")}</button></header>
    <section class="settings-section"><h3>Lyrics</h3>
      <div class="setting-control mode-control"><span>Display style</span><button class="mode-trigger" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="lyric-mode-options"><span class="mode-label">Word by word</span>${stroke("down")}</button><div class="mode-options" id="lyric-mode-options" role="listbox" aria-label="Lyrics display style" hidden><button type="button" role="option" data-mode-value="word">Word by word</button><button type="button" role="option" data-mode-value="block">Line by line</button><button type="button" role="option" data-mode-value="gentle">Gentle</button><button type="button" role="option" data-mode-value="static">Static</button></div></div>
      <label class="setting-toggle"><span><strong>Estimated word animation</strong><small>Approximate timing when word timestamps are unavailable.</small></span><input type="checkbox" class="estimated"></label>
      <div class="setting-control"><span>Lyrics sync <output class="sync-offset-value">0.00 s</output></span><div class="sync-adjust"><button type="button" data-sync-adjust="-50" aria-label="Move lyrics 0.05 seconds earlier">−0.05s</button><input class="sync-offset" type="range" min="-5000" max="5000" step="50" aria-label="Lyrics sync offset"><button type="button" data-sync-adjust="50" aria-label="Move lyrics 0.05 seconds later">+0.05s</button><button type="button" data-sync-adjust="0" aria-label="Reset lyrics sync">Reset</button></div><small>Shift lyrics earlier or later to match playback.</small></div>
      <label class="setting-control"><span>Scroll smoothness <output class="scroll-smoothness-value">65%</output></span><input class="scroll-smoothness" type="range" min="0" max="100" step="5"></label>
      <small class="privacy-note">Lyrics come from LRCLIB, which receives the track title, artist, album, and duration. Word timing is used automatically when LRCLIB has it; otherwise line timing or estimated animation is used.</small>
    </section>
    <section class="settings-section"><h3>Appearance</h3>
      <label class="setting-control"><span>Text size <output class="size-value"></output></span><input class="size" type="range" min="24" max="52" step="1"></label>
      <label class="setting-control"><span>Background darkness <output class="darkness-value"></output></span><input class="darkness" type="range" min=".15" max=".8" step=".05"></label>
      <label class="setting-toggle"><span><strong>Spinning vinyl artwork</strong><small>Show the album art as a record while music plays.</small></span><input type="checkbox" class="vinyl"></label>
      <label class="setting-toggle"><span><strong>Desktop colors</strong><small>Apply Luma colors to Spotify; may conflict with other themes.</small></span><input type="checkbox" class="desktop"></label>
    </section>
    <section class="settings-section"><h3>Translation</h3>
      <label class="setting-toggle"><span><strong>Translate lyrics</strong><small>Show a translated line under each lyric. Uses Google Translate; needs internet.</small></span><input type="checkbox" class="translate"></label>
      <label class="setting-control"><span>Translate into</span><select class="translate-lang" aria-label="Translation language"><option value="en">English</option><option value="es">Spanish</option><option value="fr">French</option><option value="de">German</option><option value="pt">Portuguese</option><option value="it">Italian</option><option value="ru">Russian</option><option value="ja">Japanese</option><option value="ko">Korean</option><option value="zh-CN">Chinese</option><option value="hi">Hindi</option><option value="ar">Arabic</option></select></label>
      <label class="setting-toggle"><span><strong>Romanize lyrics</strong><small>Show romanized text under Korean, Japanese, and Cyrillic lyrics. Built in, works offline (kanji/Chinese are left as-is).</small></span><input type="checkbox" class="romanize"></label>
      <small class="privacy-note">Translation sends the lyric text directly to Google Translate. Romanization runs locally in the extension — nothing leaves Spotify.</small>
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
    if (document.activeElement !== q(".vol")) q(".vol").value = p.getVolume();
    updateSeekVisual(seek.value);
    updateRangeVisual(q(".vol"));
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
    updateRangeVisual(e.currentTarget);
    player().setVolume(Number(e.currentTarget.value));
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
