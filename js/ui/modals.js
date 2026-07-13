// ============================================================
// MODALS & OVERLAYS — quest creation sheet, level-up overlay,
// achievement-unlock overlay (queued so multiple unlocks don't
// collide), all driven from static markup in index.html.
// ============================================================

import { state } from "../core/state.js";
import { CATEGORIES, DIFFICULTIES } from "../core/config.js";
import { createQuest, updateQuest, deleteQuest } from "../systems/questSystem.js";
import { spawnParticles } from "./animations.js";
import { playSound } from "../systems/soundSystem.js";
import { icon } from "./icons.js";
import { heistLetters } from "./heistText.js";

// ---------- Quest creation / edition modal ----------
const questModal = document.getElementById("quest-modal");
const questForm = document.getElementById("quest-form");
const qfTitle = document.getElementById("qf-title");
const qfSubmit = document.getElementById("qf-submit");
const qfName = document.getElementById("qf-name");
const qfDescription = document.getElementById("qf-description");
const qfCategoryRow = document.getElementById("qf-category-row");
const qfTypeRow = document.getElementById("qf-type-row");
const qfDifficultyField = document.getElementById("qf-difficulty-field");
const qfDifficultyRow = document.getElementById("qf-difficulty-row");
const qfRepeatField = document.getElementById("qf-repeat-field");
const qfRepeatRow = document.getElementById("qf-repeat-row");
const qfTiersField = document.getElementById("qf-tiers-field");
const qfTierRows = document.getElementById("qf-tier-rows");
const qfTierAdd = document.getElementById("qf-tier-add");
const btnAddQuest = document.getElementById("btn-add-quest");
const btnCancelQuest = document.getElementById("btn-cancel-quest");

let selectedCategory = Object.keys(CATEGORIES)[0];
let selectedDifficulty = "medium";
let selectedRepeat = "daily";
let selectedType = "simple"; // 'simple' | 'tiered'
let editingQuestId = null;

const MAX_TIERS = 5;

// ---------- Tier editor (custom graded quests) ----------
function tierRowHTML(label = "", xp = 10) {
  return `
    <div class="tier-row">
      <input class="field__input tier-row__label" type="text" maxlength="30" required placeholder="ex : 500 ml" value="${label.replace(/"/g, "&quot;")}" />
      <input class="field__input tier-row__xp" type="number" min="1" max="500" required value="${xp}" />
      <button type="button" class="tier-row__remove" aria-label="Retirer le palier">${icon("plus", { size: 14 })}</button>
    </div>
  `;
}

function setTierRows(tiers) {
  qfTierRows.innerHTML = tiers.map((t) => tierRowHTML(t.label, t.xp)).join("");
  syncTierEditor();
}

function syncTierEditor() {
  const count = qfTierRows.children.length;
  qfTierAdd.hidden = count >= MAX_TIERS;
  // A tiered quest needs at least 2 tiers — lock removal below that.
  [...qfTierRows.querySelectorAll(".tier-row__remove")].forEach((btn) => (btn.disabled = count <= 2));
}

qfTierAdd.addEventListener("click", () => {
  if (qfTierRows.children.length >= MAX_TIERS) return;
  qfTierRows.insertAdjacentHTML("beforeend", tierRowHTML("", 10));
  syncTierEditor();
  qfTierRows.lastElementChild.querySelector(".tier-row__label").focus();
});

qfTierRows.addEventListener("click", (e) => {
  const btn = e.target.closest(".tier-row__remove");
  if (!btn || btn.disabled) return;
  btn.closest(".tier-row").remove();
  syncTierEditor();
});

function readTiers() {
  return [...qfTierRows.children].map((row) => ({
    label: row.querySelector(".tier-row__label").value.trim(),
    xp: Math.max(1, Math.min(500, parseInt(row.querySelector(".tier-row__xp").value, 10) || 1)),
  }));
}

