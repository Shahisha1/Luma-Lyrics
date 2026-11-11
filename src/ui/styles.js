// Overlay and Spotify styles live here so visual changes stay separate from
// player state, lyric timing, and event handling.

export function installStyles(document) {
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
    '#luma-root .tool{width:42px;height:42px;border-color:#ffffff24;backdrop-filter:blur(16px);transition:background .2s,border-color .2s,transform .2s}#luma-root .tool:hover{background:#ffffff20;border-color:#ffffff50;transform:translateY(-1px)}#luma-root .artwork-stage{position:relative;width:100%;aspect-ratio:1;border-radius:13px}#luma-root .cover{height:100%}#luma-root.vinyl .artwork-stage{overflow:hidden;border-radius:50%;background:radial-gradient(circle,#242428 0 2%,#0d0d0f 2.3% 5%,#222226 5.3% 5.8%,#111113 6% 100%);box-shadow:0 28px 70px #0009}#luma-root.vinyl .artwork-stage:before{content:"";position:absolute;inset:0;border-radius:50%;background:repeating-radial-gradient(circle at center,transparent 0 3px,#ffffff12 3.5px,#0008 4px,#0000 4.5px 7px);pointer-events:none}#luma-root.vinyl .artwork-stage:after{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;border:2px solid #ffffffb0;border-radius:50%;background:#111;transform:translate(-50%,-50%);box-shadow:0 0 0 3px #0008;pointer-events:none}#luma-root.vinyl .cover{position:absolute;left:18%;top:18%;width:64%;height:64%;border:3px solid #111;border-radius:50%;box-shadow:0 2px 14px #0009}#luma-root.vinyl.playing .artwork-stage{animation:luma-vinyl-spin 5s linear infinite}@keyframes luma-vinyl-spin{to{transform:rotate(360deg)}}#luma-root input[type=range]{--range-color:#fff;appearance:none;-webkit-appearance:none;width:100%;height:20px;margin:0;background:transparent;cursor:pointer}#luma-root input[type=range]::-webkit-slider-runnable-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-moz-range-track{height:5px;border-radius:99px;background:linear-gradient(90deg,var(--range-color),#ffffff3a);box-shadow:inset 0 0 0 1px #ffffff12}#luma-root input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;margin-top:-5px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]::-moz-range-thumb{width:11px;height:11px;border:2px solid #fff;border-radius:50%;background:var(--range-color);box-shadow:0 1px 8px #0008;transition:transform .15s,box-shadow .15s}#luma-root input[type=range]:hover::-webkit-slider-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root input[type=range]:hover::-moz-range-thumb{transform:scale(1.2);box-shadow:0 0 0 5px #ffffff20}#luma-root[data-slider-style=glow] input[type=range]{--range-color:#b9a3ff}#luma-root[data-slider-style=glow] input[type=range]::-webkit-slider-runnable-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=glow] input[type=range]::-moz-range-track{box-shadow:0 0 12px #a78bfa80}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-runnable-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-track{height:3px;background:#ffffff70;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-webkit-slider-thumb{width:13px;height:13px;margin-top:-5px;background:#fff;box-shadow:none}#luma-root[data-slider-style=minimal] input[type=range]::-moz-range-thumb{width:9px;height:9px;background:#fff;box-shadow:none}#luma-root .controls button{width:46px;height:46px;border-radius:50%;color:#ffffffc0;transition:background .2s,color .2s,transform .2s}#luma-root .controls button:hover{background:#ffffff16;color:#fff;transform:scale(1.06)}#luma-root .controls .play{width:58px;height:58px;background:#ffffffed;color:#171719;box-shadow:0 6px 24px #0004}#luma-root .controls .play:hover{background:#fff;transform:scale(1.07)}#luma-root .controls .play svg{width:30px;height:30px}#luma-root .settings select{display:block;width:100%;margin-top:8px;padding:10px 12px;border:1px solid #ffffff20;border-radius:10px;background:#ffffff0c;color:#fff;font:inherit}#luma-root .settings select option{background:#232326;color:#fff}#luma-root .settings input[type=checkbox]{accent-color:#b9a3ff}@media(prefers-reduced-motion:reduce){#luma-root.vinyl.playing .artwork-stage{animation:none}}';
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
  appearance.textContent += `
/* Luma's listening-room direction: editorial, quiet, and artwork-led. */
#luma-root{
  --ink:#10120f;--paper:#f1f0e9;--muted:rgba(241,240,233,.58);
  --rule:rgba(241,240,233,.16);--accent:var(--luma-primary,#c4d36a);
  background:var(--ink);color:var(--paper);
  font-family:Inter,"Helvetica Neue",Arial,sans-serif;
}
#luma-root .backdrop{inset:-8%;filter:blur(100px) saturate(.72);opacity:.28;transform:scale(1.08)}
#luma-root .shade{background:linear-gradient(90deg,rgba(8,10,8,.86),rgba(8,10,8,.72) 48%,rgba(8,10,8,.84))}
#luma-root .bar{inset:30px 4.5vw auto;gap:8px}
#luma-root .bar:before{content:"LUMA  /  LYRICS";margin-right:auto;color:rgba(241,240,233,.72);font-size:10px;font-weight:700;letter-spacing:.22em}
#luma-root .status{order:0;margin:0 18px 0 0;color:var(--muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}
#luma-root .tool{width:36px;height:36px;border:1px solid var(--rule);border-radius:2px;background:transparent;color:var(--paper);box-shadow:none;backdrop-filter:none;transition:background .18s,color .18s,border-color .18s}
#luma-root .tool:hover{transform:none;background:var(--paper);color:var(--ink);border-color:var(--paper)}
#luma-root .layout{grid-template-columns:minmax(240px,310px) minmax(0,1fr);gap:clamp(48px,9vw,150px);padding:112px clamp(30px,9vw,150px) 56px;align-items:center}
#luma-root .player{position:relative;padding:0;border:0;border-radius:0;background:transparent;box-shadow:none;backdrop-filter:none;min-width:0}
#luma-root .player:before{content:"NOW PLAYING";display:block;margin:0 0 14px;color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.2em}
#luma-root .artwork-stage{margin:0 0 26px!important;border-radius:2px!important;overflow:hidden;box-shadow:0 22px 55px rgba(0,0,0,.35)}
#luma-root .cover{border-radius:2px!important;box-shadow:none!important}
#luma-root.vinyl .artwork-stage{border-radius:50%!important}
#luma-root .title{margin:0 0 6px;font-size:clamp(20px,2vw,27px);font-weight:650;line-height:1.12;letter-spacing:-.045em;color:var(--paper)}
#luma-root .artist{margin:0 0 22px;color:var(--muted);font-size:13px;letter-spacing:.015em}
#luma-root .player .seek{height:18px}
#luma-root .player .seek::-webkit-slider-runnable-track{height:2px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(241,240,233,.24) var(--range-progress,0%));box-shadow:none}
#luma-root .player .seek::-moz-range-track{height:2px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(241,240,233,.24) var(--range-progress,0%));box-shadow:none}
#luma-root .player .seek::-webkit-slider-thumb{width:9px;height:9px;margin-top:-3px;border:0;background:var(--accent);box-shadow:none}
#luma-root .player .seek::-moz-range-thumb{width:9px;height:9px;border:0;background:var(--accent);box-shadow:none}
#luma-root .times{margin-top:0;color:var(--muted);font-size:10px;letter-spacing:.04em}
#luma-root .controls{justify-content:flex-start;gap:18px;margin:14px 0 8px}
#luma-root .controls button{width:34px;height:34px;color:rgba(241,240,233,.78);border-radius:2px}
#luma-root .controls button:not(.play):hover{background:rgba(241,240,233,.1);color:var(--paper);transform:none}
#luma-root .controls button:not(.play) svg{width:19px;height:19px}
#luma-root .controls .play{width:36px;height:36px;color:var(--ink);background:var(--accent)!important;border-radius:2px;box-shadow:none!important}
#luma-root .controls .play:hover{background:var(--paper)!important;color:var(--ink);transform:none}
#luma-root .controls .play svg{width:18px;height:18px}
#luma-root .volume{max-width:210px;margin-top:14px;color:var(--muted)}
#luma-root .volume input[type=range]::-webkit-slider-runnable-track{height:2px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(241,240,233,.2) var(--range-progress,0%))}
#luma-root .volume input[type=range]::-moz-range-track{height:2px;background:linear-gradient(90deg,var(--accent) var(--range-progress,0%),rgba(241,240,233,.2) var(--range-progress,0%))}
#luma-root .volume input[type=range]::-webkit-slider-thumb{width:8px;height:8px;margin-top:-3px;background:var(--accent);border:0;box-shadow:none}
#luma-root .volume input[type=range]::-moz-range-thumb{width:8px;height:8px;background:var(--accent);border:0;box-shadow:none}
#luma-root .lyrics{height:100%;padding:35vh 0;mask-image:linear-gradient(transparent,#000 13%,#000 87%,transparent);scroll-padding-block:38vh}
#luma-root .lyrics:before{content:"LYRICS  /  LIVE";display:block;position:sticky;top:0;margin:0 0 28px;color:var(--muted);font-size:9px;font-weight:700;letter-spacing:.2em}
#luma-root .line{padding:10px 0;font-size:clamp(29px,var(--lyric-size),58px);font-weight:620;letter-spacing:-.055em;line-height:1.16;opacity:.2;transform:none;filter:none;text-shadow:none;transition:opacity .45s ease,color .45s ease}
#luma-root .line.past{opacity:.34}
#luma-root .line.active{opacity:1;transform:none;color:var(--paper);text-shadow:none}
#luma-root .lyrics .line .luma-lyric-token{color:rgba(241,240,233,.42)!important;-webkit-text-fill-color:rgba(241,240,233,.42)!important;font-weight:inherit;transition:color .18s ease,text-shadow .18s ease}
#luma-root .lyrics .line .luma-lyric-token.active{color:var(--accent)!important;-webkit-text-fill-color:var(--accent)!important;font-weight:inherit;text-shadow:none;transform:none}
#luma-root .lyrics .line .luma-lyric-token.upcoming{color:rgba(241,240,233,.55)!important;-webkit-text-fill-color:rgba(241,240,233,.55)!important}
#luma-root .lyric-secondary{color:rgba(241,240,233,.54);font-size:.52em;letter-spacing:-.015em}
#luma-root .message{max-width:34rem;color:var(--muted);font-size:clamp(18px,2vw,24px);line-height:1.5}
#luma-root .retry-lyrics{margin-top:18px;padding:10px 14px;border:1px solid var(--rule);border-radius:2px;background:transparent;color:var(--paper)}
#luma-root .settings{top:82px;right:4.5vw;width:min(410px,calc(100vw - 32px));max-height:calc(100vh - 110px);padding:12px;border:1px solid var(--rule);border-radius:2px;background:rgba(16,18,15,.97);backdrop-filter:blur(22px);box-shadow:0 24px 80px rgba(0,0,0,.48)}
#luma-root .settings-header{padding:16px 16px 14px;background:transparent;border-bottom:1px solid var(--rule);backdrop-filter:none}
#luma-root .settings-eyebrow{color:var(--accent);font-size:9px;letter-spacing:.2em}
#luma-root .settings-header h2{font-size:25px;font-weight:620;letter-spacing:-.05em}
#luma-root .settings-section{margin:8px 0;padding:16px 8px;border:0;border-bottom:1px solid var(--rule);border-radius:0;background:transparent}
#luma-root .settings-section h3{color:var(--accent);font-size:9px;letter-spacing:.18em}
#luma-root .settings .setting-control,#luma-root .settings .setting-toggle{color:var(--paper)}
#luma-root .settings small,#luma-root .setting-toggle small{color:var(--muted)}
#luma-root .settings select{border:1px solid var(--rule);border-radius:2px;background:#20231d}
#luma-root .settings .settings-footer button{border:1px solid var(--rule);border-radius:2px;background:transparent;color:var(--paper);backdrop-filter:none}
#luma-root .settings .settings-footer button:last-child{border-color:var(--accent);background:var(--accent);color:var(--ink)}
#luma-root .settings .settings-footer button:hover{transform:none;background:var(--paper);color:var(--ink)}
#luma-root button:focus-visible,#luma-root input:focus-visible,#luma-root select:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
@media(max-width:900px){
  #luma-root .layout{grid-template-columns:minmax(210px,260px) minmax(0,1fr);gap:clamp(24px,5vw,54px);padding:100px 5vw 32px}
  #luma-root .player{padding:0}
}
@media(max-width:600px){
  #luma-root .bar{inset:16px 16px auto}
  #luma-root .bar:before{font-size:9px;letter-spacing:.16em}
  #luma-root .status{display:none}
  #luma-root .layout{display:flex;flex-direction:column;align-items:stretch;gap:22px;overflow:auto;padding:78px 22px 26px}
  #luma-root .player{display:grid;grid-template-columns:76px minmax(0,1fr);column-gap:14px;align-items:center}
  #luma-root .player:before{grid-column:1/-1;margin-bottom:10px}
  #luma-root .artwork-stage,#luma-root.vinyl .artwork-stage{grid-column:1;grid-row:2/ span 3;width:76px;height:76px;margin:0!important}
  #luma-root .player .title,#luma-root .player .artist{grid-column:2}
  #luma-root .player .title{align-self:end;font-size:17px}
  #luma-root .player .artist{align-self:start;margin:2px 0 0;font-size:12px}
  #luma-root .player .seek,#luma-root .times,#luma-root .controls,#luma-root .volume{grid-column:1/-1}
  #luma-root .player .seek{margin-top:14px}
  #luma-root .controls{justify-content:center;margin:5px 0}
  #luma-root .volume{max-width:none}
  #luma-root .lyrics{min-height:44vh;height:auto;padding:14vh 0 24vh;mask-image:linear-gradient(transparent,#000 8%,#000 92%,transparent)}
  #luma-root .lyrics:before{margin-bottom:18px}
  #luma-root .line{font-size:clamp(27px,8vw,38px);padding:8px 0}
  #luma-root .settings{top:64px;right:12px;width:calc(100vw - 24px);max-height:calc(100vh - 76px)}
}
@media(prefers-reduced-motion:reduce){
  #luma-root .line,#luma-root .lyrics .line .luma-lyric-token,#luma-root .tool,#luma-root .controls button{transition:none!important}
  #luma-root .vinyl.playing .artwork-stage{animation:none!important}
}
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
  // UI polish: clearer states, usable sync controls, and better small-screen
  // spacing. These rules are appended last so they win over earlier passes.
  const ui = document.createElement("style");
  ui.textContent = `
    #luma-root .bar{top:22px;inset-inline:24px;z-index:6}
    #luma-root .status{padding:6px 10px;border-radius:999px;background:rgba(var(--md-surface-container-rgb,.2),.5);color:var(--md-on-surface-variant,#ffffffa8);font-size:11px;line-height:1;white-space:nowrap;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    #luma-root .layout{grid-template-columns:minmax(300px,430px) minmax(0,1fr)!important;gap:min(5vw,60px)!important;padding:78px min(5vw,56px) 34px!important;align-items:center}
    #luma-root .player{display:flex!important;flex-direction:column;gap:14px;padding:18px!important;border-radius:28px;max-width:430px}
    #luma-root .player>.artwork-stage{width:100%}
    #luma-root .player .title{margin:0!important;font-size:26px;line-height:1.15;letter-spacing:-.6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #luma-root .player .artist{margin:4px 0 0!important;font-size:16px;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:rgba(var(--md-on-surface-variant-rgb,255,255,255),.72)}
    #luma-root .player .times,#luma-root .player .volume{display:none!important}
    #luma-root .player .controls{margin:2px 0 0!important;gap:14px}
    #luma-root .player .controls button{width:44px;height:44px}
    #luma-root .player .controls .play{width:54px;height:54px}
    /* Even bigger in fullscreen */
    #luma-root:fullscreen .layout{grid-template-columns:minmax(360px,500px) minmax(0,1fr)!important;gap:min(6vw,84px)!important}
    #luma-root:fullscreen .player{max-width:500px;padding:22px!important}
    #luma-root:fullscreen .player .title{font-size:31px}
    #luma-root:fullscreen .player .artist{font-size:18px}
    #luma-root:fullscreen .player .controls{gap:18px}
    #luma-root:fullscreen .player .controls button{width:50px;height:50px}
    #luma-root:fullscreen .player .controls .play{width:62px;height:62px}
    /* Apple Music-style lyrics */
    #luma-root .lyrics{padding:38vh 10px 42vh;overscroll-behavior:contain}
    #luma-root .line{font-weight:800;letter-spacing:-.7px;padding:12px 0;transition:transform .8s cubic-bezier(.22,1,.36,1),opacity .8s ease,filter .8s ease}
    #luma-root[data-lyric-mode=word] .line:not(.active),#luma-root[data-lyric-mode=block] .line:not(.active){opacity:.32;filter:blur(1px)}
    #luma-root[data-lyric-mode=word] .line.past,#luma-root[data-lyric-mode=block] .line.past{opacity:.42;filter:blur(.6px)}
    #luma-root[data-lyric-mode=word] .line.active,#luma-root[data-lyric-mode=block] .line.active{transform:translateX(4px) scale(1.015)}
    #luma-root[data-lyric-mode=gentle] .line.active,#luma-root[data-lyric-mode=static] .line.active{transform:none}
    /* Translated / romanized line */
    #luma-root .lyric-translation{display:block;margin-top:.18em;font-size:.6em;font-weight:600;letter-spacing:-.2px;line-height:1.3;color:#ffffff9e;white-space:pre-wrap}
    #luma-root .line.active .lyric-translation{color:#ffffffc4}
    #luma-root .message{max-width:34rem}
    #luma-root .message-actions{margin-top:14px}
    #luma-root .retry-lyrics,#luma-root .sync-adjust button{margin:0;border:1px solid rgba(var(--md-outline-rgb,255,255,255),.35);border-radius:999px;background:rgba(var(--md-secondary-container-rgb,80,80,90),.45);color:var(--md-on-secondary-container,#fff);padding:8px 12px;font-size:12px;line-height:1}
    #luma-root .retry-lyrics:hover,#luma-root .sync-adjust button:hover{background:rgba(var(--md-primary-rgb,180,160,255),.16);border-color:rgba(var(--md-primary-rgb,180,160,255),.55)}
    #luma-root .retry-lyrics:disabled{opacity:.65;cursor:default}
    #luma-root .sync-adjust{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    #luma-root .sync-adjust input[type=range]{flex:1 1 100%;min-width:0}
    #luma-root .settings .privacy-note{margin-top:10px;padding:10px 12px;border-radius:12px;background:rgba(var(--md-surface-high-rgb,50,50,58),.45);color:var(--md-on-surface-variant,#ffffff9a)}
    #luma-root .settings{top:74px;max-height:calc(100vh - 96px);z-index:7}
    #luma-root .settings select{margin-top:6px;width:100%;padding:8px 10px;border-radius:8px;border:1px solid #ffffff20;background:#ffffff0c;color:inherit;font:inherit}
    @media(max-width:760px){#luma-root .bar{top:16px;inset-inline:14px}#luma-root .status{font-size:10px;padding:5px 8px}#luma-root .player .title{font-size:22px}}
    @media(max-width:520px){#luma-root .status{max-width:46vw;overflow:hidden;text-overflow:ellipsis}#luma-root .lyrics{padding:16vh 6px 22vh}}
  `;
  ui.textContent += `
    button[data-testid="control-button-lyrics"],
    button[data-testid="lyrics-button"],
    button[aria-label="Lyrics"],
    button[aria-label="Show lyrics"]{display:none!important}
    button[aria-label="Luma Lyrics"]{box-sizing:border-box!important;display:inline-grid!important;place-items:center!important;flex:0 0 36px!important;width:36px!important;min-width:36px!important;max-width:36px!important;height:36px!important;min-height:36px!important;padding:0!important;margin:0 2px!important;overflow:visible!important;vertical-align:middle!important}
    button[aria-label="Luma Lyrics"] svg{display:block!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important;max-width:18px!important;max-height:18px!important;overflow:visible!important;flex:none!important}
  `;
  document.head.append(ui);
  return desktop;
}
