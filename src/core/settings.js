export const defaultOptions = {
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

export function loadSettings(storage) {
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
      (storage ?? globalThis.localStorage).setItem(
        "luma-settings",
        JSON.stringify(options),
      );
    } catch (error) {
      console.warn(
        "[Luma Lyrics] Could not remove the retired slider preference.",
        error,
      );
    }
  }

  return { options, migratedDefaultDim };
}

export function saveSettings(options, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(
      "luma-settings",
      JSON.stringify(options),
    );
  } catch {}
}
