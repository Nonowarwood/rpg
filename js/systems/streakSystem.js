// ============================================================
// STREAK SYSTEM — daily completion streak with decay detection
// and streak freezes: one freeze is earned every 7 consecutive
// days (stock capped at 2), and each freeze pardons one missed
// day instead of resetting the streak to zero.
// ============================================================

import { state } from "../core/state.js";
import { emit } from "../core/eventBus.js";
import { todayISO, yesterdayISO, daysBetweenISO } from "../core/date.js";

const MAX_FREEZES = 2;

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

  // Every full week of streak earns a freeze (up to the cap).
  if (streak.current > 0 && streak.current % 7 === 0 && (streak.freezes || 0) < MAX_FREEZES) {
    streak.freezes = (streak.freezes || 0) + 1;
    emit("streak:freeze-earned", { freezes: streak.freezes });
  }

  emit("streak:updated", { current: streak.current, isRecord });
}

// Call once on app boot. Missed days are pardoned by freezes (one
// per day); if the stock doesn't cover the gap, the streak resets.
export function checkStreakDecay() {
  const streak = state.streak;
  if (!streak.lastCompletionDate || streak.current === 0) return;

  const missed = daysBetweenISO(streak.lastCompletionDate, todayISO()) - 1;
  if (missed <= 0) return;

  if ((streak.freezes || 0) >= missed) {
    streak.freezes -= missed;
    // Pretend yesterday was completed so today's first quest continues
    // the streak instead of restarting it.
    streak.lastCompletionDate = yesterdayISO();
    emit("streak:freeze-used", { used: missed, current: streak.current, remaining: streak.freezes });
  } else {
    streak.current = 0;
  }
}
