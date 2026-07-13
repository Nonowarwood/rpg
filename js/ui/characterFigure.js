// ============================================================
// CHARACTER FIGURE — the player's P5-style flat red silhouette on
// the stats screen, rebuilt parametrically from stat levels. Every
// attribute drives one visible transformation:
//   strength     -> shoulders/arms widen, ab lines get carved
//   health       -> heartbeat line, then a radiant aura ring
//   intelligence -> glasses appear, then sharpen
//   knowledge    -> a floating book (closed -> open -> loose pages)
//   creativity   -> sparks around the right hand
//   wealth       -> gems stacking bottom-right
//   social       -> allied silhouettes stepping in behind
//   discipline   -> a ground line, then a pedestal and bolts
// Tiers follow the 3/5/8 thresholds (level 3 = first visible change,
// 5 = confirmed, 8 = maxed) so early levels already pay off visually.
// ============================================================

import { state } from "../core/state.js";

const RED = "var(--accent-red)";
const RED_DARK = "var(--accent-red-dark)";
const RED_SOFT = "var(--accent-red-soft)";
const VOID = "var(--bg-void)";
const WHITE = "var(--text-primary)";

function tierFor(level) {
  if (level >= 8) return 3;
  if (level >= 5) return 2;
  if (level >= 3) return 1;
  return 0;
}

// 4-point sparkle (the checkmark/pip diamond, star-stretched).
function spark(x, y, s, color, opacity = 1) {
  return `<path d="M ${x} ${y - s} L ${x + s * 0.3} ${y - s * 0.3} L ${x + s} ${y} L ${x + s * 0.3} ${y + s * 0.3} L ${x} ${y + s} L ${x - s * 0.3} ${y + s * 0.3} L ${x - s} ${y} L ${x - s * 0.3} ${y - s * 0.3} Z" fill="${color}" opacity="${opacity}"/>`;
}

function gem(x, y, s, filled) {
  return filled
    ? `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" transform="rotate(45 ${x} ${y})" fill="${RED}"/>`
    : `<rect x="${x - s}" y="${y - s}" width="${s * 2}" height="${s * 2}" transform="rotate(45 ${x} ${y})" fill="none" stroke="${RED_SOFT}" stroke-width="2"/>`;
}

// Allied bust silhouette (social): head + shoulder wedge.
function bust(x, opacity) {
  return `<g fill="${RED_DARK}" opacity="${opacity}">
    <circle cx="${x}" cy="96" r="11"/>
    <path d="M ${x - 17} 146 L ${x} 112 L ${x + 17} 146 Z"/>
  </g>`;
}

