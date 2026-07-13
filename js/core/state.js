// ============================================================
// STATE — single source of truth for the whole game.
// Systems mutate `state` directly then call persist().
// UI subscribes to eventBus "state:changed" (and finer-grained
// events) to know when to re-render.
// ============================================================

import { loadSave, persistSave, persistSaveNow } from "./storage.js";
import { createDefaultState, STARTER_QUESTS, LEGACY_STARTER_NAMES, CATALOG_VERSION } from "../data/defaultData.js";
import { emit } from "./eventBus.js";
import { todayISO } from "./date.js";

function mergeWithDefaults(saved) {
  const defaults = createDefaultState();
  // Shallow-merge top level, deep-merge known nested objects so that
  // future new fields introduced in updates don't break old saves.
  const merged = {
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

  // Catalog migration: when the app ships new starter quests, saves
  // from an older catalog get the missing ones appended (matched by
  // stable id). The v1 starters (random ids) are dropped by name —
  // the v2 catalog re-covers them in tiered form.
  if ((saved.catalogVersion || 0) < CATALOG_VERSION) {
    merged.quests = merged.quests.filter(
      (q) => !(LEGACY_STARTER_NAMES.has(q.name) && !String(q.id).startsWith("starter_"))
    );
    const have = new Set(merged.quests.map((q) => q.id));
    STARTER_QUESTS.forEach((q) => {
      if (!have.has(q.id)) merged.quests.push(structuredClone(q));
    });
    merged.catalogVersion = CATALOG_VERSION;
  }

  return merged;
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

// Replaces the live `state` singleton's contents in place with data
// pulled from Firestore (see systems/cloudSync.js). `state` is a
// const binding shared across every module, so this mutates it
// rather than reassigning — merged through the same defaults path
// as a local save, so a cloud doc from an older app version is safe.
export function hydrateFromCloud(cloudData) {
  const merged = mergeWithDefaults(cloudData);
  Object.keys(state).forEach((key) => delete state[key]);
  Object.assign(state, merged);
  persistSaveNow(state);
  emit("state:changed", state);
  emit("state:hydrated", state);
}

window.addEventListener("beforeunload", () => {
  persistSaveNow(state);
});
