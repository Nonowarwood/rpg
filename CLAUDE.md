# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Ascend** — a gamified "life RPG" web app (quests, XP, levels, RPG stats, achievements, streaks). Premium dark UI inspired by Persona 5 / Persona 3 Reload / Metaphor: ReFantazio / Honkai Star Rail — glassmorphism, tilted cards, glow, heavy animation. Mobile-first, works fine on desktop.

Vanilla HTML/CSS/JS only. No framework, no bundler, no package.json, no build step.

## Running it

There is no server or build command. Because `index.html` loads `js/main.js` as an ES module (`<script type="module">`), it must be served over `http://` — opening the file directly (`file://`) will fail with CORS module-loading errors in most browsers.

```bash
python3 -m http.server 8000   # from the project root
# then open http://localhost:8000
```

There is no test suite, linter, or build step in this repo.

## Architecture

Strict layered dependency direction, all wired through plain ES module imports (`.js` extensions required in every import path):

```
main.js  (bootstrap: wires eventBus events -> UI feedback, initial render)
  -> ui/*         (renders DOM from state; owns all document.getElementById/querySelector calls)
    -> systems/*  (game logic: mutates state, emits events, never touches DOM)
      -> core/*   (state singleton, event bus, storage, config, date helpers, Firebase SDK init)
      -> data/*   (default save shape, starter quests, achievement catalogue)
```

`ui/` modules query the DOM and add event listeners **at module top level** (not inside a DOMContentLoaded handler) — this only works because `main.js` is the sole `<script type="module">` and is placed at the end of `<body>`, so the DOM is guaranteed parsed before any module body runs. Keep that ordering if you touch `index.html`.

### State

`js/core/state.js` exports one mutable singleton object, `state`, hydrated from `localStorage` on load (merged with `createDefaultState()` from `js/data/defaultData.js` so old saves gain new fields safely). Systems mutate `state` directly, then call `persist()` (debounced write + emits `state:changed`; `js/systems/cloudSync.js` is the one subscriber — screens themselves are still refreshed explicitly via `refreshAll()`, not reactively).

`state` is a `const` binding shared by every module that imports it, so nothing may ever reassign it. Cloud hydration (`hydrateFromCloud()`) mutates it in place — deletes every key, then `Object.assign`s the merged replacement — specifically so the same object reference stays valid everywhere.

Game balance (XP curve, categories, difficulties, titles, stat list) lives entirely in `js/core/config.js` — that's the one file to edit to rebalance the game.

Date/streak logic always goes through `js/core/date.js` (`todayISO`/`yesterdayISO`), which uses **local** calendar-day boundaries, not `toISOString()`/UTC. Don't reintroduce `toISOString().slice(0,10)` for "today" checks — it flips at UTC midnight, not the user's midnight, and silently breaks streaks for non-UTC users.

### Event bus (`js/core/eventBus.js`)

Systems emit events after mutating state (`quest:completed`, `quest:created`, `quest:deleted`, `streak:updated`, `stat:levelup`, `level:up`, `xp:gained`); `main.js` is the only subscriber and is where all cross-cutting feedback lives (toasts, level-up/achievement overlays, scheduling the deferred `refreshAll()`). UI screen modules do not listen on the bus themselves.

### Quest completion pipeline

`js/systems/questSystem.js#completeQuest()` is the central choke point: one call synchronously awards player XP (`xpSystem`), awards the quest's category stats (`statsSystem`), updates the streak (`streakSystem`), updates counters/history, checks achievement unlocks (`achievementSystem`), persists once, then emits a single `quest:completed` event carrying `{ quest, leveledUp, newAchievements }`. Anything that needs to react to a completed quest should hang off that event rather than re-deriving state.

### Rendering pattern

No virtual DOM/diffing. Each `ui/*Screen.js` exports a `render*()` function that rebuilds its section's `innerHTML`/text from `state` on demand. `main.js#refreshAll()` calls every screen's render function; it's invoked on boot and after state-changing events (with a ~1.25s delay after quest completion so the in-place card animation — checkmark, fade, floating "+XP" popup — has time to play before the list is rebuilt underneath it).

