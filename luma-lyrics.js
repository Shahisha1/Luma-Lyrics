// Luma Lyrics 0.2.0-beta.1 — independent implementation; no Liquid Lyrics dependency.
(async () => {
  while (
    !globalThis.Spicetify?.Player ||
    !globalThis.Spicetify?.Playbar?.Button ||
    !document.body
  )
    await new Promise((r) => setTimeout(r, 300));
  if (document.getElementById("luma-root")) return;
  const player = () => globalThis.Spicetify.Player;
  let options = {
    size: 36,
    dim: 0.4,
    estimated: false,
    desktop: false,
    sliderStyle: "bar",
    vinyl: false,
  };
  try {
    options = {
      ...options,
      ...JSON.parse(localStorage.getItem("luma-settings") || "{}"),
    };
  } catch {}
  const save = () => {
    try {
      localStorage.setItem("luma-settings", JSON.stringify(options));
    } catch {}
  };
  const style = document.createElement("style");
  style.textContent =
    "\n#luma-root{position:fixed;inset:0;z-index:999999;background:#151517;color:#fff;font-family:'Segoe UI',sans-serif;overflow:hidden;--lyric-size:36px;--dim:.4}\n#luma-root[hidden],#luma-root [hidden]{display:none!important}\n#luma-root *{box-sizing:border-box}\n#luma-root .backdrop{position:absolute;inset:-100px;background:center/cover;filter:blur(85px) saturate(1.5);opacity:.8;transform:scale(1.1);pointer-events:none}\n#luma-root .shade{position:absolute;inset:0;background:rgba(0,0,0,var(--dim));pointer-events:none}\n#luma-root .bar{position:absolute;inset:20px 25px auto;display:flex;align-items:center;gap:10px;z-index:3}\n#luma-root button{font:inherit;color:inherit;cursor:pointer}\n#luma-root .tool{border:1px solid #ffffff18;border-radius:50%;width:38px;height:38px;background:#ffffff0c;display:grid;place-items:center}\n#luma-root button:hover{background:#ffffff10}\n#luma-root svg{width:20px;height:20px;fill:currentColor}\n#luma-root .status{margin-left:auto;font-size:12px;color:#ffffffa0}\n#luma-root .layout{position:relative;height:100%;padding:85px 9vw 45px;display:grid;grid-template-columns:minmax(230px,360px) minmax(0,1fr);gap:8vw;align-items:center}\n#luma-root .cover{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:13px;background:#28282b;box-shadow:0 30px 80px #0007}\n#luma-root .title{font-size:23px;font-weight:700;margin:22px 0 4px;letter-spacing:-.6px}\n#luma-root .artist{font-size:16px;color:#ffffffaa;margin-bottom:20px}\n#luma-root input[type=range]{width:100%;height:5px;accent-color:white;cursor:pointer}\n#luma-root .times{display:flex;justify-content:space-between;color:#ffffff90;font-size:12px;margin-top:6px}\n#luma-root .controls{display:flex;justify-content:center;gap:24px;margin:15px 0}\n#luma-root .controls button{background:none;border:0;padding:8px;display:grid;place-items:center}\n#luma-root .controls svg{width:29px;height:29px}\n#luma-root .controls .play svg{width:38px;height:38px}\n#luma-root .volume{display:flex;align-items:center;gap:12px;margin-top:14px;color:#ffffffa0}\n#luma-root .lyrics{position:relative;height:100%;overflow:auto;scrollbar-width:none;padding:40vh 8px;mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}\n#luma-root .line{display:block;width:100%;text-align:left;border:0;background:transparent;padding:15px 0;font-size:var(--lyric-size);font-weight:750;letter-spacing:-1px;line-height:1.35;white-space:pre-wrap;opacity:.25;transform:scale(.96);transform-origin:left;transition:transform .5s,opacity .4s}\n#luma-root .line.active{opacity:1;transform:scale(1)}\n#luma-root .line.past{opacity:.35}\n#luma-root .word{display:inline-block;white-space:pre;color:transparent;background:linear-gradient(90deg,#fff var(--fill,0%),#ffffff55 var(--fill,0%));background-clip:text;-webkit-background-clip:text}\n#luma-root .line:not(.active) .word{background:none;color:inherit}\n#luma-root .message{font-size:22px;line-height:1.6;white-space:pre-wrap;color:#ffffffc0}\n#luma-root .settings{position:absolute;right:25px;top:68px;width:300px;max-height:75vh;overflow:auto;z-index:4;padding:20px;border-radius:16px;background:#232326f5;box-shadow:0 20px 60px #0007;border:1px solid #ffffff15}\n#luma-root .settings h2{margin:0 0 15px;font-size:18px}\n#luma-root .settings label{display:block;margin:16px 0;font-size:13px;line-height:1.5}\n#luma-root .settings small{display:block;color:#ffffff90;margin-top:6px;line-height:1.5}\n#luma-root .settings button{border:1px solid #ffffff20;background:#ffffff0c;border-radius:8px;padding:8px 12px;margin:3px}\n@media(max-width:760px){#luma-root .layout{padding:78px 25px 25px;gap:25px;grid-template-columns:minmax(170px,1fr) minmax(0,1.2fr)}#luma-root .line{font-size:26px}#luma-root .status{font-size:10px}}\n@media(prefers-reduced-motion:reduce){#luma-root .line{transition:none;transform:none}}\n";
  document.head.append(style);
  const desktop = document.createElement("style");
  desktop.textContent =
    ':root{--spice-main:#1c1c1e;--spice-sidebar:#161617;--spice-player:#1c1c1e;--spice-card:#2c2c2e;--spice-button:#fa233b;--spice-button-active:#ff375f}.Root__main-view,.Root__nav-bar,.main-card-card{border-radius:12px!important}.main-nowPlayingBar-nowPlayingBar{background:#1c1c1e!important}button[data-testid="play-button"]{background:#fa233b!important;color:#fff!important}';
  document.head.append(desktop);
  const paths = {
    close: "M6 6l12 12M18 6 6 18",
    full: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
    settings: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6",
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
 <div class="layout"><div><img class="cover" alt="Album artwork"><div class="title">Nothing playing</div><div class="artist"></div><input class="seek" type="range" min="0" max="1000" value="0" aria-label="Playback position"><div class="times"><span class="elapsed">0:00</span><span class="duration">0:00</span></div><div class="controls"><button data-action="previous" aria-label="Previous">${icons.previous}</button><button class="play" data-action="play" aria-label="Play or pause">${icons.play}</button><button data-action="next" aria-label="Next">${icons.next}</button></div><label class="volume">${svg("M3 9h4l5-4v14l-5-4H3z")}<input type="range" class="vol" min="0" max="1" step=".01" aria-label="Volume"></label></div><div class="lyrics" tabindex="0" aria-label="Lyrics"></div></div>
 <div class="settings" hidden><h2>Luma settings</h2><label>Lyric size<input class="size" type="range" min="24" max="52" step="1"></label><label>Background darkness<input class="darkness" type="range" min=".15" max=".8" step=".05"></label><label><input type="checkbox" class="estimated"> Estimated word animation<small>Approximate visual effect, not singer-aligned word timing.</small></label><label><input type="checkbox" class="desktop"> Apple-inspired desktop colors<small>Optional; can conflict with other themes.</small></label><button data-action="import">Import LRC</button><button data-action="retry">Retry lyrics</button><small>LRCLIB receives song title, artist, album and duration. Imported files stay local. Word timestamps require Enhanced LRC.</small></div><input class="file" type="file" accept=".lrc,text/plain" hidden>`;
  document.body.append(root);
  const q = (s) => root.querySelector(s),
    pane = q(".lyrics");
  const cover = q(".cover"),
    artworkStage = document.createElement("div");
  artworkStage.className = "artwork-stage";
  cover.before(artworkStage);
  artworkStage.append(cover);
  q(".settings h2").insertAdjacentHTML(
    "afterend",
    '<label>Player slider style<select class="slider-style"><option value="bar">Bar</option><option value="wavy">Wavy</option><option value="slim">Slim</option><option value="squiggly">Squiggly</option></select></label><label><input type="checkbox" class="vinyl"> Spinning vinyl artwork<small>Turn the album cover into a record while music is playing.</small></label>',
  );
  let key = null,
    lines = [],
    active = -1,
    token = 0,
    controller = null,
    previousFocus = null,
    scrollUntil = 0,
    centerFrame = 0,
    lastFetch = 0,
    cooldown = 0,
    busy = Promise.resolve();
  const cache = new Map(),
    imports = new Map();
  const fmt = (ms) => {
    const n = Math.max(0, Math.floor((ms || 0) / 1000));
    return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  };
  const note = (text) => {
    lines = [];
    active = -1;
    pane.replaceChildren();
    const n = document.createElement("div");
    n.className = "message";
    n.textContent = text;
    pane.append(n);
  };
  function applySettings() {
    root.style.setProperty("--lyric-size", Number(options.size) + "px");
    root.style.setProperty("--dim", Number(options.dim));
    if (!["bar", "wavy", "slim", "squiggly"].includes(options.sliderStyle))
      options.sliderStyle = "bar";
    root.dataset.sliderStyle = options.sliderStyle;
    root.classList.toggle("vinyl", Boolean(options.vinyl));
    desktop.disabled = !options.desktop;
    q(".size").value = options.size;
    q(".darkness").value = options.dim;
    q(".slider-style").value = options.sliderStyle;
    q(".vinyl").checked = options.vinyl;
    q(".estimated").checked = options.estimated;
    q(".desktop").checked = options.desktop;
  }
  applySettings();
  function parse(text) {
    const offset = Number(text.match(/\[offset:([+-]?\d+)\]/i)?.[1] || 0),
      result = [];
    for (const row of text.split(/\r?\n/)) {
      const tags = [...row.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
      if (!tags.length) continue;
      const body = row.replace(/\[[^\]]*\]/g, "");
      const words = [...body.matchAll(/<(\d+):(\d+(?:\.\d+)?)>([^<]*)/g)].map(
        (t) => ({ ms: (+t[1] * 60 + +t[2]) * 1000 + offset, text: t[3] }),
      );
      const first = (+tags[0][1] * 60 + +tags[0][2]) * 1000 + offset;
      for (const t of tags) {
        const ms = (+t[1] * 60 + +t[2]) * 1000 + offset;
        result.push({
          ms: Math.max(0, ms),
          text: body.replace(/<\d+:\d+(?:\.\d+)?>/g, "").trim() || "♪",
          words: words.map((w) => ({
            ...w,
            ms: Math.max(0, w.ms + ms - first),
          })),
          exact: words.some((w) => w.text.trim()),
        });
      }
    }
    return result.sort((a, b) => a.ms - b.ms);
  }
  function render() {
    active = -1;
    pane.replaceChildren();
    const duration = player().getDuration() || 0;
    const source = imports.has(key) ? "Local LRC" : "LRCLIB";
    q(".status").textContent =
      source +
      " · " +
      (lines.some((l) => l.exact)
        ? "word timestamps"
        : options.estimated
          ? "estimated words"
          : "line sync");
    lines.forEach((line, i) => {
      line.end = lines[i + 1]?.ms || duration || line.ms + 4000;
      line.display = line.exact ? line.words : [];
      if (!line.exact && options.estimated) {
        const words = line.text.match(/\S+\s*/g) || [line.text];
        const total = words.reduce((s, w) => s + w.trim().length, 0) || 1;
        let used = 0;
        line.display = words.map((text) => {
          const ms = line.ms + (Math.max(0, line.end - line.ms) * used) / total;
          used += text.trim().length;
          return { ms, text };
        });
      }
      const b = document.createElement("button");
      b.className = "line";
      b.onclick = () => player().seek(line.ms);
      if (line.display.length) {
        for (const w of line.display) {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = w.text;
          b.append(span);
        }
      } else b.textContent = line.text;
      pane.append(b);
    });
  }
  function show(record) {
    if (record.instrumental) {
      note("Instrumental — no lyrics.");
      return;
    }
    lines = record.syncedLyrics ? parse(record.syncedLyrics) : [];
    if (lines.length) render();
    else
      note(
        record.plainLyrics
          ? "Unsynchronized lyrics\n\n" + record.plainLyrics
          : "No lyrics found for this recording.",
      );
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
      q(".cover").src = art;
      q(".backdrop").style.backgroundImage = `url(${JSON.stringify(art)})`;
    } else {
      q(".cover").removeAttribute("src");
      q(".backdrop").style.backgroundImage = "none";
    }
    if (!m.title || !m.artist_name) {
      note("Play a music track to load lyrics.");
      return;
    }
    if (item?.uri?.startsWith("spotify:episode:")) {
      note("Lyrics are available for music tracks.");
      return;
    }
    if (imports.has(key)) {
      show(imports.get(key));
      return;
    }
    if (!force && cache.has(key)) {
      show(cache.get(key));
      return;
    }
    note("Loading lyrics…");
    q(".status").textContent = "LRCLIB · loading";
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
        throw Error("Lyrics service is busy. Retry in a minute.");
      lastFetch = Date.now();
      const timer = setTimeout(() => c.abort(), 15000);
      let response;
      try {
        response = await fetch("https://lrclib.net/api/get?" + params, {
          credentials: "omit",
          signal: c.signal,
          headers: {
            "Lrclib-Client":
              "LumaLyrics/0.2.0-beta.1 (Spicetify independent extension)",
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
          throw Error("Lyrics service is busy. Retry later.");
        }
        if (response.status === 404)
          throw Error("No matching lyrics. Try importing an LRC file.");
        if (!response.ok)
          throw Error("Lyrics service error " + response.status);
        const record = await response.json();
        cache.set(current, record);
        if (cache.size > 50) cache.delete(cache.keys().next().value);
        if (id === token) show(record);
      } finally {
        clearTimeout(timer);
      }
    };
    const pending = busy.then(job);
    busy = pending.catch(() => {});
    try {
      await pending;
    } catch (e) {
      if (id === token)
        note(
          e.name === "AbortError"
            ? "Request timed out. Open settings to retry."
            : "Could not load lyrics.\n" + e.message,
        );
    }
  }
  function center(index) {
    if (index < 0 || Date.now() < scrollUntil) return;
    const el = pane.children[index];
    if (!el) return;
    const target = el.offsetTop - pane.clientHeight / 2 + el.offsetHeight / 2;
    cancelAnimationFrame(centerFrame);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pane.scrollTop = target;
      return;
    }
    const start = pane.scrollTop,
      distance = target - start,
      began = performance.now(),
      duration = Math.min(720, Math.max(380, Math.abs(distance) * 0.65));
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
    scrollUntil = Date.now() + 4000;
  };
  pane.addEventListener("wheel", pauseCentering, { passive: true });
  pane.addEventListener("touchstart", pauseCentering, { passive: true });
  function tick() {
    if (root.hidden) return;
    load().catch((e) => note("Player update failed: " + e.message));
    const p = player(),
      duration = p.getDuration() || 0,
      progress = p.getProgress() || 0;
    q(".elapsed").textContent = fmt(progress);
    q(".duration").textContent = fmt(duration);
    if (document.activeElement !== q(".seek"))
      q(".seek").value = duration ? (progress / duration) * 1000 : 0;
    if (document.activeElement !== q(".vol")) q(".vol").value = p.getVolume();
    q(".seek").style.setProperty(
      "--range-progress",
      ((Number(q(".seek").value) / 1000) * 100).toFixed(1) + "%",
    );
    q(".vol").style.setProperty(
      "--range-progress",
      (Number(q(".vol").value) * 100).toFixed(1) + "%",
    );
    const playing = p.isPlaying();
    root.classList.toggle("playing", playing);
    const state = playing ? "pause" : "play";
    if (q(".play").dataset.icon !== state) {
      q(".play").innerHTML = icons[state];
      q(".play").dataset.icon = state;
    }
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].ms <= progress) index = i;
      else break;
    }
    if (index !== active) {
      active = index;
      for (let i = 0; i < lines.length; i++) {
        pane.children[i]?.classList.toggle("active", i === index);
        pane.children[i]?.classList.toggle("past", i < index);
      }
      center(index);
    }
    const line = lines[active];
    if (line)
      line.display.forEach((w, j) => {
        const end = line.display[j + 1]?.ms || line.end;
        const fraction =
          progress < w.ms
            ? 0
            : end <= w.ms
              ? 1
              : Math.max(0, Math.min(1, (progress - w.ms) / (end - w.ms)));
        pane.children[active]?.children[j]?.style.setProperty(
          "--fill",
          (fraction * 100).toFixed(1) + "%",
        );
      });
  }
  let launcher;
  async function close() {
    root.hidden = true;
    ++token;
    controller?.abort();
    q(".settings").hidden = true;
    q('[data-action="settings"]').setAttribute("aria-expanded", "false");
    if (launcher) launcher.active = false;
    if (document.fullscreenElement === root)
      await document.exitFullscreen().catch(() => {});
    previousFocus?.focus();
  }
  function open() {
    previousFocus = document.activeElement;
    root.hidden = false;
    key = null;
    scrollUntil = 0;
    launcher.active = true;
    tick();
    q('[data-action="close"]').focus();
  }
  const launchIcon =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16m4-11h2m-2 3h2m-2 3h2"/></svg>';
  launcher = new Spicetify.Playbar.Button("Luma Lyrics", launchIcon, () =>
    root.hidden ? open() : close(),
  );
  root.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    try {
      if (action === "close") await close();
      if (action === "full") {
        if (document.fullscreenElement === root)
          await document.exitFullscreen();
        else await root.requestFullscreen();
      }
      if (action === "settings") {
        q(".settings").hidden = !q(".settings").hidden;
        q('[data-action="settings"]').setAttribute(
          "aria-expanded",
          String(!q(".settings").hidden),
        );
      }
      if (action === "play") player().togglePlay();
      if (action === "previous") player().back();
      if (action === "next") player().next();
      if (action === "retry") load(true);
      if (action === "import") q(".file").click();
    } catch (e) {
      Spicetify.showNotification("Luma: " + e.message);
    }
  });
  q(".seek").onchange = (e) => player().seek(Number(e.target.value) / 1000);
  q(".vol").oninput = (e) => player().setVolume(Number(e.target.value));
  for (const [selector, field] of [
    [".size", "size"],
    [".darkness", "dim"],
    [".estimated", "estimated"],
    [".desktop", "desktop"],
    [".slider-style", "sliderStyle"],
    [".vinyl", "vinyl"],
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
      if (field === "estimated" && lines.length) render();
    });
  q(".file").onchange = async (e) => {
    const file = e.target.files[0],
      target = key;
    if (!file) return;
    try {
      if (file.size > 2000000) throw Error("LRC file is too large.");
      const text = await file.text();
      if (!parse(text).length) throw Error("No valid LRC timestamps found.");
      imports.set(target, { syncedLyrics: text });
      if (imports.size > 30) imports.delete(imports.keys().next().value);
      if (target === key) {
        ++token;
        controller?.abort();
        show(imports.get(target));
      }
    } catch (err) {
      Spicetify.showNotification("Luma: " + err.message);
    }
    e.target.value = "";
  };
  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (!q(".settings").hidden) {
        q(".settings").hidden = true;
        q('[data-action="settings"]').setAttribute("aria-expanded", "false");
        q('[data-action="settings"]').focus();
      } else close();
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
  const polish = document.createElement("style");
  polish.textContent =
    '@property --luma-word-fill{syntax:"<percentage>";inherits:false;initial-value:0%}#luma-root .bar{top:56px;justify-content:flex-end}#luma-root .bar .status{order:0;margin-left:0}#luma-root .bar [data-action=settings]{order:1}#luma-root .bar [data-action=full]{order:2}#luma-root .bar [data-action=close]{order:3}#luma-root .settings{top:104px}#luma-root .lyrics{scroll-behavior:auto;overscroll-behavior:contain}#luma-root .line{transition:transform .65s cubic-bezier(.22,1,.36,1),opacity .65s ease,filter .65s ease;text-shadow:0 0 0 transparent}#luma-root .line:not(.active){filter:blur(.35px)}#luma-root .line.active{transform:translateX(5px) scale(1);text-shadow:0 8px 32px #ffffff20}#luma-root .word{--luma-word-fill:var(--fill,0%);background:linear-gradient(90deg,#fff var(--luma-word-fill),#ffffff55 var(--luma-word-fill));transition:--luma-word-fill 140ms cubic-bezier(.22,1,.36,1)}@media(max-width:500px){#luma-root .bar .status{display:none}}@media(prefers-reduced-motion:reduce){#luma-root .line,#luma-root .word{transition:none}#luma-root .line:not(.active){filter:none}#luma-root .line.active{text-shadow:none;transform:none}}';
  document.head.append(polish);
  const appearance = document.createElement("style");
  appearance.textContent =
    '#luma-root .tool{width:42px;height:42px;border-color:#ffffff24;backdrop-filter:blur(16px);transition:background .2s,border-color .2s,transform .2s}#luma-root .tool:hover{background:#ffffff20;border-color:#ffffff50;transform:translateY(-1px)}#luma-root .artwork-stage{position:relative;width:100%;aspect-ratio:1;border-radius:13px}#luma-root .cover{height:100%}#luma-root.vinyl .artwork-stage{overflow:hidden;border-radius:50%;background:radial-gradient(circle,#242428 0 2%,#0d0d0f 2.3% 5%,#222226 5.3% 5.8%,#111113 6% 100%);box-shadow:0 28px 70px #0009}#luma-root.vinyl .artwork-stage:before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at center,transparent 0 3px,#ffffff12 3.5px,#0008 4px,#0000 4.5px 7px);pointer-events:none}#luma-root.vinyl .artwork-stage:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;border:2px solid #ffffffb0;border-radius:50%;background:#111;transform:translate(-50%,-50%);box-shadow:0 0 0 3px #0008;pointer-events:none}#luma-root.vinyl .cover{position:absolute;left:18%;top:18%;width:64%;height:64%;border:3px solid #111;border-radius:50%;box-shadow:0 2px 14px #0009}#luma-root.vinyl.playing .artwork-stage{animation:luma-vinyl-spin 5s linear infinite}@keyframes luma-vinyl-spin{to{transform:rotate(360deg)}}#luma-root input[type=range]{--range-color:#fff;appearance:none;-webkit-appearance:none;width:100%;height:20px;margin:0;background:transparent;cursor:pointer}#luma-root input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]::-moz-range-thumb{width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root input[type=range]:hover::-moz-range-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root[data-slider-style=glow] input[type=range]{--range-color:#b9a3ff}#luma-root[data-slider-style=glow] input[type=range]::-webkit-slider-runnable-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=glow] input[type=range]::-moz-range-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-runnable-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-5px;background:#fff;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-thumb{width:9px;height:9px;background:#fff;box-shadow:none}#luma-root .controls button{width:46px;height:46px;border-radius:50%;color:#ffffffc0;transition:background .2s,color .2s,transform .2s}#luma-root .controls button:hover{background:#ffffff16;color:#fff;transform:scale(1.06)}#luma-root .controls .play{width:58px;height:58px;background:#ffffffed;color:#171719;box-shadow:0 6px 24px #0004}#luma-root .controls .play:hover{background:#fff;transform:scale(1.07)}#luma-root .controls .play svg{width:30px;height:30px}#luma-root .settings select{display:block;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff0c;color:#fff;font:inherit}#luma-root .settings select option{background:#232326;color:#fff}#luma-root .settings input[type=checkbox]{accent-color:#b9a3ff}@media(prefers-reduced-motion:reduce){#luma-root.vinyl.playing .artwork-stage{animation:none}}';
  appearance.textContent +=
    "#luma-root input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,var(--range-color) var(--range-progress,0%),#ffffff3a var(--range-progress,0%))}#luma-root input[type=range]::-moz-range-track{background:linear-gradient(90deg,var(--range-color) var(--range-progress,0%),#ffffff3a var(--range-progress,0%))}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-runnable-track{background:linear-gradient(90deg,#fff var(--range-progress,0%),#ffffff40 var(--range-progress,0%))}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-track{background:linear-gradient(90deg,#fff var(--range-progress,0%),#ffffff40 var(--range-progress,0%))}";
  appearance.textContent +=
    "#luma-root[data-slider-style=bar] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=bar] input[type=range]::-moz-range-track{height:8px;border-radius:99px}#luma-root[data-slider-style=bar] input[type=range]::-webkit-slider-thumb{width:16px;height:16px;margin-top:-4px}#luma-root[data-slider-style=bar] input[type=range]::-moz-range-thumb{width:12px;height:12px}#luma-root[data-slider-style=wavy] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=wavy] input[type=range]::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 10%,8% 0,12% 10%,16% 50%,20% 90%,24% 100%,28% 90%,32% 50%,36% 10%,40% 0,44% 10%,48% 50%,52% 90%,56% 100%,60% 90%,64% 50%,68% 10%,72% 0,76% 10%,80% 50%,84% 90%,88% 100%,92% 90%,96% 50%,100% 10%)}#luma-root[data-slider-style=wavy] input[type=range]::-webkit-slider-thumb{width:14px;height:14px;margin-top:-2px}#luma-root[data-slider-style=wavy] input[type=range]::-moz-range-thumb{width:10px;height:10px}#luma-root[data-slider-style=slim] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=slim] input[type=range]::-moz-range-track{height:2px;border-radius:99px}#luma-root[data-slider-style=slim] input[type=range]::-webkit-slider-thumb{width:12px;height:12px;margin-top:-5px}#luma-root[data-slider-style=slim] input[type=range]::-moz-range-thumb{width:8px;height:8px}#luma-root[data-slider-style=squiggly] input[type=range]::-webkit-slider-runnable-track,#luma-root[data-slider-style=squiggly] input[type=range]::-moz-range-track{height:10px;border-radius:0;clip-path:polygon(0 50%,4% 0,8% 50%,12% 100%,16% 50%,20% 0,24% 50%,28% 100%,32% 50%,36% 0,40% 50%,44% 100%,48% 50%,52% 0,56% 50%,60% 100%,64% 50%,68% 0,72% 50%,76% 100%,80% 50%,84% 0,88% 50%,92% 100%,96% 50%,100% 0);mask-image:repeating-linear-gradient(90deg,#000 0 7px,transparent 7px 11px)}#luma-root[data-slider-style=squiggly] input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-2px}#luma-root[data-slider-style=squiggly] input[type=range]::-moz-range-thumb{width:9px;height:9px}";
  document.head.append(appearance);
  setInterval(() => {
    try {
      tick();
    } catch (e) {
      console.error("[Luma Lyrics]", e);
    }
  }, 50);
})();
