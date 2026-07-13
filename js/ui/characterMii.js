// ============================================================
// CHARACTER MII — Nintendo-Mii-style chibi avatar on the stats
// screen (big round head, large glossy eyes, tiny body), drawn as
// an inline SVG with soft gradients. Replaces the pixel sprite per
// user direction ("type Mii de Nintendo").
//
// Every attribute keeps one visible transformation (tiers 3/5/8):
//   strength     -> arms thicken, then go bare & flexed with biceps
//   health       -> expression: neutral -> smile -> grin + blush
//   intelligence -> Mii glasses (thin -> thick -> lens glint)
//   knowledge    -> floating book (closed -> open -> loose pages)
//   creativity   -> sparks near the right hand
//   wealth       -> gems stacking bottom-right
//   social       -> mini-buddy silhouettes behind
//   discipline   -> earbuds -> on-ear headset -> big studio cans
// ============================================================

import { state } from "../core/state.js";

const HAIR = "#1B1B20";
const SKIN_EDGE = "#EFC28C";
const NOSE = "#D9A05B";
const INK = "#26201C";
const JEANS = "#2A2C36";
const CREAM = "#F3F0E6";
const RED = "var(--accent-red)";
const RED_DARK = "var(--accent-red-dark)";
const RED_SOFT = "var(--accent-red-soft)";

function tierFor(level) {
  if (level >= 8) return 3;
  if (level >= 5) return 2;
  if (level >= 3) return 1;
  return 0;
}

function sparkle(x, y, s, color, opacity = 1) {
  return `<path d="M ${x} ${y - s} Q ${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q ${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q ${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q ${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z" fill="${color}" opacity="${opacity}"/>`;
}

function gem(x, y, s, filled) {
  const pts = `${x} ${y - s} ${x + s} ${y} ${x} ${y + s} ${x - s} ${y}`;
  return filled
    ? `<polygon points="${pts}" fill="${RED}" stroke="${RED_SOFT}" stroke-width="1.5"/>`
    : `<polygon points="${pts}" fill="none" stroke="${RED_SOFT}" stroke-width="2"/>`;
}

