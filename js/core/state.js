// ============================================================
// STATE — single source of truth for the whole game.
// Systems mutate `state` directly then call persist().
// UI subscribes to eventBus "state:changed" (and finer-grained
// events) to know when to re-render.
// ============================================================

import { loadSave, persistSave, persistSaveNow } from "./storage.js";
import { createDefaultState } from "../data/defaultData.js";
import { emit } from "./eventBus.js";
import { todayISO } from "./date.js";

function mergeWithDefaults(saved) {
  const defaults = createDefaultState();
  // Shallow-merge top level, deep-merge known nested objects so that
  // future new fields introduced in updates don't break old saves.
  return {
    ...defaults,
    ...saved,
    profile: { ...defaults.profile, ...saved.profile },
    streak: { ...defaults.streak, ...saved.streak },
    stats: { ...defaults.stats, ...saved.stats },
    counters: { ...defaults.counters, ...saved.counters },
    achievements: { ...defaults.achievements, ...saved.achievements },
    settings: { ...defaults.settings, ...saved.settings },
    meta: { ...defaults.meta, ...saved.meta, sessionStart: Date.now() },
    // Array.isArray (not `.length`) so a deliberately emptied quest
    // list (user deleted everything) isn't overwritten by starters.
    quests: Array.isArray(saved.quests) ? saved.quests : defaults.quests,
  };
}

const saved = loadSave();
export const state = saved ? mergeWithDefaults(saved) : createDefaultState();

// Roll the "today" counters over if the app is opened on a new day.
export function rolloverDayIfNeeded() {
  const today = todayISO();
  if (state.counters.todayDate !== today) {
    state.counters.todayDate = today;
    state.counters.todayXp = 0;
    state.counters.todayQuestsCompleted = 0;
    persist();
  }
}

export function persist() {
  persistSave(state);
  emit("state:changed", state);
}

export function persistNow() {
  persistSaveNow(state);
  emit("state:changed", state);
}

window.addEventListener("beforeunload", () => {
  persistSaveNow(state);
});
