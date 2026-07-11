// ============================================================
// NOTIFICATIONS — elegant stacking toasts.
// Call showToast() for lightweight feedback (XP gain, quest
// complete, new title...). Big moments (level up, achievement)
// use the full-screen overlays in modals.js instead.
// ============================================================

import { playSound } from "../systems/soundSystem.js";
import { icon } from "./icons.js";

const stack = document.getElementById("notification-stack");
const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 3200;

const TYPE_ICON = {
  xp: "sparkle",
  quest: "sword",
  level: "star",
  achievement: "star",
  title: "crown",
  streak: "flame",
  stat: "chart",
};

export function showToast({ type = "xp", title, desc = "", sound = "notification", icon: iconOverride } = {}) {
  if (!stack) return;

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icon(iconOverride || TYPE_ICON[type] || "sparkle", { size: 20 })}</span>
    <span class="toast__body">
      <span class="toast__title">${title}</span>
      ${desc ? `<span class="toast__desc">${desc}</span>` : ""}
    </span>
  `;

  stack.appendChild(toast);
  playSound(sound);

  // Cap the number of simultaneously visible toasts.
  while (stack.children.length > MAX_VISIBLE) {
    stack.removeChild(stack.firstChild);
  }

  setTimeout(() => dismissToast(toast), AUTO_DISMISS_MS);
}

function dismissToast(toast) {
  if (!toast.isConnected) return;
  toast.classList.add("toast--leaving");
  setTimeout(() => toast.remove(), 200);
}