// Mini-buddy silhouette (social): chibi head + shoulders shadow.
function buddy(x, y, scale, opacity) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="${RED_DARK}" opacity="${opacity}">
    <circle cx="0" cy="0" r="14"/>
    <path d="M -18 34 Q -18 16 0 16 Q 18 16 18 34 Z"/>
  </g>`;
}

export function miiSVG() {
  const t = {};
  Object.keys(state.stats).forEach((k) => (t[k] = tierFor(state.stats[k].level)));
  const S = t.strength;

  const layers = [];

  // ---------- defs ----------
  layers.push(`<defs>
    <radialGradient id="mii-skin" cx="42%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#FADFB4"/>
      <stop offset="70%" stop-color="#F2CD98"/>
      <stop offset="100%" stop-color="${SKIN_EDGE}"/>
    </radialGradient>
    <linearGradient id="mii-tee" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E8203C"/>
      <stop offset="100%" stop-color="#B00D26"/>
    </linearGradient>
    <radialGradient id="mii-hair" cx="40%" cy="25%" r="90%">
      <stop offset="0%" stop-color="#2C2C33"/>
      <stop offset="100%" stop-color="${HAIR}"/>
    </radialGradient>
  </defs>`);

  // ---------- behind: buddies (social) ----------
  if (t.social >= 1) layers.push(buddy(50, 136, 1, 0.5));
  if (t.social >= 2) layers.push(buddy(190, 136, 1, 0.5));
  if (t.social >= 3) layers.push(buddy(26, 152, 0.8, 0.35));

  // ---------- ground shadow ----------
  layers.push(`<ellipse cx="120" cy="209" rx="46" ry="6" fill="#000" opacity="0.35"/>`);

  // ---------- body ----------
  // Arms first (behind the tee). Bare + flexed at strength tier 3.
  const armW = 12 + S * 2;
  if (S >= 3) {
    // Flexed bare arms: elbow low and out, fist raised (bicep curl).
    layers.push(`<g stroke="url(#mii-skin)" stroke-width="${armW}" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M 96 132 L 74 156 L 82 134"/>
      <path d="M 144 132 L 166 156 L 158 134"/>
    </g>
    <circle cx="82" cy="131" r="8.5" fill="url(#mii-skin)"/>
    <circle cx="158" cy="131" r="8.5" fill="url(#mii-skin)"/>
    <ellipse cx="86" cy="141" rx="10" ry="8" fill="url(#mii-skin)"/>
    <ellipse cx="154" cy="141" rx="10" ry="8" fill="url(#mii-skin)"/>`);
  } else {
    // Hanging arms in red sleeves, skin hands. Pushed outward as the
    // tee widens with strength so the hands never get swallowed.
    const ax = S * 3;
    layers.push(`<g stroke="url(#mii-tee)" stroke-width="${armW}" stroke-linecap="round" fill="none">
      <path d="M ${96 - ax} 132 Q ${86 - ax} 146 ${84 - ax} 164"/>
      <path d="M ${144 + ax} 132 Q ${154 + ax} 146 ${156 + ax} 164"/>
    </g>
    <circle cx="${84 - ax}" cy="168" r="6.5" fill="url(#mii-skin)"/>
    <circle cx="${156 + ax}" cy="168" r="6.5" fill="url(#mii-skin)"/>`);
  }

  // Tee (torso). Widens slightly with strength.
  const tw = 27 + S * 2; // torso half-width at shoulders
  layers.push(`<path d="M ${120 - tw} 130 Q ${120 - tw} 122 ${120 - tw + 8} 121 L ${120 + tw - 8} 121 Q ${120 + tw} 122 ${120 + tw} 130 L ${120 + tw + 2} 168 Q ${120 + tw + 2} 172 ${120 + tw - 3} 172 L ${120 - tw + 3} 172 Q ${120 - tw - 2} 172 ${120 - tw - 2} 168 Z" fill="url(#mii-tee)"/>`);
  // Collar.
  layers.push(`<path d="M 108 121 Q 120 130 132 121" fill="none" stroke="${RED_DARK}" stroke-width="3" stroke-linecap="round"/>`);
  // Pec/ab print on the tee (strength 1-2; tier 3 shows bare arms instead).
  if (S >= 1) {
    layers.push(`<path d="M 120 134 V 158" stroke="${RED_DARK}" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>`);
  }
  if (S >= 2) {
    layers.push(`<path d="M 106 138 Q 120 146 134 138 M 110 152 H 130" stroke="${RED_DARK}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.85"/>`);
  }

  // Jeans + shoes.
  layers.push(`<g fill="${JEANS}">
    <path d="M 98 170 H 117 V 196 Q 117 199 113 199 H 102 Q 98 199 98 196 Z"/>
    <path d="M 123 170 H 142 V 196 Q 142 199 138 199 H 127 Q 123 199 123 196 Z"/>
  </g>
  <g fill="${CREAM}">
    <path d="M 96 196 H 118 V 202 Q 118 206 113 206 H 100 Q 96 206 96 202 Z"/>
    <path d="M 122 196 H 144 V 202 Q 144 206 140 206 H 127 Q 122 206 122 202 Z"/>
  </g>`);

  // ---------- head ----------
  // Back hair (shaggy mass + jaw-length side locks).
  layers.push(`<g fill="url(#mii-hair)">
    <ellipse cx="120" cy="70" rx="57" ry="52"/>
    <path d="M 66 74 Q 58 104 66 122 L 84 100 Z"/>
    <path d="M 174 74 Q 182 104 174 122 L 156 100 Z"/>
  </g>`);

  // Ears (before headphones can cover them).
  layers.push(`<circle cx="74" cy="88" r="8" fill="url(#mii-skin)"/>
    <circle cx="166" cy="88" r="8" fill="url(#mii-skin)"/>`);

  // Face.
  layers.push(`<ellipse cx="120" cy="78" rx="47" ry="45" fill="url(#mii-skin)"/>`);

  // Front hair: swooping bangs with pointy tips (Mii/anime style).
  layers.push(`<path d="M 74 70 Q 74 36 102 30 Q 120 26 138 30 Q 166 36 166 70
    L 158 60 L 151 76 L 141 56 L 131 72 L 120 54 L 109 72 L 99 56 L 89 76 L 82 60 Z"
    fill="url(#mii-hair)"/>`);

  // Eyebrows.
  layers.push(`<g stroke="${HAIR}" stroke-width="4.5" stroke-linecap="round">
    <path d="M 88 66 L 106 63"/>
    <path d="M 134 63 L 152 66"/>
  </g>`);

  // Eyes: big glossy Mii eyes.
  layers.push(`<g>
    <ellipse cx="99" cy="86" rx="11" ry="13.5" fill="#FFFFFF"/>
    <ellipse cx="141" cy="86" rx="11" ry="13.5" fill="#FFFFFF"/>
    <ellipse cx="100" cy="87" rx="6" ry="9" fill="${INK}"/>
    <ellipse cx="140" cy="87" rx="6" ry="9" fill="${INK}"/>
    <circle cx="102.5" cy="83" r="2.4" fill="#FFFFFF"/>
    <circle cx="142.5" cy="83" r="2.4" fill="#FFFFFF"/>
  </g>`);

  // Nose.
  layers.push(`<path d="M 117.5 100 L 122.5 100 L 120 104.5 Z" fill="${NOSE}"/>`);

  // Mouth + cheeks (health).
  if (t.health >= 3) {
    layers.push(`<path d="M 110 110 Q 120 120 130 110" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="88" cy="102" rx="7" ry="4.5" fill="${RED_SOFT}" opacity="0.4"/>
      <ellipse cx="152" cy="102" rx="7" ry="4.5" fill="${RED_SOFT}" opacity="0.4"/>`);
  } else if (t.health >= 1) {
    layers.push(`<path d="M 112 111 Q 120 116 128 111" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`);
  } else {
    layers.push(`<path d="M 113 112 H 127" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`);
  }

  // ---------- glasses (intelligence) ----------
  if (t.intelligence >= 1) {
    const gw = t.intelligence >= 2 ? 5 : 3.5;
    layers.push(`<g fill="none" stroke="${INK}" stroke-width="${gw}">
      <rect x="85" y="72" width="29" height="27" rx="9"/>
      <rect x="126" y="72" width="29" height="27" rx="9"/>
      <path d="M 114 83 H 126 M 85 82 L 76 78 M 155 82 L 164 78"/>
    </g>`);
    if (t.intelligence >= 3) {
      layers.push(`<path d="M 91 78 L 97 91 M 132 78 L 138 91" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/>`);
    }
  }

  // ---------- headphones (discipline) ----------
  if (t.discipline === 1) {
    layers.push(`<circle cx="74" cy="88" r="4" fill="${INK}"/>
      <circle cx="166" cy="88" r="4" fill="${INK}"/>`);
  } else if (t.discipline === 2) {
    layers.push(`<path d="M 70 74 Q 120 8 170 74" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="72" cy="86" r="10" fill="${INK}" stroke="${CREAM}" stroke-width="3"/>
      <circle cx="168" cy="86" r="10" fill="${INK}" stroke="${CREAM}" stroke-width="3"/>`);
  } else if (t.discipline >= 3) {
    layers.push(`<path d="M 66 72 Q 120 2 174 72" fill="none" stroke="${CREAM}" stroke-width="9" stroke-linecap="round"/>
      <path d="M 66 72 Q 120 10 174 72" fill="none" stroke="${HAIR}" stroke-width="3" opacity="0.35"/>
      <circle cx="68" cy="86" r="14" fill="${CREAM}"/>
      <circle cx="172" cy="86" r="14" fill="${CREAM}"/>
      <circle cx="68" cy="86" r="8" fill="${INK}"/>
      <circle cx="172" cy="86" r="8" fill="${INK}"/>`);
  }

  // ---------- floating extras ----------
  if (t.knowledge >= 1) {
    if (t.knowledge === 1) {
      layers.push(`<g transform="translate(38 152) rotate(-10)">
        <rect x="-14" y="-10" width="28" height="20" rx="2" fill="${RED_DARK}" stroke="${CREAM}" stroke-width="2"/>
        <path d="M -8 -10 V 10" stroke="${CREAM}" stroke-width="2"/>
      </g>`);
    } else {
      layers.push(`<g transform="translate(38 152) rotate(-8)">
        <path d="M 0 -2 Q -12 -10 -22 -7 L -22 9 Q -12 6 0 12 Z" fill="${CREAM}" stroke="${RED_DARK}" stroke-width="2"/>
        <path d="M 0 -2 Q 12 -10 22 -7 L 22 9 Q 12 6 0 12 Z" fill="${CREAM}" stroke="${RED_DARK}" stroke-width="2"/>
      </g>`);
    }
    if (t.knowledge >= 3) {
      layers.push(`<rect x="24" y="122" width="12" height="9" rx="1.5" transform="rotate(-16 30 126)" fill="none" stroke="${CREAM}" stroke-width="1.5" opacity="0.7"/>
        <rect x="46" y="112" width="10" height="8" rx="1.5" transform="rotate(10 51 116)" fill="none" stroke="${CREAM}" stroke-width="1.5" opacity="0.5"/>`);
    }
  }

  if (t.creativity >= 1) layers.push(sparkle(208, 154, 9, "#FFFFFF"));
  if (t.creativity >= 2) layers.push(sparkle(216, 134, 6, RED_SOFT));
  if (t.creativity >= 3) layers.push(sparkle(200, 120, 5, "#FFFFFF", 0.8));

  if (t.wealth >= 1) layers.push(gem(200, 186, 8, false));
  if (t.wealth >= 2) layers.push(gem(188, 197, 6, false));
  if (t.wealth >= 3) layers.push(gem(206, 200, 5, true));

  return `<svg viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar du joueur" class="character-art">${layers.join("")}</svg>`;
}
