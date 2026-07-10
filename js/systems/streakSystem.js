// ============================================================
// STREAK SYSTEM — daily completion streak with decay detection.
// ============================================================

import { state } from "../core/state.js";
import { emit } from "../core/eventBus.js";
import { todayISO, yesterdayISO } from "../core/date.js";

// Call once per quest completion. No-ops if already counted today.
export function registerCompletionForStreak() {
  const today = todayISO();
  const streak = state.streak;

  if (streak.lastCompletionDate === today) return;

  streak.current = streak.lastCompletionDate === yesterdayISO() ? streak.current + 1 : 1;
  streak.lastCompletionDate = today;

  let isRecord = false;
  if (streak.current > streak.longest) {
    streak.longest = streak.current;
    isRecord = streak.current > 1;
  }

  emit("streak:updated", { current: streak.current, isRecord });
}

// Call once on app boot: if a day was missed, the streak resets to zero.
export function checkStreakDecay() {
  const streak = state.streak;
  if (!streak.lastCompletionDate) return;
  if (streak.lastCompletionDate === todayISO() || streak.lastCompletionDate === yesterdayISO()) return;
  streak.current = 0;
}
