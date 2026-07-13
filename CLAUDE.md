# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Ascend** — a gamified "life RPG" web app (quests, XP, levels, RPG stats, achievements, streaks). Art direction is a deliberate Persona 5 pastiche ("Heist"): saturated red on true black, diagonal `clip-path` cuts on hero elements, condensed all-caps display type, diamond checkmarks, ribbon banners for big moments — not a generic glassmorphism dashboard. Mobile-first, works fine on desktop.

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

### Quest model: simple vs tiered

Quests come in two shapes. **Simple** quests have `{ difficulty, xp }` — one check per day. **Tiered** quests have `tiers: [{ label, xp }, ...]` instead (e.g. "Boire de l'eau": 500 ml → 1 L → 1,5 L) — each check completes the *current* tier, awards that tier's XP, and counts as one quest completion. `questTierInfo(quest)` is the one place tier progress is interpreted: progress only counts if `lastCompletedDate` is today, so tiered dailies reset each morning with **no rollover pass** — never read `quest.tierProgress` directly, it can be stale from a previous day. User-created quests (quest modal) are always simple; tiered quests come from the starter catalog only.

The starter catalog (`STARTER_QUESTS` in `js/data/defaultData.js`) uses stable `"starter_*"` ids and a `CATALOG_VERSION`. `mergeWithDefaults()` in `core/state.js` appends any missing starter quests to saves with an older `catalogVersion` (and drops the v1 pre-catalog starters by name via `LEGACY_STARTER_NAMES`). To ship new starter quests: add them to `STARTER_QUESTS` **and bump `CATALOG_VERSION`** — without the bump, existing saves never see them.

### Quest completion pipeline

`js/systems/questSystem.js#completeQuest()` is the central choke point: one call synchronously awards player XP (`xpSystem`), awards the quest's category stats (`statsSystem`), updates the streak (`streakSystem`), updates counters/history, checks achievement unlocks (`achievementSystem`), persists once, then emits a single `quest:completed` event carrying `{ quest, xpEarned, leveledUp, newAchievements }`. Use `xpEarned`, not `quest.xp` — for tiered quests the XP awarded is the tier's, and `quest.xp` doesn't exist. Anything that needs to react to a completed quest should hang off that event rather than re-deriving state.

### Achievements

`ACHIEVEMENTS` (~40 entries, `js/data/defaultData.js`) are pure predicates over the flat snapshot built by `achievementSystem.buildSnapshot()` (`totalQuestsCompleted`, `level`, `totalXp`, `streakCurrent`, `streakLongest`, `categoriesCompleted`, `todayQuests`, `maxStatLevel`, `minStatLevel`). To add an achievement that needs a new metric, extend the snapshot rather than reaching into `state` from a condition.

### Rendering pattern

No virtual DOM/diffing. Each `ui/*Screen.js` exports a `render*()` function that rebuilds its section's `innerHTML`/text from `state` on demand. `main.js#refreshAll()` calls every screen's render function; it's invoked on boot and after state-changing events (with a ~1.25s delay after quest completion so the in-place card animation — checkmark, fade, floating "+XP" popup — has time to play before the list is rebuilt underneath it).

The home screen's quest preview reuses `questCardHTML()` and `wireQuestCompletionHandlers()` exported from `js/ui/questsScreen.js` rather than duplicating card markup/logic — any change to quest card behavior should go there, not in `homeScreen.js`.

### Overlays

Level-up and achievement-unlock are both full-screen overlays (`js/ui/modals.js`) that share **one sequential queue** (`bigOverlayQueue`/`drainBigOverlayQueue`) so they never both go active at once — this matters because unlocking an achievement and leveling up can happen from the exact same quest completion (e.g. the `first_level` achievement fires the instant you hit level 2).

### Sound

`js/systems/soundSystem.js` synthesizes every SFX procedurally with the Web Audio API (oscillators + tight envelopes) — there are no audio files to ship, and `assets/sounds/` is an empty placeholder. The `AudioContext` is created lazily inside `playSound()`, and `playSound` additionally no-ops until the user's first pointer/key interaction — so calls from non-gesture paths (boot toasts, Firebase session-restore) are safely silent instead of spawning a suspended context with an autoplay warning. The sound names (`click`, `complete`, `achievement`, `levelup`, `notification`) are keys into the `SOUNDS` map — add new ones there. Sounds respect `state.settings.soundEnabled`, toggleable from the profile's Préférences section.

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

### Design system ("Heist")