The home screen's quest preview reuses `questCardHTML()` and `wireQuestCompletionHandlers()` exported from `js/ui/questsScreen.js` rather than duplicating card markup/logic — any change to quest card behavior should go there, not in `homeScreen.js`.

### Overlays

Level-up and achievement-unlock are both full-screen overlays (`js/ui/modals.js`) that share **one sequential queue** (`bigOverlayQueue`/`drainBigOverlayQueue`) so they never both go active at once — this matters because unlocking an achievement and leveling up can happen from the exact same quest completion (e.g. the `first_level` achievement fires the instant you hit level 2).

### Sound

`js/systems/soundSystem.js` looks for files in `assets/sounds/{click,complete,achievement,levelup,notification}.mp3` and fails silently if they're missing — no sound assets are checked in yet (see `assets/sounds/README.txt`).

### Icons

`js/ui/icons.js` is the only source of icon markup — a hand-authored set of inline-SVG line icons keyed by name (`icon("flame", { size: 18 })`). There are no emoji anywhere in the app; `config.js`/`defaultData.js` store an icon *key* (e.g. `"book"`) on categories/stats/achievements, never a glyph. Markup that's static in `index.html` (nav bar, home stat tiles) instead uses `<span data-icon="flame" data-icon-size="18">`, filled once at boot by `hydrateStaticIcons()`. Add new icons to `icons.js`'s `PATHS` map, never inline an emoji or a one-off `<svg>` in a screen module.

### Google sign-in + Firestore cloud sync

Firebase (Auth + Firestore) is loaded straight from Google's CDN as ES modules in `js/core/firebase.js` (`https://www.gstatic.com/firebasejs/<version>/firebase-*.js`) — no npm/bundler involved, so this doesn't violate the no-build-step constraint. `js/systems/authSystem.js` wraps `onAuthStateChanged`/`signInWithPopup`/`signOut` and emits `auth:changed` on the event bus; `js/systems/cloudSync.js` is the only subscriber to both `auth:changed` and `state:changed`.

localStorage stays the source of truth for offline/guest play — Firestore is a best-effort mirror on top, not a replacement:
- **Sign-in with no existing cloud doc**: current local state (including guest progress made before signing in) is pushed to `users/{uid}` as the first save.
- **Sign-in with an existing cloud doc**: cloud data **replaces** local state via `hydrateFromCloud()` (cloud is authoritative once it exists — no merge UI). This emits `state:hydrated`, which `main.js` uses to force a `refreshAll()`.
- **Every subsequent local change**: debounced (1s) push to Firestore while signed in. There is no realtime listener/multi-tab sync — a second device only sees updates the next time it signs in there. Don't add `onSnapshot` without also guarding against the write-back feedback loop (a pulled snapshot would otherwise immediately re-trigger `state:changed` → push).

The player's avatar (`js/ui/avatar.js`) renders `state.profile.photoURL` (set from the Google account on sign-in) when present, falling back to a colored initial otherwise — this is the only place avatar rendering logic lives; `homeScreen.js` and `profileScreen.js` both call into it rather than duplicating the `<img>`-vs-initial branch.

**Setup required outside this repo**: a Firebase project with Google sign-in enabled (Authentication → Sign-in method), a Firestore database, `nonowarwood.github.io` (and any other deploy domain) added under Authentication → Settings → Authorized domains, and Firestore security rules restricting each `users/{uid}` doc to its own owner:
```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Conventions

- All UI copy is in French.
- CSS is split by concern (`variables.css` = design tokens only, `base.css` = reset, `animations.css` = keyframes, `components.css` = reusable components, `layout.css` = app shell/nav/responsive, `screens.css` = screen-specific overrides) — put new styles in the matching file rather than wherever's convenient.
- Category/difficulty color accents flow through CSS custom properties set inline per element (`--card-accent`, `--pill-accent`) and consumed via `var(--x, fallback)` in `components.css`, not hardcoded per-category classes.
