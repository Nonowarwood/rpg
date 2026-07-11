// ============================================================
// ACHIEVEMENTS SCREEN — full catalogue grid, locked vs unlocked.
// ============================================================

import { state } from "../core/state.js";
import { ACHIEVEMENTS } from "../data/defaultData.js";
import { isUnlocked } from "../systems/achievementSystem.js";
import { icon } from "./icons.js";

const gridEl = document.getElementById("achievement-grid");
const countEl = document.getElementById("achievements-count");

export function renderAchievementsScreen() {
  countEl.textContent = `${state.achievements.unlockedIds.length} / ${ACHIEVEMENTS.length}`;

  gridEl.innerHTML = ACHIEVEMENTS.map((a) => {
    const unlocked = isUnlocked(a.id);
    return `
      <div class="achievement-badge${unlocked ? " achievement-badge--unlocked" : ""}">
        <div class="achievement-badge__icon">${icon(a.icon, { size: 30 })}</div>
        <div class="achievement-badge__name">${a.name}</div>
        <div class="achievement-badge__desc">${a.desc}</div>
      </div>
    `;
  }).join("");
}
