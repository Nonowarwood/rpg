// ============================================================
// STATS SCREEN — the 8 RPG attributes, each with its own
// independent level and progress bar.
// ============================================================

import { STATS } from "../core/config.js";
import { statProgress } from "../systems/statsSystem.js";
import { setBarWidth } from "./animations.js";

const gridEl = document.getElementById("stat-grid");

export function renderStatsScreen() {
  gridEl.innerHTML = Object.entries(STATS)
    .map(([key, def]) => {
      const p = statProgress(key);
      return `
        <div class="stat-card">
          <div class="stat-card__icon">${def.icon}</div>
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
