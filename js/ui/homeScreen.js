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
import { avatarInnerHTML } from "./avatar.js";
import { heistLetters } from "./heistText.js";

const previewEl = document.getElementById("home-quest-preview");

function animateTile(el, value) {
  const from = parseInt(el.textContent, 10) || 0;
  if (from === value) {
    el.textContent = value;
    return;
  }
  animateCounter(el, from, value, { duration: 650 });
}

function formatMinutes(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${(min % 60).toString().padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function renderHome() {
  document.getElementById("home-greeting").textContent = greetingForNow();
  document.getElementById("home-username").textContent = state.profile.name;
  document.getElementById("home-player-name").innerHTML = heistLetters(state.profile.name);
  document.getElementById("home-player-title").textContent = currentTitle();
  document.getElementById("home-avatar").innerHTML = avatarInnerHTML();
  document.getElementById("quick-avatar-glyph").innerHTML = avatarInnerHTML();
  document.getElementById("home-level-badge").textContent = state.level;
  document.getElementById("home-level-num").textContent = state.level;

  const progress = xpProgress();
  document.getElementById("home-xp-amount").textContent = `${progress.current} / ${progress.required} XP`;
  setBarWidth(document.getElementById("home-xp-fill"), progress.percent);

  animateTile(document.getElementById("tile-streak"), state.streak.current);
  animateTile(document.getElementById("tile-xp-today"), state.counters.todayXp);
  animateTile(document.getElementById("tile-total-quests"), state.counters.totalQuestsCompleted);
  document.getElementById("tile-focus-time").textContent = formatMinutes(state.counters.focusTimeMinutes);

  renderDailyProgress();
  renderQuestPreview();
  renderActivity();
}

// "Objectif du jour": fully-completed daily quests out of all daily
// quests (a tiered quest counts once all its tiers are done). Distinct
// from counters.todayQuestsCompleted, which counts individual checks.
function renderDailyProgress() {
  const dailies = state.quests.filter((q) => q.repeat === "daily");
  const done = dailies.filter(isQuestCompletedToday).length;
  const total = dailies.length;

  document.getElementById("daily-progress-done").textContent = done;
  document.getElementById("daily-progress-total").textContent = total;
  setBarWidth(document.getElementById("daily-progress-fill"), total ? (done / total) * 100 : 0);
  document
    .getElementById("home-daily-progress")
    .classList.toggle("daily-progress--complete", total > 0 && done === total);
}

// Always renders 10 cards; CSS hides everything past the 5th below
// 1024px (a media query is more reliable here than JS width checks,
// and it follows window resizes for free).
function renderQuestPreview() {
  const preview = [...state.quests]
    .sort((a, b) => Number(isQuestCompletedToday(a)) - Number(isQuestCompletedToday(b)))
    .slice(0, 10);

  if (!preview.length) {
    previewEl.innerHTML = `<p class="empty-state">Aucune quête. Ajoutez-en une dans l'onglet Quêtes.</p>`;
    return;
  }
  previewEl.innerHTML = preview.map(questCardHTML).join("");
}

function renderActivity() {
  const el = document.getElementById("home-activity");
  const items = state.history.slice(0, 6);

  if (!items.length) {
    el.innerHTML = `<p class="empty-state">Complète ta première quête pour lancer la journée.</p>`;
    return;
  }
  el.innerHTML = items
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

wireQuestCompletionHandlers(previewEl);
