// Luma Lyrics v2.3.1 — stylesheet restored to the November 10 interface.
// The playbar compatibility rules are retained separately below.

export function installStyles(document) {
  const style = document.createElement("style");
  style.textContent = "\n#luma-root{position:fixed;inset:0;z-index:999999;background:#151517;color:#fff;font-family:'Segoe UI',sans-serif;overflow:hidden;--lyric-size:36px;--dim:.25}\n#luma-root[hidden],#luma-root [hidden]{display:none!important}\n#luma-root *{box-sizing:border-box}\n#luma-root .backdrop{position:absolute;inset:-100px;background:center/cover;filter:blur(85px) saturate(1.5);opacity:.8;transform:scale(1.1);pointer-events:none}\n#luma-root .shade{position:absolute;inset:0;background:rgba(0,0,0,var(--dim));pointer-events:none}\n#luma-root .bar{position:absolute;inset:20px 25px auto;display:flex;align-items:center;gap:10px;z-index:3}\n#luma-root button{font:inherit;color:inherit;cursor:pointer}\n#luma-root .tool{border:1px solid #ffffff18;border-radius:50%;width:38px;height:38px;background:#ffffff0c;display:grid;place-items:center}\n#luma-root button:hover{background:#ffffff10}\n#luma-root svg{width:20px;height:20px;fill:currentColor}\n#luma-root .status{margin-left:auto;font-size:12px;color:#ffffffa0}\n#luma-root .layout{position:relative;height:100%;padding:85px 9vw 45px;display:grid;grid-template-columns:minmax(230px,360px) minmax(0,1fr);gap:8vw;align-items:center}\n#luma-root .cover{display:block;width:100%;aspect-ratio:1;object-fit:cover;border-radius:13px;background:#28282b;box-shadow:0 30px 80px #0007}\n#luma-root .title{font-size:23px;font-weight:700;margin:22px 0 4px;letter-spacing:-.6px}\n#luma-root .artist{font-size:16px;color:#ffffffaa;margin-bottom:20px}\n#luma-root input[type=range]{width:100%;height:5px;accent-color:white;cursor:pointer}\n#luma-root .times{display:flex;justify-content:space-between;color:#ffffff90;font-size:12px;margin-top:6px}\n#luma-root .controls{display:flex;justify-content:center;gap:24px;margin:15px 0}\n#luma-root .controls button{background:none;border:0;padding:8px;display:grid;place-items:center}\n#luma-root .controls svg{width:29px;height:29px}\n#luma-root .controls .play svg{width:38px;height:38px}\n#luma-root .volume{display:flex;align-items:center;gap:12px;margin-top:14px;color:#ffffffa0}\n#luma-root .lyrics{position:relative;height:100%;overflow:auto;scrollbar-width:none;padding:40vh 8px;mask-image:linear-gradient(transparent,#000 12%,#000 88%,transparent)}\n#luma-root .line{display:block;width:100%;text-align:left;border:0;background:transparent;padding:15px 0;font-size:var(--lyric-size);font-weight:750;letter-spacing:-1px;line-height:1.35;white-space:pre-wrap;opacity:.25;transform:scale(.96);transform-origin:left;transition:transform .5s,opacity .4s}\n#luma-root .line.active{opacity:1;transform:scale(1)}\n#luma-root .line.past{opacity:.35}\n#luma-root .word{display:inline-block;white-space:pre;color:transparent;background:linear-gradient(90deg,#fff var(--fill,0%),#ffffff55 var(--fill,0%));background-clip:text;-webkit-background-clip:text}\n#luma-root .line:not(.active) .word{background:none;color:inherit}\n#luma-root .message{font-size:22px;line-height:1.6;white-space:pre-wrap;color:#ffffffc0}\n#luma-root .settings{position:absolute;right:25px;top:68px;width:300px;max-height:75vh;overflow:auto;z-index:4;padding:20px;border-radius:16px;background:#232326f5;box-shadow:0 20px 60px #0007;border:1px solid #ffffff15}\n#luma-root .settings h2{margin:0 0 15px;font-size:18px}\n#luma-root .settings label{display:block;margin:16px 0;font-size:13px;line-height:1.5}\n#luma-root .settings small{display:block;color:#ffffff90;margin-top:6px;line-height:1.5}\n#luma-root .settings button{border:1px solid #ffffff20;background:#ffffff0c;border-radius:8px;padding:8px 12px;margin:3px}\n@media(max-width:760px){#luma-root .layout{padding:78px 25px 25px;gap:25px;grid-template-columns:minmax(170px,1fr) minmax(0,1.2fr)}#luma-root .line{font-size:26px}#luma-root .status{font-size:10px}}\n@media(prefers-reduced-motion:reduce){#luma-root .line{transition:none;transform:none}}\n";
  document.head.append(style);

  const desktop = document.createElement("style");
  desktop.textContent = ":root{--spice-main:var(--luma-surface,#141218);--spice-sidebar:var(--luma-surface-low,#1d1b20);--spice-player:var(--luma-surface-container,#211f26);--spice-card:var(--luma-surface-high,#2b2930);--spice-button:var(--luma-primary,#d0bcff);--spice-button-active:var(--luma-primary,#d0bcff)}.Root__main-view,.Root__nav-bar,.main-card-card{border-radius:12px!important}.main-nowPlayingBar-nowPlayingBar{background:var(--luma-surface-container,#211f26)!important}button[data-testid=\"play-button\"]{background:var(--luma-primary,#d0bcff)!important;color:var(--luma-on-primary,#381e72)!important}";
  document.head.append(desktop);

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
  return desktop;
}
