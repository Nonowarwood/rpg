// ============================================================
// QUEST SYSTEM — quest CRUD and the completion pipeline that
// ties together XP, stats, streak, history and achievements.
// ============================================================

import { state, persist } from "../core/state.js";
import { generateQuestId } from "../data/defaultData.js";
import { DIFFICULTIES } from "../core/config.js";
import { emit } from "../core/eventBus.js";
import { awardXp } from "./xpSystem.js";
import { awardCategoryStats } from "./statsSystem.js";
import { registerCompletionForStreak } from "./streakSystem.js";
import { checkAchievements } from "./achievementSystem.js";
import { todayISO } from "../core/date.js";

export function createQuest({ name, description, category, difficulty, repeat }) {
  const xp = DIFFICULTIES[difficulty]?.xp ?? 30;
  const quest = {
    id: generateQuestId(),
    name: name.trim(),
    description: (description || "").trim(),
    category,
    difficulty,
    xp,
    repeat, // 'daily' | 'once'
    lastCompletedDate: null,
    createdAt: Date.now(),
  };
  state.quests.unshift(quest);
  persist();
  emit("quest:created", quest);
  return quest;
}

export function deleteQuest(id) {
  state.quests = state.quests.filter((q) => q.id !== id);
  persist();
  emit("quest:deleted", id);
}

export function isQuestCompletedToday(quest) {
  return quest.lastCompletedDate === todayISO();
}

// Returns null if the quest doesn't exist or was already completed today.
export function completeQuest(id) {
  const quest = state.quests.find((q) => q.id === id);
  if (!quest || isQuestCompletedToday(quest)) return null;

  quest.lastCompletedDate = todayISO();

  const { leveledUp } = awardXp(quest.xp);
  awardCategoryStats(quest.category, quest.xp);
  registerCompletionForStreak();

  state.counters.totalQuestsCompleted += 1;
  state.counters.todayQuestsCompleted += 1;

  if (!state.categoriesCompleted.includes(quest.category)) {
    state.categoriesCompleted.push(quest.category);
  }

  state.history.unshift({
    id: "h_" + Date.now().toString(36),
    questName: quest.name,
    category: quest.category,
    xp: quest.xp,
    date: todayISO(),
    timestamp: Date.now(),
  });
  state.history = state.history.slice(0, 50);

  if (quest.repeat === "once") {
    state.quests = state.quests.filter((q) => q.id !== id);
  }

  const newAchievements = checkAchievements();

  persist();
  emit("quest:completed", { quest, leveledUp, newAchievements });

  return { quest, leveledUp, newAchievements };
}
