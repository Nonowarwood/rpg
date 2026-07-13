// ============================================================
// QUESTS SCREEN — quest list rendering, category filters, and
// the shared "complete a quest" interaction (also reused by the
// home screen's quest preview list).
// ============================================================

import { state } from "../core/state.js";
import { CATEGORIES, DIFFICULTIES } from "../core/config.js";
import { completeQuest, deleteQuest, isQuestCompletedToday, questTierInfo } from "../systems/questSystem.js";
import { spawnXpPopup } from "./animations.js";
import { playSound } from "../systems/soundSystem.js";
import { icon } from "./icons.js";

let activeCategoryFilter = "all";

const questListEl = document.getElementById("quest-list");
const categoryFiltersEl = document.getElementById("category-filters");

export function questCardHTML(quest) {
  const cat = CATEGORIES[quest.category];
  const done = isQuestCompletedToday(quest);
  const tier = questTierInfo(quest);

  let metaHTML;
  if (tier) {
    const pips = quest.tiers
      .map((_, i) => `<span class="tier-pip${i < tier.progress ? " tier-pip--done" : ""}"></span>`)
      .join("");
    const label = tier.done ? "Terminé" : tier.current.label;
    const xp = tier.done ? "" : `<span class="quest-card__xp">+${tier.current.xp} XP</span>`;
    metaHTML = `
      <span class="quest-card__tag">${cat.name}</span>
      <span class="quest-card__pips">${pips}</span>
      <span>${label}</span>
      ${xp}
    `;
  } else {
    const diff = DIFFICULTIES[quest.difficulty];
    metaHTML = `
      <span class="quest-card__tag">${cat.name}</span>
      <span>${diff.name}</span>
      <span class="quest-card__xp">+${quest.xp} XP</span>
    `;
  }

  return `
    <div class="quest-card${done ? " quest-card--done" : ""}" data-quest-id="${quest.id}" style="--card-accent:${cat.color}">
      <div class="quest-card__icon">${icon(cat.icon, { size: 22 })}</div>
      <div class="quest-card__body">
        <div class="quest-card__name">${quest.name}</div>
        <div class="quest-card__meta">${metaHTML}</div>
      </div>
      <button class="quest-check${done ? " quest-check--done" : ""}" data-quest-id="${quest.id}" aria-label="Compléter la quête">
        <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  `;
}

function buildCategoryFilters() {
  const chips = [
    `<button class="chip${activeCategoryFilter === "all" ? " chip--active" : ""}" data-category="all">Toutes</button>`,
    ...Object.entries(CATEGORIES).map(
      ([key, cat]) =>
        `<button class="chip${activeCategoryFilter === key ? " chip--active" : ""}" data-category="${key}">${icon(cat.icon, { size: 14 })} ${cat.name}</button>`
    ),
  ];
  categoryFiltersEl.innerHTML = chips.join("");
}

categoryFiltersEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  activeCategoryFilter = btn.dataset.category;
  buildCategoryFilters();
  renderQuestsScreen();
});

export function renderQuestsScreen() {
  buildCategoryFilters();
  const quests = state.quests.filter((q) => activeCategoryFilter === "all" || q.category === activeCategoryFilter);

  if (!quests.length) {
    questListEl.innerHTML = `<p class="empty-state">Aucune quête ici. Ajoutez-en une avec le bouton +.</p>`;
    return;
  }
  questListEl.innerHTML = quests.map(questCardHTML).join("");
}

// Wires the "tap to complete" + "long-press to delete" interactions
// on any container of quest cards (quest list, home preview list).
export function wireQuestCompletionHandlers(containerEl) {
  // Guards against the click that still fires after a long-press
  // delete — without it, the click can land on a different card
  // once the list re-renders and silently complete the wrong quest.
  let longPressFired = false;

  containerEl.addEventListener("click", (e) => {
    if (longPressFired) {
      longPressFired = false;
      return;
    }
    const target = e.target.closest("[data-quest-id]");
    if (!target) return;
    const id = target.dataset.questId;
    const cardEl = target.closest(".quest-card");

    const result = completeQuest(id);
    if (!result) return; // already completed today

    playSound("complete");
    if (cardEl) {
      // A tiered quest only reads as "done" once its last tier is
      // checked — intermediate tiers just pop the XP and let the
      // deferred refresh reveal the next grade.
      if (isQuestCompletedToday(result.quest)) {
        cardEl.classList.add("quest-card--done");
        cardEl.querySelector(".quest-check")?.classList.add("quest-check--done");
      }
      spawnXpPopup(cardEl, result.xpEarned);
    }
  });

  let pressTimer = null;
  containerEl.addEventListener("pointerdown", (e) => {
    const card = e.target.closest(".quest-card");
    if (!card) return;
    longPressFired = false;
    pressTimer = setTimeout(() => {
      longPressFired = true;
      const quest = state.quests.find((q) => q.id === card.dataset.questId);
      if (quest && confirm(`Supprimer la quête "${quest.name}" ?`)) {
        deleteQuest(quest.id);
      }
    }, 550);
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) =>
    containerEl.addEventListener(evt, () => clearTimeout(pressTimer))
  );
}

wireQuestCompletionHandlers(questListEl);
