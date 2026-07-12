// ============================================================
// NAVIGATION — tab bar (bottom or top, user preference) + screen
// switching. Any element with [data-nav="quests"] etc. acts as a
// navigation trigger (nav bar, "Voir tout" links, avatar icon).
// ============================================================

import { emit } from "../core/eventBus.js";
import { playSound } from "../systems/soundSystem.js";

const screens = document.querySelectorAll(".screen");
const navButtons = document.querySelectorAll(".nav-btn");
const indicator = document.getElementById("nav-indicator");

let currentScreen = null;

export function goToScreen(name) {
  if (name === currentScreen) return;
  // Never blank the app on a bogus name — only navigate to screens
  // that actually exist.
  if (!document.querySelector(`.screen[data-screen="${name}"]`)) return;
  const isBootCall = currentScreen === null;
  currentScreen = name;
  // No sound on the initial boot render — creating an AudioContext
  // outside a user gesture triggers browser autoplay warnings.
  if (!isBootCall) playSound("click");

  screens.forEach((s) => s.classList.toggle("screen--active", s.dataset.screen === name));

  navButtons.forEach((btn, i) => {
    const active = btn.dataset.nav === name;
    btn.classList.toggle("nav-btn--active", active);
    if (active && indicator) indicator.style.transform = `translateX(${i * 100}%)`;
  });

  emit("screen:changed", name);
}

// Flips the nav bar between bottom (default) and top — all the actual
// repositioning lives in CSS keyed off body[data-nav-position].
// NOTE: the attribute is deliberately NOT `data-nav` — that attribute
// is the app-wide "navigate on click" trigger, and stamping it on
// <body> would turn every stray click into a navigation.
export function applyNavPosition(position) {
  document.body.dataset.navPosition = position === "top" ? "top" : "bottom";
}

export function initNavigation() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => goToScreen(el.dataset.nav));
  });
  goToScreen("home");
}
