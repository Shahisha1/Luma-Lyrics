// Artwork sampling and Material 3 tonal palette generation.
export function createArtworkPalette(root, document) {
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
