// ============================================================
// HOME SCREEN — player summary card, daily stat tiles, and a
// preview of today's quests (reusing the quests screen's card
// renderer so both stay visually identical).
// ============================================================

import { state } from "../core/state.js";
import { xpProgress } from "../systems/xpSystem.js";
import { currentTitle } from "../systems/titleSystem.js";
import { isQuestCompletedToday } from "../systems/questSystem.js";
import { questCardHTML, wireQuestCompletionHandlers } from "./questsScreen.js";
import { setBarWidth, animateCounter } from "./animations.js";

const previewEl = document.getElementById("home-quest-preview");

function animateTile(el, value) {
  const from = parseInt(el.textContent, 10) || 0;
  if (from === value) {
    el.textContent = value;
    return;
  }
  animateCounter(el, from, value, { duration: 650 });
}

function initials(name) {
  return (name || "?").trim().charAt(0).toUpperCase() || "?";
}

function formatMinutes(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${(min % 60).toString().padStart(2, "0")}`;
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function renderHome() {
  const initial = initials(state.profile.name);

  document.getElementById("home-greeting").textContent = greetingForNow();
  document.getElementById("home-username").textContent = state.profile.name;
  document.getElementById("home-player-name").textContent = state.profile.name;
  document.getElementById("home-player-title").textContent = currentTitle();
  document.getElementById("home-avatar").textContent = initial;
  document.getElementById("quick-avatar-glyph").textContent = initial;
  document.getElementById("home-level-badge").textContent = state.level;
  document.getElementById("home-level-num").textContent = state.level;

  const progress = xpProgress();
  document.getElementById("home-xp-amount").textContent = `${progress.current} / ${progress.required} XP`;
  setBarWidth(document.getElementById("home-xp-fill"), progress.percent);

  animateTile(document.getElementById("tile-streak"), state.streak.current);
  animateTile(document.getElementById("tile-quests-today"), state.counters.todayQuestsCompleted);
  animateTile(document.getElementById("tile-xp-today"), state.counters.todayXp);
  animateTile(document.getElementById("tile-total-quests"), state.counters.totalQuestsCompleted);
  document.getElementById("tile-focus-time").textContent = formatMinutes(state.counters.focusTimeMinutes);

  renderQuestPreview();
}

function renderQuestPreview() {
  const preview = [...state.quests]
    .sort((a, b) => Number(isQuestCompletedToday(a)) - Number(isQuestCompletedToday(b)))
    .slice(0, 5);

  if (!preview.length) {
    previewEl.innerHTML = `<p class="empty-state">Aucune quête. Ajoutez-en une dans l'onglet Quêtes.</p>`;
    return;
  }
  previewEl.innerHTML = preview.map(questCardHTML).join("");
}

wireQuestCompletionHandlers(previewEl);
