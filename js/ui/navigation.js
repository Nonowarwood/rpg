// ============================================================
// NAVIGATION — bottom tab bar + screen switching.
// Any element with [data-nav="quests"] etc. acts as a navigation
// trigger (used by the bottom nav, "Voir tout" links, avatar icon).
// ============================================================

import { emit } from "../core/eventBus.js";

const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll(".nav-btn");
const indicator = document.getElementById("nav-indicator");

export function goToScreen(name) {
  screens.forEach((s) => s.classList.toggle("screen--active", s.dataset.screen === name));

  navButtons.forEach((btn, i) => {
    const active = btn.dataset.nav === name;
    btn.classList.toggle("nav-btn--active", active);
    if (active && indicator) indicator.style.transform = `translateX(${i * 100}%)`;
  });

  emit("screen:changed", name);
}

export function initNavigation() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => goToScreen(el.dataset.nav));
  });
  goToScreen("home");
}
