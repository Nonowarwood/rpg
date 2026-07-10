// ============================================================
// PROFILE SCREEN — identity card, overview tiles, all 8 stats
// at a glance, and recent quest history.
// ============================================================

import { state, persist } from "../core/state.js";
import { STATS } from "../core/config.js";
import { xpProgress } from "../systems/xpSystem.js";
import { currentTitle } from "../systems/titleSystem.js";
import { statProgress } from "../systems/statsSystem.js";
import { setBarWidth } from "./animations.js";

const nameInput = document.getElementById("profile-name-input");

function initials(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

function formatMinutes(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${(min % 60).toString().padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function renderProfileScreen() {
  const initial = initials(state.profile.name);
  document.getElementById("profile-avatar").textContent = initial;
  document.getElementById("profile-level-badge").textContent = state.level;
  document.getElementById("profile-level-num").textContent = state.level;
  document.getElementById("profile-title").textContent = currentTitle();

  if (document.activeElement !== nameInput) nameInput.value = state.profile.name;

  const progress = xpProgress();
  document.getElementById("profile-xp-amount").textContent = `${progress.current} / ${progress.required} XP`;
  setBarWidth(document.getElementById("profile-xp-fill"), progress.percent);

  document.getElementById("profile-overview-tiles").innerHTML = `
    <div class="stat-tile"><span class="stat-tile__icon">🔥</span><span class="stat-tile__value">${state.streak.current}</span><span class="stat-tile__label">Streak actuel</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">🏅</span><span class="stat-tile__value">${state.streak.longest}</span><span class="stat-tile__label">Record streak</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">🗡️</span><span class="stat-tile__value">${state.counters.totalQuestsCompleted}</span><span class="stat-tile__label">Quêtes totales</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">⏱️</span><span class="stat-tile__value">${formatMinutes(state.meta.totalUsageMinutes)}</span><span class="stat-tile__label">Temps d'utilisation</span></div>
  `;

  document.getElementById("profile-mini-stats").innerHTML = Object.entries(STATS)
    .map(([key, def]) => {
      const p = statProgress(key);
      return `
        <div class="mini-stat">
          <span class="mini-stat__icon">${def.icon}</span>
          <span class="mini-stat__info">
            <span class="mini-stat__name">${def.name}</span>
            <span class="mini-stat__level">Niv. ${p.level}</span>
          </span>
        </div>
      `;
    })
    .join("");

  const historyEl = document.getElementById("profile-history");
  if (!state.history.length) {
    historyEl.innerHTML = `<p class="empty-state">Aucun historique pour le moment.</p>`;
  } else {
    historyEl.innerHTML = state.history
      .slice(0, 12)
      .map(
        (h) => `
        <div class="history-item">
          <div>
            <div class="history-item__name">${h.questName}</div>
            <div class="history-item__date">${formatDate(h.date)}</div>
          </div>
          <div class="history-item__xp">+${h.xp} XP</div>
        </div>
      `
      )
      .join("");
  }
}

// ---------- Editable player name ----------
nameInput.addEventListener("input", () => {
  state.profile.name = nameInput.value;
  persist();

  const initial = initials(nameInput.value);
  document.getElementById("home-username").textContent = nameInput.value || "Joueur";
  document.getElementById("home-player-name").textContent = nameInput.value || "Joueur";
  document.getElementById("home-avatar").textContent = initial;
  document.getElementById("quick-avatar-glyph").textContent = initial;
  document.getElementById("profile-avatar").textContent = initial;
});

nameInput.addEventListener("blur", () => {
  if (!nameInput.value.trim()) {
    nameInput.value = "Joueur";
    state.profile.name = "Joueur";
    persist();
  }
});
