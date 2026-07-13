// ============================================================
// MODALS & OVERLAYS — quest creation sheet, level-up overlay,
// achievement-unlock overlay (queued so multiple unlocks don't
// collide), all driven from static markup in index.html.
// ============================================================

import { CATEGORIES, DIFFICULTIES } from "../core/config.js";
import { createQuest } from "../systems/questSystem.js";
import { spawnParticles } from "./animations.js";
import { playSound } from "../systems/soundSystem.js";
import { icon } from "./icons.js";
import { heistLetters } from "./heistText.js";

// ---------- Quest creation modal ----------
const questModal = document.getElementById("quest-modal");
const questForm = document.getElementById("quest-form");
const qfName = document.getElementById("qf-name");
const qfDescription = document.getElementById("qf-description");
const qfCategoryRow = document.getElementById("qf-category-row");
const qfDifficultyRow = document.getElementById("qf-difficulty-row");
const qfRepeatRow = document.getElementById("qf-repeat-row");
const btnAddQuest = document.getElementById("btn-add-quest");
const btnCancelQuest = document.getElementById("btn-cancel-quest");

let selectedCategory = Object.keys(CATEGORIES)[0];
let selectedDifficulty = "medium";
let selectedRepeat = "daily";

function buildOptionRows() {
  qfCategoryRow.innerHTML = Object.entries(CATEGORIES)
    .map(
      ([key, cat]) => `
      <button type="button" class="option-pill${key === selectedCategory ? " option-pill--active" : ""}"
        data-category="${key}" style="--pill-accent:${cat.color}">
        ${icon(cat.icon, { size: 14 })} ${cat.name}
      </button>`
    )
    .join("");

  qfDifficultyRow.innerHTML = Object.entries(DIFFICULTIES)
    .map(
      ([key, diff]) => `
      <button type="button" class="option-pill${key === selectedDifficulty ? " option-pill--active" : ""}"
        data-difficulty="${key}" style="--pill-accent:${diff.color}">
        ${diff.name} · ${diff.xp} XP
      </button>`
    )
    .join("");
}

qfCategoryRow.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  selectedCategory = btn.dataset.category;
  buildOptionRows();
});

qfDifficultyRow.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-difficulty]");
  if (!btn) return;
  selectedDifficulty = btn.dataset.difficulty;
  buildOptionRows();
});

qfRepeatRow.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-repeat]");
  if (!btn) return;
  selectedRepeat = btn.dataset.repeat;
  [...qfRepeatRow.children].forEach((c) => c.classList.toggle("option-pill--active", c === btn));
});

export function openQuestModal() {
  selectedCategory = Object.keys(CATEGORIES)[0];
  selectedDifficulty = "medium";
  selectedRepeat = "daily";
  qfName.value = "";
  qfDescription.value = "";
  buildOptionRows();
  [...qfRepeatRow.children].forEach((c) => c.classList.toggle("option-pill--active", c.dataset.repeat === "daily"));
  questModal.classList.add("overlay--active");
  setTimeout(() => qfName.focus(), 300);
  playSound("click");
}

export function closeQuestModal() {
  questModal.classList.remove("overlay--active");
}

btnAddQuest.addEventListener("click", openQuestModal);
btnCancelQuest.addEventListener("click", closeQuestModal);
questModal.addEventListener("click", (e) => {
  if (e.target === questModal) closeQuestModal();
});

questForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!qfName.value.trim()) return;
  createQuest({
    name: qfName.value,
    description: qfDescription.value,
    category: selectedCategory,
    difficulty: selectedDifficulty,
    repeat: selectedRepeat,
  });
  playSound("click");
  closeQuestModal();
});

// ---------- Level-up & achievement-unlock overlays ----------
// Both are "big moment" full-screen overlays. They share a single
// sequential queue so a level-up and an achievement unlocked by the
// same quest completion never fight for the screen at once.
const levelupOverlay = document.getElementById("levelup-overlay");
const levelupParticles = document.getElementById("levelup-particles");
const levelupLevelNum = document.getElementById("levelup-level-num");
const levelupTitleText = document.getElementById("levelup-title-text");
const btnLevelupClose = document.getElementById("btn-levelup-close");

const achievementOverlay = document.getElementById("achievement-overlay");
const achievementIcon = document.getElementById("achievement-icon");
const achievementName = document.getElementById("achievement-name");
const achievementDesc = document.getElementById("achievement-desc");
const btnAchievementClose = document.getElementById("btn-achievement-close");

const bigOverlayQueue = [];
let bigOverlayBusy = false;

export function showLevelUpOverlay(level, title) {
  bigOverlayQueue.push({ type: "levelup", level, title });
  drainBigOverlayQueue();
}

export function queueAchievementOverlay(achievement) {
  bigOverlayQueue.push({ type: "achievement", ...achievement });
  drainBigOverlayQueue();
}

function drainBigOverlayQueue() {
  if (bigOverlayBusy) return;
  const next = bigOverlayQueue.shift();
  if (!next) return;
  bigOverlayBusy = true;

  if (next.type === "levelup") {
    levelupLevelNum.textContent = next.level;
    levelupTitleText.textContent = next.title;
    levelupOverlay.classList.add("overlay--active");
    spawnParticles(levelupParticles, 30);
    playSound("levelup");
  } else {
    achievementIcon.innerHTML = icon(next.icon, { size: 56 });
    achievementName.innerHTML = heistLetters(next.name);
    achievementDesc.textContent = next.desc;
    achievementOverlay.classList.add("overlay--active");
    playSound("achievement");
  }
}

function closeLevelUpOverlay() {
  levelupOverlay.classList.remove("overlay--active");
  bigOverlayBusy = false;
  setTimeout(drainBigOverlayQueue, 250);
}
btnLevelupClose.addEventListener("click", closeLevelUpOverlay);
levelupOverlay.addEventListener("click", (e) => {
  if (e.target === levelupOverlay) closeLevelUpOverlay();
});

function closeAchievementOverlay() {
  achievementOverlay.classList.remove("overlay--active");
  bigOverlayBusy = false;
  setTimeout(drainBigOverlayQueue, 250);
}
btnAchievementClose.addEventListener("click", closeAchievementOverlay);
achievementOverlay.addEventListener("click", (e) => {
  if (e.target === achievementOverlay) closeAchievementOverlay();
});
