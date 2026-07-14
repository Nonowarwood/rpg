// ============================================================
// HEIST TEXT — Persona 5 "ransom note" lettering. Splits a string
// into per-letter spans that jump around the baseline; some letters
// invert into white or red boxes, like P5's menu wordmarks (LoAD,
// CoNFIG). Deterministic (seeded from letter index + char code) so
// a re-render never reshuffles the letters of the same word.
// ============================================================

function escapeChar(ch) {
  return ch.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Tuned by eye: rotations stay small enough to read as punk, not
// broken; the box variants land on roughly one letter in four.
const ROTS = [-6, 4, -3, 5, -5, 2, -2, 6];
const LIFTS = [-0.06, 0.05, -0.03, 0.06, 0.02, -0.05, 0.04, -0.02];

export function heistLetters(text) {
  let letterIndex = 0;
  return [...String(text)]
    .map((ch) => {
      if (ch === " ") return `<span class="hl-space"> </span>`;
      const code = ch.toLowerCase().charCodeAt(0);
      const seed = (letterIndex * 7 + code) % 8;
      // Never box the first letter — the word stays instantly readable.
      const boxed = letterIndex > 0 && seed >= 6;
      let cls = boxed ? (seed === 7 ? "hl hl--box-red" : "hl hl--box") : "hl";
      // P5R builds its ransom titles by swapping typefaces per letter
      // (see the P5R font chart) — roughly a third of the letters leave
      // Bungee for a black grotesque or a fat serif.
      const fontSeed = (letterIndex * 3 + code) % 6;
      if (fontSeed === 4) cls += " hl--grotesque";
      else if (fontSeed === 5) cls += " hl--serif";
      letterIndex += 1;
      return `<span class="${cls}" style="transform: rotate(${ROTS[seed]}deg) translateY(${LIFTS[seed]}em)">${escapeChar(ch)}</span>`;
    })
    .join("");
}

// Boot-time hydration for static markup: any element carrying a
// data-heist attribute gets its text re-rendered as heist letters
// (same pattern as hydrateStaticIcons for data-icon).
export function hydrateHeistText() {
  document.querySelectorAll("[data-heist]").forEach((el) => {
    el.innerHTML = heistLetters(el.textContent.trim());
  });
}
