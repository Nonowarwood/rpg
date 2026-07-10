// ============================================================
// STATS SYSTEM — RPG attributes (Intelligence, Strength, ...)
// level up independently of the player, fed by quest categories.
// ============================================================

import { state } from "../core/state.js";
import { statXpRequiredForLevel, CATEGORIES } from "../core/config.js";
import { emit } from "../core/eventBus.js";

export function awardCategoryStats(categoryKey, totalXp) {
  const category = CATEGORIES[categoryKey];
  if (!category) return;
  const share = Math.max(1, Math.round(totalXp / category.stats.length));
  category.stats.forEach((statKey) => awardStatXp(statKey, share));
}

export function awardStatXp(statKey, amount) {
  const stat = state.stats[statKey];
  if (!stat) return;

  stat.xp += amount;
  let required = statXpRequiredForLevel(stat.level);
  let leveledUp = false;

  while (stat.xp >= required) {
    stat.xp -= required;
    stat.level += 1;
    leveledUp = true;
    required = statXpRequiredForLevel(stat.level);
  }

  if (leveledUp) emit("stat:levelup", { statKey, level: stat.level });
}

export function statProgress(statKey) {
  const stat = state.stats[statKey];
  const required = statXpRequiredForLevel(stat.level);
  return {
    level: stat.level,
    xp: stat.xp,
    required,
    percent: Math.min(100, (stat.xp / required) * 100),
  };
}
