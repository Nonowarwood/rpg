// ============================================================
// TITLE SYSTEM — thin accessor around the level -> title mapping.
// Kept as its own module so unlock rules can grow independently
// of config.js (e.g. title unlocked by achievement instead of level).
// ============================================================

import { state } from "../core/state.js";
import { titleForLevel } from "../core/config.js";

export function currentTitle() {
  return titleForLevel(state.level);
}