- **One dominant accent, two functional ones.** `--accent-red` carries the brand; `--accent-yellow` means reward/done/unlocked; `--accent-cyan` is the "system tag" color, spent full-surface in exactly one place: the jagged paint splash behind the active nav tab (`.nav-btn--active::before` — the P5 "PRESS ANY BUTTON" cyan). Category colors (`config.js`) are deliberately kept out of red/yellow — those two hues are reserved for brand and reward, not available for a 7th quest category.
- **Heist lettering** (`js/ui/heistText.js`): titles render as per-letter spans that rotate/lift off the baseline, ~1 in 4 letters inverting into a white or red box (P5's ransom-note "LoAD GaME" look). Deterministic (seeded from index + char code) so re-renders never reshuffle a word. Static markup opts in with a `data-heist` attribute (hydrated at boot like `data-icon`); dynamic text calls `heistLetters()` — which HTML-escapes, so it's safe on user input (player name). Reserved for display-font titles (screen headers, section heads, player name, achievement names, overlay eyebrows) — never on body copy, buttons, or anything read at length.
- **Character silhouette** (`js/ui/characterFigure.js`): the stats screen shows a flat red P5-style silhouette rebuilt parametrically from stat levels — each of the 8 attributes drives exactly one visible transformation (strength = build/ab lines, intelligence = glasses, knowledge = book, creativity = hand sparks, wealth = gems, social = allied busts behind, discipline = ground/pedestal, health = pulse/aura). Tier thresholds are levels 3/5/8 (`tierFor`). It's pure SVG string generation from `state.stats` — no assets, no 3D. To make another stat visible, extend `characterSVG()` with a new layer; keep one clear visual per stat.
- **Backgrounds are geometry, not glow.** The fixed `.bg-fx` layer is a slowly rotating red conic spiral (the P5 "NEW GAME" swirl — also reused inside `.player-card__glow` and full-screen behind the level-up overlay), two parallel diagonal beams, a halftone dot burst, and grain — all at low opacity so content wins. No blurred color washes.
- **Stickers, not shadows.** Hard offsets do the lifting: `.btn-primary` carries a white `filter: drop-shadow(4px 4px 0 …)` (drop-shadow follows the clip-path; box-shadow would draw a rectangle), pressed state translates into the shadow. Toasts, stat tiles, and active chips sit 1–2° off-square via the individual `rotate` property — **never** via `transform`, which the entrance keyframes would overwrite (fill-mode replaces the whole transform list; `rotate` composes independently).
- **Sharp by default, diagonal on purpose.** `--radius-*` tokens are all `0` — corners are square unless a component explicitly opts into a `clip-path` diagonal cut. Cuts are reserved for hero elements (`.player-card`, `.btn-primary`, `.avatar-ring__circle`, achievement/level-up overlays, the `.quest-card` category tag, `.quest-check`) — most tiles (stat tiles, mini-stats, history rows, chips) stay plain bordered rectangles. Don't add a clip-path to every component; that's what made the first ("gold terminal") direction feel busier without being distinctive — the current look works because the cuts are rare enough to read as intentional.
- **Glow is spent once.** `--glow-gold` (used on unlocked achievements and the level-up moment) is the only soft blurred glow left in the system — `--glow-blue`/`--glow-violet`/`--glow-success` all resolve to `none`. Emphasis elsewhere comes from a thick (2px+) border or a solid fill, not a blur.
- **Two type families, one job each.** `--font-display` (Bungee, weight 400 only — never request another weight, it'll synthesize a fake bold) is for anything that should shout: headings, the player name, level numbers, section-head titles. Bungee draws very wide, so display sizes across the CSS are tuned smaller than a condensed face would need — if it looks oversized after a change, shrink the `font-size`, don't add negative letter-spacing. `--font-body` (Manrope) is for everything read at length or interacted with (buttons, labels, quest names) — bold/800 + uppercase + letter-spacing does the "graphic" work there instead of switching fonts. (History: Anton was tried first and rejected by the user as "trop Fortnite"; Bungee was picked from a 4-font comparison.)
- Icons (`js/ui/icons.js`) render with `stroke-linecap="square"`/`stroke-linejoin="miter"`, not rounded — matches the sharp-cut language. Don't revert to rounded caps for "softness"; that's the previous direction.
- **Motion language** (`animations.css`): entrances slide in off-axis with a slight `skewX` and snap straight (`screenIn`, `slideInRight`), lists cascade with an nth-child stagger ramp, and the level-up overlay opens on a hard red flash (`hitFlash` on `.overlay--levelup::before`). Keep new animations in this register — short (≤400ms), skew-and-snap, never floaty ease-in-out drifts. `prefers-reduced-motion` is globally respected via the kill-switch at the bottom of `animations.css`.

### Nav position preference

The tab bar sits at the bottom by default and can be moved to the top from the profile's Préférences section. The preference lives in `state.settings.navPosition` (`"bottom" | "top"`); `applyNavPosition()` in `js/ui/navigation.js` just stamps `body[data-nav-position=…]`, and **all** positional CSS differences live in `layout.css` under `body[data-nav-position="top"]` selectors (bar placement, indicator edge, `.screens` padding, toast stack offset). It's applied at boot, on preference click, and after cloud hydration (a cloud save can carry a different preference). If you add any new fixed-position chrome, give it a `body[data-nav-position="top"]` variant too.

**Attribute trap:** `data-nav` on an element means "clicking this navigates to that screen" — `initNavigation()` binds a click handler to *every* `[data-nav]` element. Never put a `data-nav` attribute on anything that isn't a navigation trigger (this once shipped as a bug: the body position flag was named `data-nav`, so every click anywhere bubbled to `<body>` and navigated to a nonexistent screen, blanking the app). `goToScreen()` now also refuses names that don't match a real `.screen[data-screen]` as a backstop.

### Desktop layout (≥1024px)

There is no sidebar — the nav stays a horizontal band at every width, centered to `--content-max-width`. Screens stop being one mobile column: home and profile become two-column grids (identity/preferences left, feed/data right — home via `grid-template-areas` in `screens.css`, profile via the `.profile-cols*` wrappers in `index.html`, which are `display: contents` on mobile so the single-column flow is untouched). Quest and achievement grids gain columns at 1024/1440.
