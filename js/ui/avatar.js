// ============================================================
// AVATAR — renders the player's avatar as their Google profile
// photo when signed in, falling back to a colored initial
// otherwise. Shared by the home header, home player card, and
// the profile card so all three stay in sync automatically.
// ============================================================

import { state } from "../core/state.js";

export function avatarInitial() {
  return (state.profile.name || "?").trim().charAt(0).toUpperCase() || "?";
}

export function avatarInnerHTML() {
  if (state.profile.photoURL) {
    return `<img src="${state.profile.photoURL}" alt="" referrerpolicy="no-referrer" />`;
  }
  return avatarInitial();
}
