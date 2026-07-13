// ============================================================
// CHARACTER SPRITE — pixel-art hero on the stats screen, rendered
// to a <canvas> (scaled with image-rendering: pixelated). The body
// is generated from a mirrored half-grid so it stays symmetric, and
// every attribute drives one visible layer of the scene:
//   strength     -> broader build + pec/ab lines (tiers swap geometry)
//   health       -> heartbeat line, then radiant sparkles
//   intelligence -> glasses on the mask, then temples + lens glint
//   knowledge    -> floating book (closed -> open -> loose pages)
//   creativity   -> sparks near the right fist
//   wealth       -> gems stacking bottom-right
//   social       -> allied silhouettes stepping in behind
//   discipline   -> ground line -> platform -> lightning bolts
// Tier thresholds: level 3 / 5 / 8 (first change already at lvl 3).
// The white Joker mask is always on — it's the player's identity.
// ============================================================

import { state } from "../core/state.js";

const SCENE_W = 64;
const SCENE_H = 52;
const BODY_X = 19; // (64 - 26) / 2
const BODY_Y = 4;

const PALETTE = {
  W: "#F3F0E6", // cream outline / mask
  R: "#E0102E", // red body
  D: "#9C0A1F", // dark red (seams, book cover, ground)
  L: "#FF4A63", // light red (pulse, gems, glints)
  K: "#0B0B0C", // black detail (eyes, muscle cuts, glasses)
  A: "rgba(156, 10, 31, 0.55)", // allies (shadow silhouettes)
  P: "rgba(224, 16, 46, 0.28)", // platform fill
};

// 13-col left half of the 26px body. Rows: 0-3 hair, 4-11 head,
// 12-13 neck, 14-23 torso+arms+fists, 24-26 hips, 27-38 legs, 39-40 boots.
const BASE_HALF = [
  "........W...W",
  ".......WRW.WR",
  "......WRRRRRR",
  "......WRRRRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  "......WRRRRRR",
  ".......WRRRRR",
  ".........WRRR",
  ".........WRRR",
  "....WWWWWRRRR",
  "...WRRRDRRRRR",
  "...WRRRDRRRRR",
  "...WRRRDRRRRR",
  "...WRRW.WRRRR",
  "...WRRW.WRRRR",
  "...WRRW.WRRRR",
  "..WRRW...WRRR",
  "..WRRW...WRRR",
  "..WWWW...WRRR",
  ".....WRRRRRRR",
  ".....WRRRRRRR",
  ".....WWRRRRRR",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  "......WRRRRW.",
  ".....WRRRRRW.",
  ".....WWWWWWW.",
];

function tierFor(level) {
  if (level >= 8) return 3;
  if (level >= 5) return 2;
  if (level >= 3) return 1;
  return 0;
}

// Push the arm outline outward by 1px on torso rows (muscle bulk).
function widenTorso(half) {
  const out = [...half];
  for (let r = 14; r <= 23; r++) {
    const row = out[r];
    const core = row.replace(/^\.+/, "");
    let pad = 13 - core.length - 1;
    let body = core;
    if (pad < 0) {
      body = core.slice(-pad);
      pad = 0;
    }
    // Shoulder top (14) and fist bottom (23) extend their outline;
    // everything else gains red mass after the outline pixel.
    const filler = r === 14 || r === 23 ? "W" : "R";
    out[r] = ".".repeat(pad) + body[0] + filler + body.slice(1);
  }
  return out;
}

function buildBody(tier) {
  let half = [...BASE_HALF];
  if (tier >= 2) {
    half = widenTorso(half);
    for (let r = 27; r <= 38; r++) half[r] = ".....WRRRRRW.";
    half[39] = "....WRRRRRRW.";
    half[40] = "....WWWWWWWW.";
  }
  if (tier >= 3) {
    half = widenTorso(half);
    half[13] = ".......WWWRRR"; // traps beside the neck
  }
  const g = half.map((h) => (h + [...h].reverse().join("")).split(""));

  const put = (r, c, ch) => (g[r][c] = ch);
  const hset = (r, c0, c1, ch) => {
    for (let c = c0; c <= c1; c++) g[r][c] = ch;
  };

  // Joker mask (always): white band, black eye slits.
  hset(6, 8, 17, "W");
  hset(7, 8, 17, "W");
  put(7, 10, "K"); put(7, 11, "K");
  put(7, 14, "K"); put(7, 15, "K");
  hset(8, 9, 16, "W");

  // Muscle cuts.
  if (tier >= 1) {
    hset(17, 11, 14, "K");
    for (const r of [19, 20, 21, 22]) { put(r, 12, "K"); put(r, 13, "K"); }
  }
  if (tier >= 2) {
    for (const r of [19, 21]) { put(r, 10, "K"); put(r, 15, "K"); }
  }
  if (tier >= 3) {
    for (const r of [20, 22]) { put(r, 10, "K"); put(r, 15, "K"); }
    put(15, 6, "K"); put(15, 19, "K");
  }
  return g;
}

