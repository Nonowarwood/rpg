// ============================================================
// DEFAULT DATA — factory for a brand new save, the starter quest
// catalog (with tiered quests), and the achievement catalogue.
// ============================================================

import { STATS } from "../core/config.js";
import { todayISO } from "../core/date.js";

// Bump this whenever STARTER_QUESTS gains new entries: saves with an
// older catalogVersion get the missing quests appended at load (see
// mergeWithDefaults in core/state.js).
export const CATALOG_VERSION = 2;

export function createDefaultState() {
  const stats = {};
  Object.keys(STATS).forEach((key) => {
    stats[key] = { level: 1, xp: 0 };
  });

  return {
    profile: {
      name: "Joueur",
      photoURL: null,
      email: null,
      createdAt: Date.now(),
    },
    level: 1,
    xp: 0,
    totalXp: 0,
    streak: {
      current: 0,
      longest: 0,
      lastCompletionDate: null,
    },
    stats,
    quests: STARTER_QUESTS.map((q) => structuredClone(q)),
    catalogVersion: CATALOG_VERSION,
    history: [], // { id, questName, category, xp, date(ISO), timestamp }
    counters: {
      totalQuestsCompleted: 0,
      todayDate: todayISO(),
      todayXp: 0,
      todayQuestsCompleted: 0,
      focusTimeMinutes: 0,
    },
    achievements: {
      unlockedIds: [],
    },
    categoriesCompleted: [], // list of category keys that have >=1 completion ever
    settings: {
      soundEnabled: true,
      navPosition: "bottom", // "bottom" | "top"
    },
    meta: {
      sessionStart: Date.now(),
      totalUsageMinutes: 0,
    },
  };
}

let questIdCounter = 1;
export function generateQuestId() {
  return "q_" + Date.now().toString(36) + "_" + questIdCounter++;
}

// ============================================================
// STARTER QUEST CATALOG
// Two shapes:
//  - simple:  { difficulty, xp }                — one check per day
//  - tiered:  { tiers: [{ label, xp }, ...] }   — progressive grades
//    (500ml -> 1L -> 1,5L). Each tier checks off separately, awards
//    its own XP, and tier progress resets every day like any daily.
// Ids are stable ("starter_*") so catalog migrations can tell which
// quests a save already has.
// ============================================================
export const STARTER_QUESTS = [
  // ---------- Études ----------
  {
    id: "starter_devoirs", name: "Faire ses devoirs", description: "Avancer sur un exercice ou une révision",
    category: "etudes", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "15 min", xp: 10 },
      { label: "30 min", xp: 20 },
      { label: "1 h", xp: 35 },
    ],
  },
  {
    id: "starter_lecture", name: "Lire", description: "Un livre, pas un fil d'actualité",
    category: "etudes", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "10 pages", xp: 10 },
      { label: "25 pages", xp: 20 },
      { label: "50 pages", xp: 35 },
    ],
  },
  {
    id: "starter_langue", name: "Pratiquer une langue", description: "Appli, série en VO, conversation…",
    category: "etudes", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "10 min", xp: 10 },
      { label: "20 min", xp: 15 },
      { label: "30 min", xp: 25 },
    ],
  },

  // ---------- Sport ----------
  {
    id: "starter_sport", name: "Faire du sport", description: "Peu importe la discipline",
    category: "sport", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "30 min", xp: 20 },
      { label: "45 min", xp: 30 },
      { label: "1 h", xp: 45 },
    ],
  },
  {
    id: "starter_pompes", name: "Pompes", description: "En une ou plusieurs séries",
    category: "sport", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "10 pompes", xp: 10 },
      { label: "25 pompes", xp: 20 },
      { label: "50 pompes", xp: 35 },
    ],
  },
  {
    id: "starter_marche", name: "Marcher", description: "Compteur de pas ou estimation honnête",
    category: "sport", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "2 000 pas", xp: 10 },
      { label: "5 000 pas", xp: 20 },
      { label: "10 000 pas", xp: 40 },
    ],
  },
  {
    id: "starter_etirements", name: "S'étirer", description: "5 à 10 minutes suffisent",
    category: "sport", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },

  // ---------- Santé ----------
  {
    id: "starter_eau", name: "Boire de l'eau", description: "Objectif hydratation sur la journée",
    category: "sante", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "500 ml", xp: 10 },
      { label: "1 L", xp: 15 },
      { label: "1,5 L", xp: 25 },
    ],
  },
  {
    id: "starter_meditation", name: "Méditer", description: "Respiration, pleine conscience, calme",
    category: "sante", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "5 min", xp: 10 },
      { label: "10 min", xp: 15 },
      { label: "20 min", xp: 25 },
    ],
  },
  {
    id: "starter_sommeil", name: "Se coucher avant minuit", description: "Le vrai boss final",
    category: "sante", difficulty: "medium", xp: 30,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },
  {
    id: "starter_fruits", name: "Manger des fruits ou légumes", description: "Au moins une vraie portion",
    category: "sante", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },

  // ---------- Créativité ----------
  {
    id: "starter_creatif", name: "Session créative", description: "Dessiner, écrire, composer, monter…",
    category: "creativite", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "20 min", xp: 15 },
      { label: "40 min", xp: 25 },
      { label: "1 h", xp: 40 },
    ],
  },
  {
    id: "starter_instrument", name: "Pratiquer un instrument", description: "Gammes comprises",
    category: "creativite", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "15 min", xp: 10 },
      { label: "30 min", xp: 20 },
      { label: "1 h", xp: 35 },
    ],
  },
  {
    id: "starter_creation", name: "Créer quelque chose", description: "Photo, texte, objet — finir un petit truc",
    category: "creativite", difficulty: "medium", xp: 30,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },

  // ---------- Maison ----------
  {
    id: "starter_rangement", name: "Ranger", description: "Du bureau au logement entier",
    category: "maison", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "Son bureau", xp: 10 },
      { label: "Une pièce", xp: 20 },
      { label: "Tout le logement", xp: 35 },
    ],
  },
  {
    id: "starter_lit", name: "Faire son lit", description: "La première victoire de la journée",
    category: "maison", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },
  {
    id: "starter_vaisselle", name: "Faire la vaisselle", description: "Évier vide avant de dormir",
    category: "maison", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },

  // ---------- Travail ----------
  {
    id: "starter_deepwork", name: "Deep work", description: "Travail concentré, zéro distraction",
    category: "travail", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "30 min", xp: 20 },
      { label: "1 h", xp: 35 },
      { label: "2 h", xp: 60 },
    ],
  },
  {
    id: "starter_planif", name: "Planifier sa journée", description: "3 priorités posées le matin",
    category: "travail", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },
  {
    id: "starter_inbox", name: "Traiter ses e-mails", description: "Répondre ou classer, pas juste lire",
    category: "travail", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },

  // ---------- Personnel ----------
  {
    id: "starter_dehors", name: "Sortir prendre l'air", description: "Sans écran dans la main",
    category: "personnel", repeat: "daily", lastCompletedDate: null, tierProgress: 0, createdAt: 0,
    tiers: [
      { label: "15 min", xp: 10 },
      { label: "30 min", xp: 15 },
      { label: "1 h", xp: 25 },
    ],
  },
  {
    id: "starter_proche", name: "Prendre des nouvelles d'un proche", description: "Un message compte, un appel vaut double",
    category: "personnel", difficulty: "medium", xp: 30,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },
  {
    id: "starter_journal", name: "Écrire dans son journal", description: "Trois lignes suffisent",
    category: "personnel", difficulty: "easy", xp: 15,
    repeat: "daily", lastCompletedDate: null, createdAt: 0,
  },
];

