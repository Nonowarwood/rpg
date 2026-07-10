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
      -> core/*   (state singleton, event bus, storage, config, date helpers)
      -> data/*   (default save shape, starter quests, achievement catalogue)
```

`ui/` modules query the DOM and add event listeners **at module top level** (not inside a DOMContentLoaded handler) — this only works because `main.js` is the sole `<script type="module">` and is placed at the end of `<body>`, so the DOM is guaranteed parsed before any module body runs. Keep that ordering if you touch `index.html`.

### State

`js/core/state.js` exports one mutable singleton object, `state`, hydrated from `localStorage` on load (merged with `createDefaultState()` from `js/data/defaultData.js` so old saves gain new fields safely). Systems mutate `state` directly, then call `persist()` (debounced write + emits `state:changed`, which nothing currently subscribes to — screens are refreshed explicitly, not reactively).

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

## Conventions

- All UI copy is in French.
- CSS is split by concern (`variables.css` = design tokens only, `base.css` = reset, `animations.css` = keyframes, `components.css` = reusable components, `layout.css` = app shell/nav/responsive, `screens.css` = screen-specific overrides) — put new styles in the matching file rather than wherever's convenient.
- Category/difficulty color accents flow through CSS custom properties set inline per element (`--card-accent`, `--pill-accent`) and consumed via `var(--x, fallback)` in `components.css`, not hardcoded per-category classes.
