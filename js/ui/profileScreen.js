// ============================================================
// PROFILE SCREEN — identity card, overview tiles, all 8 stats
// at a glance, and recent quest history.
// ============================================================

import { state, persist } from "../core/state.js";
import { STATS } from "../core/config.js";
import { xpProgress } from "../systems/xpSystem.js";
import { currentTitle } from "../systems/titleSystem.js";
import { statProgress } from "../systems/statsSystem.js";
import { emit } from "../core/eventBus.js";
import { setBarWidth } from "./animations.js";
import { icon } from "./icons.js";
import { avatarInnerHTML } from "./avatar.js";

const nameInput = document.getElementById("profile-name-input");
const authRowEl = document.getElementById("profile-auth-row");

const GOOGLE_LOGO_SVG = `<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
</svg>`;

function renderAuthRow() {
  if (state.profile.email) {
    authRowEl.innerHTML = `
      <div class="account-chip">
        <span class="account-chip__avatar">${avatarInnerHTML()}</span>
        <span class="account-chip__info">
          <span class="account-chip__name">${state.profile.name}</span>
          <span class="account-chip__email">${state.profile.email}</span>
        </span>
        <button class="account-chip__signout" id="btn-google-signout">Déconnexion</button>
      </div>
    `;
  } else {
    authRowEl.innerHTML = `
      <button class="btn-google" id="btn-google-signin">
        ${GOOGLE_LOGO_SVG}
        Se connecter avec Google
      </button>
    `;
  }
}

// authSystem.js is loaded on demand rather than statically imported —
// its own module graph reaches the Firebase CDN, and we don't want a
// network/CDN hiccup to be able to break this screen's other buttons.
authRowEl.addEventListener("click", async (e) => {
  const wantsSignIn = e.target.closest("#btn-google-signin");
  const wantsSignOut = e.target.closest("#btn-google-signout");
  if (!wantsSignIn && !wantsSignOut) return;

  try {
    const { signInWithGoogle, signOutUser } = await import("../systems/authSystem.js");
    if (wantsSignIn) signInWithGoogle();
    if (wantsSignOut) signOutUser();
  } catch (err) {
    console.warn("[Ascend] Google sign-in unavailable.", err);
    emit("auth:error", err);
  }
});

function formatMinutes(min) {
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h${(min % 60).toString().padStart(2, "0")}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function renderProfileScreen() {
  document.getElementById("profile-avatar").innerHTML = avatarInnerHTML();
  document.getElementById("profile-level-badge").textContent = state.level;
  document.getElementById("profile-level-num").textContent = state.level;
  document.getElementById("profile-title").textContent = currentTitle();
  renderAuthRow();

  if (document.activeElement !== nameInput) nameInput.value = state.profile.name;

  const progress = xpProgress();
  document.getElementById("profile-xp-amount").textContent = `${progress.current} / ${progress.required} XP`;
  setBarWidth(document.getElementById("profile-xp-fill"), progress.percent);

  document.getElementById("profile-overview-tiles").innerHTML = `
    <div class="stat-tile"><span class="stat-tile__icon">${icon("flame", { size: 18 })}</span><span class="stat-tile__value">${state.streak.current}</span><span class="stat-tile__label">Streak actuel</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">${icon("star", { size: 18 })}</span><span class="stat-tile__value">${state.streak.longest}</span><span class="stat-tile__label">Record streak</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">${icon("sword", { size: 18 })}</span><span class="stat-tile__value">${state.counters.totalQuestsCompleted}</span><span class="stat-tile__label">Quêtes totales</span></div>
    <div class="stat-tile"><span class="stat-tile__icon">${icon("clock", { size: 18 })}</span><span class="stat-tile__value">${formatMinutes(state.meta.totalUsageMinutes)}</span><span class="stat-tile__label">Temps d'utilisation</span></div>
  `;

  document.getElementById("profile-mini-stats").innerHTML = Object.entries(STATS)
    .map(([key, def]) => {
      const p = statProgress(key);
      return `
        <div class="mini-stat">
          <span class="mini-stat__icon">${icon(def.icon, { size: 18 })}</span>
          <span class="mini-stat__info">
            <span class="mini-stat__name">${def.name}</span>
            <span class="mini-stat__level">Niv. ${p.level}</span>
          </span>
        </div>
      `;
    })
    .join("");

  const historyEl = document.getElementById("profile-history");
  if (!state.history.length) {
    historyEl.innerHTML = `<p class="empty-state">Aucun historique pour le moment.</p>`;
  } else {
    historyEl.innerHTML = state.history
      .slice(0, 12)
      .map(
        (h) => `
        <div class="history-item">
          <div>
            <div class="history-item__name">${h.questName}</div>
            <div class="history-item__date">${formatDate(h.date)}</div>
          </div>
          <div class="history-item__xp">+${h.xp} XP</div>
        </div>
      `
      )
      .join("");
  }
}

// ---------- Editable player name ----------
nameInput.addEventListener("input", () => {
  state.profile.name = nameInput.value;
  persist();

  document.getElementById("home-username").textContent = nameInput.value || "Joueur";
  document.getElementById("home-player-name").textContent = nameInput.value || "Joueur";
  document.getElementById("home-avatar").innerHTML = avatarInnerHTML();
  document.getElementById("quick-avatar-glyph").innerHTML = avatarInnerHTML();
  document.getElementById("profile-avatar").innerHTML = avatarInnerHTML();
});

nameInput.addEventListener("blur", () => {
  if (!nameInput.value.trim()) {
    nameInput.value = "Joueur";
    state.profile.name = "Joueur";
    persist();
  }
});