function applyType(type) {
  selectedType = type;
  [...qfTypeRow.children].forEach((c) => c.classList.toggle("option-pill--active", c.dataset.type === type));
  const tiered = type === "tiered";
  qfTiersField.hidden = !tiered;
  qfDifficultyField.hidden = tiered;
  qfRepeatField.hidden = tiered; // tiered quests are always daily
  // required inputs inside a hidden block would still block submit
  [...qfTierRows.querySelectorAll("input")].forEach((i) => (i.required = tiered));
}

qfTypeRow.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-type]");
  if (!btn) return;
  applyType(btn.dataset.type);
});

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

// Opens the sheet empty (create mode) or prefilled from a quest
// object (edit mode).
export function openQuestModal(quest = null) {
  editingQuestId = quest ? quest.id : null;
  selectedCategory = quest ? quest.category : Object.keys(CATEGORIES)[0];
  selectedDifficulty = quest?.difficulty || "medium";
  selectedRepeat = quest?.repeat === "once" ? "once" : "daily";
  qfName.value = quest ? quest.name : "";
  qfDescription.value = quest ? quest.description || "" : "";
  qfTitle.textContent = quest ? "Modifier la quête" : "Nouvelle quête";
  qfSubmit.textContent = quest ? "Enregistrer" : "Créer la quête";

  setTierRows(quest?.tiers?.length ? quest.tiers : [
    { label: "", xp: 10 },
    { label: "", xp: 15 },
    { label: "", xp: 25 },
  ]);
  applyType(quest?.tiers ? "tiered" : "simple");

  buildOptionRows();
  [...qfRepeatRow.children].forEach((c) => c.classList.toggle("option-pill--active", c.dataset.repeat === selectedRepeat));
  questModal.classList.add("overlay--active");
  setTimeout(() => qfName.focus(), 300);
  playSound("click");
}

export function closeQuestModal() {
  questModal.classList.remove("overlay--active");
}

btnAddQuest.addEventListener("click", () => openQuestModal());
btnCancelQuest.addEventListener("click", closeQuestModal);
questModal.addEventListener("click", (e) => {
  if (e.target === questModal) closeQuestModal();
});

questForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!qfName.value.trim()) return;

  const fields = {
    name: qfName.value,
    description: qfDescription.value,
    category: selectedCategory,
    difficulty: selectedDifficulty,
    repeat: selectedRepeat,
  };
  if (selectedType === "tiered") {
    const tiers = readTiers();
    if (tiers.length < 2 || tiers.some((t) => !t.label)) return;
    fields.tiers = tiers;
  }

  if (editingQuestId) updateQuest(editingQuestId, fields);
  else createQuest(fields);

  playSound("click");
  closeQuestModal();
});

// ---------- Quest actions sheet (long press / right click) ----------
const questActions = document.getElementById("quest-actions");
const qaTitle = document.getElementById("qa-title");
const qaEdit = document.getElementById("qa-edit");
const qaDelete = document.getElementById("qa-delete");
const qaCancel = document.getElementById("qa-cancel");
let actionsQuestId = null;

export function openQuestActions(questId) {
  const quest = state.quests.find((q) => q.id === questId);
  if (!quest) return;
  actionsQuestId = questId;
  qaTitle.textContent = quest.name;
  qaDelete.textContent = "Supprimer";
  qaDelete.classList.remove("qa-delete--confirm");
  questActions.classList.add("overlay--active");
  playSound("click");
}

function closeQuestActions() {
  questActions.classList.remove("overlay--active");
  actionsQuestId = null;
}

qaEdit.addEventListener("click", () => {
  const quest = state.quests.find((q) => q.id === actionsQuestId);
  closeQuestActions();
  if (quest) openQuestModal(quest);
});

// Two-tap delete: the button itself becomes the confirmation step.
qaDelete.addEventListener("click", () => {
  if (!qaDelete.classList.contains("qa-delete--confirm")) {
    qaDelete.textContent = "Confirmer la suppression ?";
    qaDelete.classList.add("qa-delete--confirm");
    return;
  }
  deleteQuest(actionsQuestId);
  playSound("click");
  closeQuestActions();
});

qaCancel.addEventListener("click", closeQuestActions);
questActions.addEventListener("click", (e) => {
  if (e.target === questActions) closeQuestActions();
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