// ---------- Scene overlays (small hand-drawn stamps) ----------
const ALLY = [
  "..AAAA..",
  "..AAAA..",
  "..AAAA..",
  "...AA...",
  ".AAAAAA.",
  "AAAAAAAA",
  "AAAAAAAA",
  "AAAAAAAA",
];
const PULSE_1 = [
  ".....L........",
  "....LL........",
  "LLLL..L...LLLL",
  "......L..L....",
  "......LLL.....",
];
const PULSE_2 = [
  ".....L......L.....",
  "....LL.....LL.....",
  "LLLL..L...L..LLLLL",
  "......L..L........",
  "......LLL.........",
];
const BOOK_CLOSED = [
  "WWWWWWWW",
  "WRRWRRRW",
  "WRRWRRRW",
  "WRRWRRRW",
  "WWWWWWWW",
];
const BOOK_OPEN = [
  "WWWWW.WWWWW",
  "WWWWWWWWWWW",
  ".WWWWWWWWW.",
  "..DDDDDDD..",
];
const PAGE = ["WWW", "WWW"];
const SPARK_BIG = [
  "..W..",
  "..W..",
  "WWWWW",
  "..W..",
  "..W..",
];
const SPARK_SMALL = [".L.", "LLL", ".L."];
const GEM = [
  "..L..",
  ".L.L.",
  "L...L",
  ".L.L.",
  "..L..",
];
const GEM_FULL = [
  "..L..",
  ".LRL.",
  "LRRRL",
  ".LRL.",
  "..L..",
];
const BOLT = ["..W", ".W.", "WW.", ".W.", "..W"];

function stamp(scene, art, x, y) {
  art.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === ".") return;
      const sy = y + r;
      const sx = x + c;
      if (sy >= 0 && sy < SCENE_H && sx >= 0 && sx < SCENE_W) scene[sy][sx] = ch;
    });
  });
}

function buildScene() {
  const t = {};
  Object.keys(state.stats).forEach((k) => (t[k] = tierFor(state.stats[k].level)));

  const scene = Array.from({ length: SCENE_H }, () => Array(SCENE_W).fill("."));

  // Behind the hero: allied silhouettes (social).
  if (t.social >= 1) stamp(scene, ALLY, 7, 22);
  if (t.social >= 2) stamp(scene, ALLY, 49, 22);
  if (t.social >= 3) stamp(scene, ALLY, 1, 26);

  // Ground (discipline).
  if (t.discipline >= 2) {
    stamp(scene, ["P".repeat(44)], 10, 46);
    stamp(scene, ["P".repeat(40)], 12, 48);
  }
  if (t.discipline >= 1) stamp(scene, ["D".repeat(38)], 13, 45);
  if (t.discipline >= 3) {
    stamp(scene, BOLT, 6, 38);
    stamp(scene, BOLT, 55, 38);
  }

  // The hero.
  stamp(scene, buildBody(t.strength).map((r) => r.join("")), BODY_X, BODY_Y);

  // Glasses over the mask (intelligence). Mask rows are scene 10-12.
  if (t.intelligence >= 1) {
    stamp(scene, ["KKKK.KKKK"], 27, 10); // top rims + bridge gap
    stamp(scene, ["K", "K"], 27, 11);
    stamp(scene, ["K", "K"], 31, 11);
    stamp(scene, ["K", "K"], 32, 11);
    stamp(scene, ["K", "K"], 36, 11);
    stamp(scene, ["KKKK.KKKK"], 27, 12); // bottom rims
  }
  if (t.intelligence >= 2) {
    stamp(scene, ["KK"], 25, 11);
    stamp(scene, ["KK"], 37, 11);
  }
  if (t.intelligence >= 3) {
    stamp(scene, ["L"], 28, 11);
    stamp(scene, ["L"], 33, 11);
  }

  // Heartbeat (health), floating top-left.
  if (t.health === 1) stamp(scene, PULSE_1, 2, 8);
  if (t.health >= 2) stamp(scene, PULSE_2, 1, 8);
  if (t.health >= 3) {
    stamp(scene, SPARK_SMALL, 10, 18);
    stamp(scene, SPARK_SMALL, 51, 16);
    stamp(scene, SPARK_SMALL, 6, 34);
    stamp(scene, SPARK_SMALL, 55, 32);
  }

  // Floating book (knowledge), left of the hero.
  if (t.knowledge === 1) stamp(scene, BOOK_CLOSED, 4, 27);
  if (t.knowledge >= 2) stamp(scene, BOOK_OPEN, 3, 27);
  if (t.knowledge >= 3) {
    stamp(scene, PAGE, 5, 22);
    stamp(scene, PAGE, 11, 19);
  }

  // Creation sparks near the right fist (creativity).
  if (t.creativity >= 1) stamp(scene, SPARK_BIG, 48, 24);
  if (t.creativity >= 2) stamp(scene, SPARK_SMALL, 55, 20);
  if (t.creativity >= 3) stamp(scene, SPARK_SMALL, 52, 14);

  // Gems (wealth), bottom-right.
  if (t.wealth >= 1) stamp(scene, GEM, 55, 40);
  if (t.wealth >= 2) stamp(scene, GEM, 50, 44);
  if (t.wealth >= 3) stamp(scene, GEM_FULL, 57, 46);

  return scene;
}

// Renders the scene into `container`, reusing its canvas if present.
export function renderCharacterSprite(container) {
  let canvas = container.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = SCENE_W;
    canvas.height = SCENE_H;
    canvas.className = "character-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Avatar du joueur");
    container.appendChild(canvas);
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SCENE_W, SCENE_H);
  buildScene().forEach((row, y) => {
    row.forEach((ch, x) => {
      if (ch === ".") return;
      ctx.fillStyle = PALETTE[ch] || PALETTE.R;
      ctx.fillRect(x, y, 1, 1);
    });
  });
}
