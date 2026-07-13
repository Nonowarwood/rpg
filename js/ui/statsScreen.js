// ============================================================
// STATS SCREEN — the 8 RPG attributes, each with its own
// independent level and progress bar, plus the Mii avatar panel.
// ============================================================

import { state } from "../core/state.js";
import { STATS } from "../core/config.js";
import { statProgress } from "../systems/statsSystem.js";
import { setBarWidth } from "./animations.js";
import { icon } from "./icons.js";

const gridEl = document.getElementById("stat-grid");

// ---------- Mii avatar (real image assets, never code-drawn) ----------
// The user exports renders from Nintendo's Mii Studio (code-generated
// avatars were rejected — see CLAUDE.md). Variants are picked by game
// state, first match wins; a variant only participates once its file
// exists, so dropping a new PNG in assets/avatar/ is all it takes.
const wantsGlasses = () => state.stats.intelligence.level >= 5;
// Pyjama in the morning and late evening, day clothes in between.
const isPyjamaTime = () => {
  const h = new Date().getHours();
  return h < 12 || h >= 22;
};

const AVATAR_VARIANTS = [
  { src: "assets/avatar/mii-jour-lunettes.png", when: () => !isPyjamaTime() && wantsGlasses() },
  { src: "assets/avatar/mii-jour.png", when: () => !isPyjamaTime() },
  { src: "assets/avatar/mii-lunettes.png", when: wantsGlasses },
  { src: "assets/avatar/mii.png", when: () => true },
];

const figureEl = document.getElementById("character-figure");
const panelEl = figureEl.closest(".character-panel");
const auraEl = document.getElementById("character-aura");
const gearEl = document.getElementById("character-gear");
const imgEl = new Image();
imgEl.alt = "Ton Mii";
imgEl.className = "character-art";
panelEl.hidden = true;

// Probe each variant once; re-render the panel as results come in.
AVATAR_VARIANTS.forEach((v) => {
  const probe = new Image();
  probe.onload = () => {
    v.available = true;
    renderAvatarPanel();
  };
  probe.src = v.src;
});

function renderAvatarPanel() {
  const variant = AVATAR_VARIANTS.find((v) => v.available && v.when());
  if (!variant) {
    panelEl.hidden = true;
    return;
  }
  if (imgEl.getAttribute("src") !== variant.src) imgEl.src = variant.src;
  if (!imgEl.isConnected) figureEl.replaceChildren(imgEl);
  panelEl.hidden = false;

  // Aura behind the Mii: intensity follows the player level.
  auraEl.style.opacity = Math.min(0.15 + state.level * 0.03, 0.85).toFixed(2);

  // Equipment row: one diamond per attribute. The color climbs a
  // rank ladder as the stat advances: bronze (3+), argent (5+),
  // or (8+), diamant (12+).
  gearEl.innerHTML = Object.entries(STATS)
    .map(([key, def]) => {
      const level = state.stats[key].level;
      const tier = level >= 12 ? 4 : level >= 8 ? 3 : level >= 5 ? 2 : level >= 3 ? 1 : 0;
      return `
        <span class="gear-slot gear-slot--t${tier}" title="${def.name} · Niveau ${level}">
          ${icon(def.icon, { size: 15 })}
        </span>
      `;
    })
    .join("");
}

// The pyjama/day-clothes switch depends on the clock, not on game
// events — re-check periodically so the outfit flips at noon even
// if the user never completes a quest.
setInterval(renderAvatarPanel, 5 * 60 * 1000);

export function renderStatsScreen() {
  renderAvatarPanel();

  gridEl.innerHTML = Object.entries(STATS)
    .map(([key, def]) => {
      const p = statProgress(key);
      return `
        <div class="stat-card">
          <div class="stat-card__icon">${icon(def.icon, { size: 22 })}</div>
          <div class="stat-card__body">
            <div class="stat-card__top">
              <span class="stat-card__name">${def.name}</span>
              <span class="stat-card__level">Niveau ${p.level}</span>
            </div>
            <div class="stat-card__bar"><div class="stat-card__bar-fill" data-stat="${key}" style="width:0%"></div></div>
          </div>
        </div>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    Object.keys(STATS).forEach((key) => {
      const p = statProgress(key);
      setBarWidth(gridEl.querySelector(`[data-stat="${key}"]`), p.percent);
    });
  });
}
