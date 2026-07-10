// ============================================================
// CONFIG — game balance constants and static definitions.
// Tweak these numbers to rebalance the whole game.
// ============================================================

// ---------- Player XP curve ----------
export const XP_BASE = 100;
export const XP_GROWTH = 155;

export function xpRequiredForLevel(level) {
  return XP_BASE + (level - 1) * XP_GROWTH;
}

// ---------- Stat (attribute) XP curve — stats level independently ----------
export const STAT_XP_BASE = 50;
export const STAT_XP_GROWTH = 60;

export function statXpRequiredForLevel(level) {
  return STAT_XP_BASE + (level - 1) * STAT_XP_GROWTH;
}

// ---------- Titles unlocked by player level ----------
export const TITLES = [
  { minLevel: 1, name: "Novice" },
  { minLevel: 5, name: "Explorer" },
  { minLevel: 10, name: "Adventurer" },
  { minLevel: 15, name: "Elite" },
  { minLevel: 20, name: "Veteran" },
  { minLevel: 30, name: "Master" },
  { minLevel: 40, name: "Legend" },
  { minLevel: 50, name: "Ascendant" },
  { minLevel: 65, name: "Myth" },
  { minLevel: 80, name: "Transcendent" },
];

export function titleForLevel(level) {
  let current = TITLES[0];
  for (const t of TITLES) {
    if (level >= t.minLevel) current = t;
  }
  return current.name;
}

// ---------- Quest categories ----------
export const CATEGORIES = {
  etudes:      { name: "Études",      icon: "📚", color: "#4C8DFF", stats: ["intelligence", "knowledge"] },
  sport:       { name: "Sport",       icon: "💪", color: "#FF5A6A", stats: ["strength", "health"] },
  sante:       { name: "Santé",       icon: "❤️", color: "#34E0A1", stats: ["health"] },
  creativite:  { name: "Créativité",  icon: "🎨", color: "#B463FF", stats: ["creativity"] },
  maison:      { name: "Maison",      icon: "🏠", color: "#FFC94C", stats: ["discipline"] },
  travail:     { name: "Travail",     icon: "💼", color: "#2BD9E6", stats: ["wealth", "discipline"] },
  personnel:   { name: "Personnel",   icon: "✨", color: "#FF7CD8", stats: ["social", "creativity"] },
};

// ---------- Quest difficulties ----------
export const DIFFICULTIES = {
  easy:   { name: "Facile",    xp: 15,  color: "#34E0A1" },
  medium: { name: "Moyenne",   xp: 30,  color: "#FFC94C" },
  hard:   { name: "Difficile", xp: 55,  color: "#FF5A6A" },
  epic:   { name: "Épique",    xp: 90,  color: "#B463FF" },
};

// ---------- RPG attributes ----------
export const STATS = {
  intelligence: { name: "Intelligence", icon: "🧠" },
  knowledge:    { name: "Knowledge",    icon: "📚" },
  strength:     { name: "Strength",     icon: "💪" },
  health:       { name: "Health",       icon: "❤️" },
  creativity:   { name: "Creativity",   icon: "🎨" },
  wealth:       { name: "Wealth",       icon: "💰" },
  social:       { name: "Social",       icon: "😊" },
  discipline:   { name: "Discipline",   icon: "⚡" },
};
