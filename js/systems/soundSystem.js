// ============================================================
// SOUND SYSTEM — procedural SFX synthesized with the Web Audio
// API. No audio files to ship or load: every sound is a few
// oscillators with tight envelopes, tuned to the "heist" UI —
// short, dry, percussive; the level-up gets the one fanfare.
//
// The AudioContext is created lazily on the first play call,
// which always happens inside a user gesture (click/tap), so
// autoplay policies never block it. Everything is wrapped so a
// missing/failed Web Audio implementation degrades to silence.
// ============================================================

import { state } from "../core/state.js";

let ctx = null;

// Some sounds fire from non-gesture code paths (e.g. the toast shown
// when Firebase restores a session at boot). Creating an AudioContext
// there would just yield a suspended context and a console warning —
// so sounds stay silent until the user has actually interacted once.
let userHasInteracted = false;
["pointerdown", "keydown"].forEach((evt) =>
  window.addEventListener(evt, () => { userHasInteracted = true; }, { once: true, capture: true })
);

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// One enveloped oscillator note. `slide` glides the pitch to
// freq*slide over the note's duration (P5 menus love tiny glides).
function note(ac, { freq, type = "square", dur = 0.08, vol = 0.12, at = 0, slide = 1 }) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// Short filtered-noise hit (used to give clicks a percussive edge).
function tick(ac, { dur = 0.03, vol = 0.08, at = 0, freq = 3200 }) {
  const t0 = ac.currentTime + at;
  const size = Math.ceil(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, size, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);

  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.2;
  const gain = ac.createGain();
  gain.gain.value = vol;

  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

const SOUNDS = {
  // UI tap: dry percussive tick with a faint pitch.
  click(ac) {
    tick(ac, { dur: 0.025, vol: 0.07, freq: 3600 });
    note(ac, { freq: 1900, type: "triangle", dur: 0.035, vol: 0.05 });
  },

  // Quest complete: two-note upward stab.
  complete(ac) {
    note(ac, { freq: 660, type: "square", dur: 0.07, vol: 0.09 });
    note(ac, { freq: 990, type: "square", dur: 0.1, vol: 0.09, at: 0.07 });
    tick(ac, { dur: 0.03, vol: 0.05, freq: 2400 });
  },

  // Achievement: quick major arpeggio with a shine on top.
  achievement(ac) {
    const steps = [523.25, 659.25, 783.99, 1046.5];
    steps.forEach((f, i) => note(ac, { freq: f, type: "square", dur: 0.09, vol: 0.08, at: i * 0.07 }));
    note(ac, { freq: 2093, type: "triangle", dur: 0.22, vol: 0.05, at: 0.28 });
  },

  // Level up: rising sweep into a held two-note chord.
  levelup(ac) {
    note(ac, { freq: 220, type: "sawtooth", dur: 0.28, vol: 0.07, slide: 4 });
    note(ac, { freq: 523.25, type: "square", dur: 0.34, vol: 0.09, at: 0.26 });
    note(ac, { freq: 783.99, type: "square", dur: 0.34, vol: 0.08, at: 0.26 });
    note(ac, { freq: 1567.98, type: "triangle", dur: 0.4, vol: 0.05, at: 0.3 });
    tick(ac, { dur: 0.05, vol: 0.08, freq: 1800, at: 0.26 });
  },

  // Notification: soft single blip, deliberately quieter.
  notification(ac) {
    note(ac, { freq: 880, type: "sine", dur: 0.09, vol: 0.06 });
    note(ac, { freq: 1174.66, type: "sine", dur: 0.08, vol: 0.04, at: 0.06 });
  },
};

export function playSound(name) {
  if (!state.settings.soundEnabled || !userHasInteracted) return;
  const play = SOUNDS[name];
  if (!play) return;
  try {
    const ac = audioCtx();
    if (!ac) return;
    play(ac);
  } catch {
    /* sound is a progressive enhancement — never block gameplay */
  }
}
