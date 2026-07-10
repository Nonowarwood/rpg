// ============================================================
// MAIN — application bootstrap. Wires systems to UI via the
// event bus and performs the initial render.
// ============================================================

import { state, persist, rolloverDayIfNeeded } from "./core/state.js";
import { on } from "./core/eventBus.js";
import { STATS } from "./core/config.js";
import { checkStreakDecay } from "./systems/streakSystem.js";
import { currentTitle } from "./systems/titleSystem.js";

import { initNavigation } from "./ui/navigation.js";
import { showToast } from "./ui/notifications.js";
import { showLevelUpOverlay, queueAchievementOverlay } from "./ui/modals.js";

import { renderHome } from "./ui/homeScreen.js";
import { renderQuestsScreen } from "./ui/questsScreen.js";
import { renderStatsScreen } from "./ui/statsScreen.js";
import { renderAchievementsScreen } from "./ui/achievementsScreen.js";
import { renderProfileScreen } from "./ui/profileScreen.js";

function refreshAll() {
  renderHome();
  renderQuestsScreen();
  renderStatsScreen();
  renderAchievementsScreen();
  renderProfileScreen();
}

// ---------- Cross-system feedback: quest completion ----------
on("quest:completed", ({ quest, leveledUp, newAchievements }) => {
  showToast({ type: "quest", title: "Quête complétée", desc: `+${quest.xp} XP · ${quest.name}` });

  if (leveledUp) showLevelUpOverlay(state.level, currentTitle());
  newAchievements.forEach((a) => queueAchievementOverlay(a));

  // Delay the full refresh so the in-place card animation can play out first.
  setTimeout(refreshAll, 1250);
});

on("quest:created", () => {
  showToast({ type: "quest", title: "Nouvelle quête créée", sound: "click" });
  refreshAll();
});

on("quest:deleted", refreshAll);

on("streak:updated", ({ current, isRecord }) => {
  if (isRecord) {
    showToast({ type: "streak", title: "Nouveau record de streak !", desc: `${current} jours d'affilée`, sound: "achievement" });
  }
});

on("stat:levelup", ({ statKey, level }) => {
  const def = STATS[statKey];
  showToast({ type: "stat", icon: def.icon, title: `${def.name} · Niveau ${level}`, desc: "Statistique améliorée" });
});

// ---------- Passive focus-time tracking ----------
// Ticks once a minute while the tab is visible; feeds both the
// "Temps focus" home tile and the "Temps d'utilisation" profile stat.
function trackUsageTime() {
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    state.counters.focusTimeMinutes += 1;
    state.meta.totalUsageMinutes += 1;
    persist();
    renderHome();
    renderProfileScreen();
  }, 60000);
}

function boot() {
  rolloverDayIfNeeded();
  checkStreakDecay();
  initNavigation();
  refreshAll();
  trackUsageTime();
}

boot();
