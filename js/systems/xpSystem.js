// ============================================================
// XP SYSTEM — player-level XP gain and level-up resolution.
// ============================================================

import { state } from "../core/state.js";
import { xpRequiredForLevel, titleForLevel } from "../core/config.js";
import { emit } from "../core/eventBus.js";

export function awardXp(amount) {
  state.xp += amount;
  state.totalXp += amount;
  state.counters.todayXp += amount;

  let leveledUp = false;
  let required = xpRequiredForLevel(state.level);

  while (state.xp >= required) {
    state.xp -= required;
    state.level += 1;
    leveledUp = true;
    required = xpRequiredForLevel(state.level);
    emit("level:up", { level: state.level, title: titleForLevel(state.level) });
  }

  emit("xp:gained", { amount, leveledUp });
  return { leveledUp };
}

export function xpProgress() {
  const required = xpRequiredForLevel(state.level);
  return {
    current: state.xp,
    required,
    level: state.level,
    percent: Math.min(100, (state.xp / required) * 100),
  };
}
