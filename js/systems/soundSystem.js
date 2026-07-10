// ============================================================
// SOUND SYSTEM — progressive-enhancement audio layer.
// Drop files into assets/sounds/<name>.mp3 to enable them; a
// missing file simply fails silently (no crash, no console spam).
// ============================================================

import { state } from "../core/state.js";

const SOUND_FILES = {
  click: "assets/sounds/click.mp3",
  complete: "assets/sounds/complete.mp3",
  achievement: "assets/sounds/achievement.mp3",
  levelup: "assets/sounds/levelup.mp3",
  notification: "assets/sounds/notification.mp3",
};

const cache = new Map();

function getAudio(name) {
  if (!SOUND_FILES[name]) return null;
  if (!cache.has(name)) {
    const audio = new Audio(SOUND_FILES[name]);
    audio.preload = "none";
    cache.set(name, audio);
  }
  return cache.get(name);
}

export function playSound(name) {
  if (!state.settings.soundEnabled) return;
  const audio = getAudio(name);
  if (!audio) return;
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {
    /* sound is a progressive enhancement — never block gameplay */
  }
}
