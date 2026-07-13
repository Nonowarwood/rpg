// ============================================================
// MAIN — application bootstrap. Wires systems to UI via the
// event bus and performs the initial render.
// ============================================================

import { state, persist, rolloverDayIfNeeded } from "./core/state.js";
import { on } from "./core/eventBus.js";
import { STATS } from "./core/config.js";
import { checkStreakDecay } from "./systems/streakSystem.js";
import { currentTitle } from "./systems/titleSystem.js";

import { initNavigation, applyNavPosition } from "./ui/navigation.js";
import { showToast } from "./ui/notifications.js";
import { showLevelUpOverlay, queueAchievementOverlay } from "./ui/modals.js";
import { hydrateStaticIcons } from "./ui/icons.js";
import { hydrateHeistText } from "./ui/heistText.js";

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
on("quest:completed", ({ quest, xpEarned, leveledUp, newAchievements }) => {
  showToast({ type: "quest", title: "Quête complétée", desc: `+${xpEarned} XP · ${quest.name}` });

  if (leveledUp) showLevelUpOverlay(state.level, currentTitle());
  newAchievements.forEach((a) => queueAchievementOverlay(a));

  // Delay the full refresh so the in-place card animation can play out first.
  setTimeout(refreshAll, 1250);
});

on("quest:created", () => {
  showToast({ type: "quest", title: "Nouvelle quête créée", sound: "click" });
  refreshAll();
});

on("quest:updated", () => {
  showToast({ type: "quest", title: "Quête modifiée", sound: "click" });
  refreshAll();
});

on("quest:deleted", refreshAll);

on("streak:updated", ({ current, isRecord }) => {
  if (isRecord) {
    showToast({ type: "streak", title: "Nouveau record de streak !", desc: `${current} jours d'affilée`, sound: "achievement" });
  }
});

on("streak:freeze-earned", ({ freezes }) => {
  showToast({ type: "stat", icon: "snowflake", title: "Gel de streak gagné", desc: `Protège un jour manqué · stock : ${freezes}`, sound: "achievement" });
});

on("streak:freeze-used", ({ used, current, remaining }) => {
  showToast({
    type: "stat",
    icon: "snowflake",
    title: used > 1 ? `${used} gels de streak utilisés` : "Gel de streak utilisé",
    desc: `Ton streak de ${current} jours est sauf · reste ${remaining}`,
  });
});

on("stat:levelup", ({ statKey, level }) => {
  const def = STATS[statKey];
  showToast({ type: "stat", icon: def.icon, title: `${def.name} · Niveau ${level}`, desc: "Statistique améliorée" });
});

// ---------- Cross-system feedback: Google account sync ----------
on("auth:changed", (user) => {
  if (user) {
    showToast({ type: "achievement", title: "Connecté avec Google", desc: user.displayName || user.email });
  } else {
    showToast({ type: "xp", title: "Déconnecté", desc: "Progression conservée en local" });
  }
  refreshAll();
});

on("state:hydrated", () => {
  showToast({ type: "achievement", title: "Progression synchronisée", desc: "Récupérée depuis le cloud" });
  applyNavPosition(state.settings.navPosition); // cloud save may carry a different preference
  refreshAll();
});

on("auth:error", () => {
  showToast({ type: "error", title: "Connexion Google indisponible", desc: "Vérifie ta connexion internet" });
});

// ---------- Optional cloud layer (Google sign-in + Firestore) ----------
// Dynamically imported (not a static top-level import) so a network/CDN
// failure only disables cloud sync — it can't take down the rest of the
// app's module graph, which is otherwise fully local/offline-capable.
import("./systems/authSystem.js").catch((err) => {
  console.warn("[Ascend] Google sign-in unavailable (offline or CDN blocked).", err);
});
import("./systems/cloudSync.js").catch((err) => {
  console.warn("[Ascend] Cloud sync unavailable (offline or CDN blocked).", err);
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
  hydrateStaticIcons();
  hydrateHeistText();
  applyNavPosition(state.settings.navPosition);
  rolloverDayIfNeeded();
  checkStreakDecay();
  initNavigation();
  refreshAll();
  trackUsageTime();
}

boot();
