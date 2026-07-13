// ============================================================
// ACHIEVEMENT SYSTEM — checks unlock conditions against a state
// snapshot and unlocks any newly-earned achievements.
// ============================================================

import { state } from "../core/state.js";
import { ACHIEVEMENTS } from "../data/defaultData.js";
import { emit } from "../core/eventBus.js";

function buildSnapshot() {
  const statLevels = Object.values(state.stats).map((s) => s.level);
  return {
    totalQuestsCompleted: state.counters.totalQuestsCompleted,
    level: state.level,
    totalXp: state.totalXp,
    streakCurrent: state.streak.current,
    streakLongest: state.streak.longest,
    categoriesCompleted: state.categoriesCompleted.length,
    todayQuests: state.counters.todayQuestsCompleted,
    maxStatLevel: Math.max(...statLevels),
    minStatLevel: Math.min(...statLevels),
  };
}

export function checkAchievements() {
  const snapshot = buildSnapshot();
  const unlocked = state.achievements.unlockedIds;
  const newly = [];

  ACHIEVEMENTS.forEach((achievement) => {
    if (!unlocked.includes(achievement.id) && achievement.condition(snapshot)) {
      unlocked.push(achievement.id);
      newly.push(achievement);
    }
  });

  newly.forEach((a) => emit("achievement:unlocked", a));
  return newly;
}

export function isUnlocked(id) {
  return state.achievements.unlockedIds.includes(id);
}