export function characterSVG() {
  const t = {};
  Object.keys(state.stats).forEach((k) => (t[k] = tierFor(state.stats[k].level)));

  const S = t.strength || 0;
  const sh = 32 + S * 5;          // shoulder half-width
  const armW = 9 + S * 2;         // arm stroke thickness
  const waist = 16 + S;           // waist half-width
  const legW = 13 + S;

  const parts = [];

  // ---- Depth layers (behind the figure) ----
  if (t.health >= 3) {
    parts.push(`<ellipse cx="120" cy="176" rx="98" ry="142" fill="none" stroke="${RED_SOFT}" stroke-width="2" stroke-dasharray="6 10" opacity="0.28"/>`);
  }
  if (t.social >= 3) parts.push(bust(50, 0.3));
  if (t.social >= 1) parts.push(bust(74, t.social >= 3 ? 0.55 : 0.4));
  if (t.social >= 2) parts.push(bust(166, t.social >= 3 ? 0.55 : 0.4));

  // ---- Ground (discipline) ----
  if (t.discipline >= 2) {
    parts.push(`<path d="M 65 318 L 175 318 L 168 330 L 58 330 Z" fill="${RED}" opacity="0.25"/>`);
  }
  if (t.discipline >= 1) {
    parts.push(`<path d="M 70 318 H 170" stroke="${RED}" stroke-width="3" opacity="0.55"/>`);
  }
  if (t.discipline >= 3) {
    parts.push(`<path d="M 52 296 L 44 308 L 51 308 L 43 322" stroke="${WHITE}" stroke-width="2.5" fill="none"/>`);
    parts.push(`<path d="M 188 296 L 196 308 L 189 308 L 197 322" stroke="${WHITE}" stroke-width="2.5" fill="none"/>`);
  }

  // ---- The figure itself (flat red) ----
  parts.push(`<g fill="${RED}">
    <path d="M 100 30 L 108 8 L 116 22 L 123 4 L 131 20 L 139 12 L 144 30 Z"/>
    <ellipse cx="120" cy="38" rx="19" ry="22"/>
    <rect x="112" y="56" width="16" height="14"/>
    <path d="M ${120 - sh} 88 L ${120 - sh + 7} 78 L ${120 + sh - 7} 78 L ${120 + sh} 88 L ${120 + waist} 148 L ${120 - waist} 148 Z"/>
    <path d="M 100 148 L 140 148 L 138 174 L 102 174 Z"/>
  </g>`);

  // Arms: shoulder -> elbow -> hand, square caps for the angular cut.
  const lsx = 120 - sh + 6;
  const rsx = 120 + sh - 6;
  parts.push(`<g stroke="${RED}" stroke-width="${armW}" stroke-linecap="square" fill="none">
    <path d="M ${lsx} 86 L ${120 - sh - 6} 120 L ${120 - sh + 2} 156"/>
    <path d="M ${rsx} 86 L ${120 + sh + 6} 120 L ${120 + sh - 2} 156"/>
  </g>`);
  if (S >= 2) {
    parts.push(`<ellipse cx="${120 - sh}" cy="103" rx="${armW * 0.55 + 3}" ry="13" fill="${RED}"/>`);
    parts.push(`<ellipse cx="${120 + sh}" cy="103" rx="${armW * 0.55 + 3}" ry="13" fill="${RED}"/>`);
  }

  // Legs + feet.
  parts.push(`<g stroke="${RED}" stroke-width="${legW}" stroke-linecap="square" fill="none">
    <path d="M 108 170 L 103 242 L 99 306"/>
    <path d="M 132 170 L 137 242 L 141 306"/>
  </g>
  <g fill="${RED}">
    <path d="M 105 302 L 105 314 L 80 314 L 92 302 Z"/>
    <path d="M 135 302 L 148 302 L 160 314 L 135 314 Z"/>
  </g>`);

  // ---- Muscle definition: black cut-lines carved into the red ----
  if (S >= 1) {
    const cuts = [`M 120 108 V 142`];
    if (S >= 2) cuts.push(`M 106 100 H 134`, `M 112 118 H 128`, `M 112 130 H 128`);
    if (S >= 3) {
      cuts.push(`M 112 108 V 140`, `M 128 108 V 140`);
      cuts.push(`M ${120 - sh + 10} 84 L ${120 - sh + 18} 96`, `M ${120 + sh - 10} 84 L ${120 + sh - 18} 96`);
    }
    parts.push(`<path d="${cuts.join(" ")}" stroke="${VOID}" stroke-width="2.5" fill="none"/>`);
  }

  // ---- Glasses (intelligence) ----
  if (t.intelligence >= 1) {
    const gw = t.intelligence >= 2 ? 2.5 : 2;
    const gfill = t.intelligence >= 2 ? "rgba(243,240,230,0.12)" : "none";
    parts.push(`<g stroke="${WHITE}" stroke-width="${gw}" fill="${gfill}">
      <rect x="103" y="31" width="14" height="11"/>
      <rect x="123" y="31" width="14" height="11"/>
      <path d="M 117 36 H 123 M 103 34 L 100 32 M 137 34 L 140 32" fill="none"/>
    </g>`);
    if (t.intelligence >= 3) {
      parts.push(`<path d="M 106 34 L 110 39 M 126 34 L 130 39" stroke="${WHITE}" stroke-width="1.5" opacity="0.85"/>`);
    }
  }

  // ---- Floating book (knowledge) ----
  if (t.knowledge >= 1) {
    if (t.knowledge === 1) {
      parts.push(`<g transform="translate(40 234) rotate(-12)">
        <rect x="-16" y="-11" width="32" height="22" fill="${RED_DARK}" stroke="${RED_SOFT}" stroke-width="2"/>
        <path d="M -10 -11 V 11" stroke="${RED_SOFT}" stroke-width="2"/>
      </g>`);
    } else {
      parts.push(`<g transform="translate(42 234) rotate(-8)">
        <path d="M 0 -2 L -26 -12 L -26 10 L 0 18 Z" fill="${RED_DARK}" stroke="${RED_SOFT}" stroke-width="2"/>
        <path d="M 0 -2 L 26 -12 L 26 10 L 0 18 Z" fill="${RED_DARK}" stroke="${RED_SOFT}" stroke-width="2"/>
        <path d="M 0 -2 V 18" stroke="${RED_SOFT}" stroke-width="2"/>
      </g>`);
    }
    if (t.knowledge >= 3) {
      parts.push(`<rect x="24" y="196" width="13" height="9" transform="rotate(-18 30 200)" fill="none" stroke="${WHITE}" stroke-width="1.5" opacity="0.7"/>`);
      parts.push(`<rect x="52" y="184" width="11" height="8" transform="rotate(12 57 188)" fill="none" stroke="${WHITE}" stroke-width="1.5" opacity="0.5"/>`);
    }
  }

  // ---- Sparks around the right hand (creativity) ----
  if (t.creativity >= 1) {
    const hx = 120 + sh + 14;
    parts.push(spark(hx, 142, 9, WHITE));
    if (t.creativity >= 2) parts.push(spark(hx + 13, 121, 6, RED_SOFT));
    if (t.creativity >= 3) parts.push(spark(hx - 2, 106, 5, WHITE, 0.8));
  }

  // ---- Gems (wealth) ----
  if (t.wealth >= 1) parts.push(gem(198, 294, 9, false));
  if (t.wealth >= 2) parts.push(gem(183, 308, 7, false));
  if (t.wealth >= 3) parts.push(gem(206, 310, 6, true));

  // ---- Heartbeat (health) ----
  if (t.health >= 1) {
    const pulse = t.health >= 2 ? "M 20 84 L 36 84 L 43 70 L 51 96 L 57 84 L 66 84 L 70 78 L 75 84 L 86 84" : "M 22 84 L 38 84 L 45 70 L 53 96 L 59 84 L 76 84";
    parts.push(`<path d="${pulse}" stroke="${RED_SOFT}" stroke-width="2.5" fill="none"/>`);
  }

  return `<svg viewBox="0 0 240 336" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar du joueur">${parts.join("")}</svg>`;
}