// Names of the v1 starter quests (pre-catalog, random ids) — removed
// during migration because the v2 catalog re-covers them in tiered form.
export const LEGACY_STARTER_NAMES = new Set([
  "Faire les devoirs",
  "Séance de sport",
  "Boire assez d'eau",
  "Session créative",
  "Ranger son espace",
  "Deep work",
]);

// ============================================================
// ACHIEVEMENTS CATALOGUE
// `condition` receives the flat snapshot built by
// achievementSystem.buildSnapshot(state).
// `icon` is a key into js/ui/icons.js, not a raw glyph.
// ============================================================
export const ACHIEVEMENTS = [
  // ---------- Premiers pas ----------
  { id: "first_step",    name: "Premier pas",        desc: "Compléter votre toute première quête",      icon: "footprints", condition: (s) => s.totalQuestsCompleted >= 1 },
  { id: "first_level",   name: "Premier niveau",     desc: "Atteindre le niveau 2",                     icon: "star",       condition: (s) => s.level >= 2 },
  { id: "all_categories",name: "Touche-à-tout",      desc: "Compléter une quête dans chaque catégorie", icon: "sparkle",    condition: (s) => s.categoriesCompleted >= 7 },

  // ---------- Quêtes complétées ----------
  { id: "quests_10",   name: "Apprenti",        desc: "Compléter 10 quêtes",    icon: "sword", condition: (s) => s.totalQuestsCompleted >= 10 },
  { id: "quests_25",   name: "Aventurier",      desc: "Compléter 25 quêtes",    icon: "sword", condition: (s) => s.totalQuestsCompleted >= 25 },
  { id: "quests_50",   name: "Mercenaire",      desc: "Compléter 50 quêtes",    icon: "sword", condition: (s) => s.totalQuestsCompleted >= 50 },
  { id: "quests_100",  name: "Vétéran",         desc: "Compléter 100 quêtes",   icon: "sword", condition: (s) => s.totalQuestsCompleted >= 100 },
  { id: "quests_250",  name: "Champion",        desc: "Compléter 250 quêtes",   icon: "sword", condition: (s) => s.totalQuestsCompleted >= 250 },
  { id: "quests_500",  name: "Héros",           desc: "Compléter 500 quêtes",   icon: "sword", condition: (s) => s.totalQuestsCompleted >= 500 },
  { id: "quests_1000", name: "Légende vivante", desc: "Compléter 1 000 quêtes", icon: "crown", condition: (s) => s.totalQuestsCompleted >= 1000 },

  // ---------- XP cumulée ----------
  { id: "xp_100",   name: "Étincelle",        desc: "Cumuler 100 XP",     icon: "sparkle", condition: (s) => s.totalXp >= 100 },
  { id: "xp_500",   name: "Flamme naissante", desc: "Cumuler 500 XP",     icon: "sparkle", condition: (s) => s.totalXp >= 500 },
  { id: "xp_1000",  name: "Brasier",          desc: "Cumuler 1 000 XP",   icon: "sparkle", condition: (s) => s.totalXp >= 1000 },
  { id: "xp_2500",  name: "Fournaise",        desc: "Cumuler 2 500 XP",   icon: "zap",     condition: (s) => s.totalXp >= 2500 },
  { id: "xp_5000",  name: "Incendie",         desc: "Cumuler 5 000 XP",   icon: "zap",     condition: (s) => s.totalXp >= 5000 },
  { id: "xp_10000", name: "Supernova",        desc: "Cumuler 10 000 XP",  icon: "zap",     condition: (s) => s.totalXp >= 10000 },
  { id: "xp_25000", name: "Trou noir",        desc: "Cumuler 25 000 XP",  icon: "star",    condition: (s) => s.totalXp >= 25000 },
  { id: "xp_50000", name: "Big Bang",         desc: "Cumuler 50 000 XP",  icon: "star",    condition: (s) => s.totalXp >= 50000 },

  // ---------- Niveaux ----------
  { id: "level_5",  name: "Explorateur",   desc: "Atteindre le niveau 5",  icon: "flag",  condition: (s) => s.level >= 5 },
  { id: "level_10", name: "Grimpeur",      desc: "Atteindre le niveau 10", icon: "flag",  condition: (s) => s.level >= 10 },
  { id: "level_15", name: "Alpiniste",     desc: "Atteindre le niveau 15", icon: "flag",  condition: (s) => s.level >= 15 },
  { id: "level_20", name: "Élite",         desc: "Atteindre le niveau 20", icon: "crown", condition: (s) => s.level >= 20 },
  { id: "level_30", name: "Maître",        desc: "Atteindre le niveau 30", icon: "crown", condition: (s) => s.level >= 30 },
  { id: "level_40", name: "Grand Maître",  desc: "Atteindre le niveau 40", icon: "crown", condition: (s) => s.level >= 40 },
  { id: "level_50", name: "Ascendant",     desc: "Atteindre le niveau 50", icon: "crown", condition: (s) => s.level >= 50 },

  // ---------- Streak ----------
  { id: "streak_3",   name: "Élan",              desc: "3 jours d'affilée",           icon: "flame", condition: (s) => s.streakCurrent >= 3 },
  { id: "streak_7",   name: "Semaine parfaite",  desc: "7 jours d'affilée",           icon: "flame", condition: (s) => s.streakCurrent >= 7 },
  { id: "streak_14",  name: "Quinzaine de fer",  desc: "14 jours d'affilée",          icon: "flame", condition: (s) => s.streakCurrent >= 14 },
  { id: "streak_30",  name: "Mois de feu",       desc: "30 jours d'affilée",          icon: "flame", condition: (s) => s.streakCurrent >= 30 },
  { id: "streak_60",  name: "Inarrêtable",       desc: "60 jours d'affilée",          icon: "flame", condition: (s) => s.streakCurrent >= 60 },
  { id: "streak_100", name: "Centurion",         desc: "100 jours d'affilée",         icon: "flame", condition: (s) => s.streakCurrent >= 100 },
  { id: "streak_365", name: "Une année entière", desc: "365 jours d'affilée",         icon: "crown", condition: (s) => s.streakCurrent >= 365 },

  // ---------- Journées intenses ----------
  { id: "day_3",  name: "Bonne journée",     desc: "3 quêtes complétées dans la même journée",  icon: "check", condition: (s) => s.todayQuests >= 3 },
  { id: "day_6",  name: "Grosse journée",    desc: "6 quêtes complétées dans la même journée",  icon: "check", condition: (s) => s.todayQuests >= 6 },
  { id: "day_10", name: "Journée légendaire",desc: "10 quêtes complétées dans la même journée", icon: "zap",   condition: (s) => s.todayQuests >= 10 },

  // ---------- Attributs ----------
  { id: "stat_5",      name: "Spécialiste",   desc: "Monter un attribut au niveau 5",       icon: "chart", condition: (s) => s.maxStatLevel >= 5 },
  { id: "stat_10",     name: "Expert",        desc: "Monter un attribut au niveau 10",      icon: "chart", condition: (s) => s.maxStatLevel >= 10 },
  { id: "stat_20",     name: "Virtuose",      desc: "Monter un attribut au niveau 20",      icon: "chart", condition: (s) => s.maxStatLevel >= 20 },
  { id: "stat_all_5",  name: "Équilibre",     desc: "Tous les attributs au niveau 5",       icon: "users", condition: (s) => s.minStatLevel >= 5 },
  { id: "stat_all_10", name: "Renaissance",   desc: "Tous les attributs au niveau 10",      icon: "brain", condition: (s) => s.minStatLevel >= 10 },
];
