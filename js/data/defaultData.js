// ============================================================
// DEFAULT DATA — factory for a brand new save, starter quests,
// and the full achievement catalogue.
// ============================================================

import { STATS } from "../core/config.js";
import { todayISO } from "../core/date.js";

export function createDefaultState() {
  const stats = {};
  Object.keys(STATS).forEach((key) => {
    stats[key] = { level: 1, xp: 0 };
  });

  return {
    profile: {
      name: "Joueur",
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
    quests: createStarterQuests(),
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
    },
    meta: {
      sessionStart: Date.now(),
      totalUsageMinutes: 0,
    },
  };
}

let questIdCounter = 1;
function nextQuestId() {
  return "q_" + Date.now().toString(36) + "_" + questIdCounter++;
}

function createStarterQuests() {
  return [
    {
      id: nextQuestId(),
      name: "Faire les devoirs",
      description: "Avancer sur un exercice ou une révision",
      category: "etudes",
      difficulty: "medium",
      xp: 30,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
    {
      id: nextQuestId(),
      name: "Séance de sport",
      description: "30 minutes d'activité physique",
      category: "sport",
      difficulty: "hard",
      xp: 55,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
    {
      id: nextQuestId(),
      name: "Boire assez d'eau",
      description: "Au moins 1.5L dans la journée",
      category: "sante",
      difficulty: "easy",
      xp: 15,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
    {
      id: nextQuestId(),
      name: "Session créative",
      description: "Dessiner, écrire ou composer 20 minutes",
      category: "creativite",
      difficulty: "medium",
      xp: 30,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
    {
      id: nextQuestId(),
      name: "Ranger son espace",
      description: "Remettre en ordre une pièce",
      category: "maison",
      difficulty: "easy",
      xp: 15,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
    {
      id: nextQuestId(),
      name: "Deep work",
      description: "1h de travail concentré sans distraction",
      category: "travail",
      difficulty: "epic",
      xp: 90,
      repeat: "daily",
      lastCompletedDate: null,
      createdAt: Date.now(),
    },
  ];
}

export function generateQuestId() {
  return nextQuestId();
}

// ---------- Achievements catalogue ----------
// `condition` receives a flat snapshot built by achievementSystem.buildSnapshot(state)
// `icon` is a key into js/ui/icons.js, not a raw glyph.
export const ACHIEVEMENTS = [
  { id: "first_step",    name: "Premier pas",            desc: "Compléter votre toute première quête", icon: "footprints", condition: (s) => s.totalQuestsCompleted >= 1 },
  { id: "first_level",   name: "Premier niveau",         desc: "Atteindre le niveau 2",                 icon: "star", condition: (s) => s.level >= 2 },
  { id: "xp_100",        name: "100 XP",                 desc: "Cumuler 100 XP au total",               icon: "sparkle", condition: (s) => s.totalXp >= 100 },
  { id: "xp_1000",       name: "1000 XP",                desc: "Cumuler 1000 XP au total",              icon: "star", condition: (s) => s.totalXp >= 1000 },
  { id: "xp_10000",      name: "10 000 XP",              desc: "Cumuler 10 000 XP au total",            icon: "sparkle", condition: (s) => s.totalXp >= 10000 },
  { id: "quests_100",    name: "100 quêtes",             desc: "Compléter 100 quêtes",                  icon: "sword", condition: (s) => s.totalQuestsCompleted >= 100 },
  { id: "streak_7",      name: "7 jours de suite",       desc: "Maintenir un streak de 7 jours",        icon: "flame", condition: (s) => s.streakCurrent >= 7 },
  { id: "streak_30",     name: "30 jours",               desc: "Maintenir un streak de 30 jours",       icon: "flame", condition: (s) => s.streakCurrent >= 30 },
  { id: "streak_100",    name: "100 jours",              desc: "Maintenir un streak de 100 jours",      icon: "flame", condition: (s) => s.streakCurrent >= 100 },
  { id: "all_categories",name: "Toutes les catégories",  desc: "Compléter une quête dans chaque catégorie", icon: "star", condition: (s) => s.categoriesCompleted >= 7 },
];
