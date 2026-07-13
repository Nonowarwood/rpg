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

// Tier info for graded quests (500ml -> 1L -> 1,5L). Tier progress
// only counts if it was made today — any other day it reads as 0,
// which is what makes tiered dailies reset each morning without a
// dedicated rollover pass.
export function questTierInfo(quest) {
  if (!quest.tiers) return null;
  const progress = quest.lastCompletedDate === todayISO() ? (quest.tierProgress || 0) : 0;
  const done = progress >= quest.tiers.length;
  return {
    progress,
    total: quest.tiers.length,
    done,
    current: done ? null : quest.tiers[progress],
  };
}

export function isQuestCompletedToday(quest) {
  if (quest.tiers) return questTierInfo(quest).done;
  return quest.lastCompletedDate === todayISO();
}

// Completes a simple quest, or the *current tier* of a graded quest.
// Returns null if the quest doesn't exist or is already fully done today.
export function completeQuest(id) {
  const quest = state.quests.find((q) => q.id === id);
  if (!quest || isQuestCompletedToday(quest)) return null;

  let xpEarned;
  let historyName = quest.name;

  if (quest.tiers) {
    // questTierInfo already treats progress from a previous day as 0,
    // so writing info.progress + 1 both advances today's tier and
    // resets stale progress in one assignment.
    const info = questTierInfo(quest);
    xpEarned = info.current.xp;
    historyName = `${quest.name} — ${info.current.label}`;
    quest.tierProgress = info.progress + 1;
    quest.lastCompletedDate = todayISO();
  } else {
    xpEarned = quest.xp;
    quest.lastCompletedDate = todayISO();
  }

  const { leveledUp } = awardXp(xpEarned);
  awardCategoryStats(quest.category, xpEarned);
  registerCompletionForStreak();

  state.counters.totalQuestsCompleted += 1;
  state.counters.todayQuestsCompleted += 1;

  if (!state.categoriesCompleted.includes(quest.category)) {
    state.categoriesCompleted.push(quest.category);
  }

  state.history.unshift({
    id: "h_" + Date.now().toString(36),
    questName: historyName,
    category: quest.category,
    xp: xpEarned,
    date: todayISO(),
    timestamp: Date.now(),
  });
  state.history = state.history.slice(0, 50);

  if (quest.repeat === "once") {
    state.quests = state.quests.filter((q) => q.id !== id);
  }

  const newAchievements = checkAchievements();

  persist();
  emit("quest:completed", { quest, xpEarned, leveledUp, newAchievements });

  return { quest, xpEarned, leveledUp, newAchievements };
}
