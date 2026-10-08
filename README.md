# SMM Flag Quiz

A responsive, keyboard-first flag quiz with a dark mint-accented interface, local SVG flags, and no application dependencies.

## Play

Open **index.html** in a modern browser. All flags and game code work locally, including offline. An optional Google Fonts stylesheet falls back to system fonts when offline.

Alternatively, with Node.js 18 or newer:

```sh
npm start
```

Then visit http://localhost:4173. On Windows where PowerShell blocks npm.ps1, use `npm.cmd start`, or run `node scripts/serve.cjs` directly.

## Rules

- Select a region to begin. Flags are preloaded before the stopwatch starts.
- Type a correct name or approved alias to advance immediately, without Enter.
- Matching ignores case, outer whitespace, repeated spaces, accents, periods, apostrophes, and normal hyphen/space variations. It never uses fuzzy matching.
- Enter submits a wrong guess. Enter on a blank field or the Skip button skips.
- Wrong/skipped flags reveal the name for 1.4 seconds, while the stopwatch continues. They are randomly reinserted after the next queued flag, so they cannot repeat immediately unless only one remains.
- Only correctly identified countries leave the pool. Completion requires every country.
- The stopwatch freezes at the final correct answer. Play Again starts a fresh shuffled run in the same region; Change Region returns to selection.
- Personal best times are saved per region in this browser when local storage is available.

## Country set and continent policy

Exactly **195 states**: the **193 UN members plus Palestine and Vatican City**. No territories, dependencies, Kosovo or Taiwan are included in this explicitly requested set.

| Region | Countries |
| --- | ---: |
| Africa | 54 |
| Asia | 48 |
| Europe | 44 |
| North America | 23 |
| South America | 12 |
| Oceania | 14 |
| World | 195 |

Each country belongs to exactly one continent, using [UN M49 geographic groupings](https://unstats.un.org/unsd/methodology/m49/). North America combines Northern America, Central America and the Caribbean. Russia is in Europe. Türkiye, Cyprus, Armenia, Azerbaijan, Georgia and Kazakhstan are in Asia. Egypt is in Africa. The [UN observer-state listing](https://www.un.org/en/about-us/non-member-states) documents Palestine and the Holy See; the game uses the familiar name Vatican City.

The curated list and explicit English aliases live in `countries.js`. Ambiguous answers such as “Korea” are not accepted. “Congo” means Republic of the Congo; use DRC or DR Congo for Democratic Republic of the Congo.

## Assets

All 195 flag SVGs in `assets/flags/` are downloaded from [FlagCDN](https://flagcdn.com/) (the [Flagpedia.net](https://flagpedia.net/download/api) flag service). Their original proportions are preserved in the quiz. The download tool validates SVG responses and supports retries. To restore missing files:

```sh
node scripts/download-flags.cjs
```

The optional fonts are DM Sans and Manrope from Google Fonts. Decorative globe artwork and the app icon are original SVGs.

## Verification

```sh
node --test tests/*.test.cjs
```

Tests cover the exact country whitelist, continent totals, aliases and spelling rejection, unique completion, skip/retry invariants, randomized reinsertion, repeated misses of the final flag, continuous timing, immediate finish, restart, timer formatting, and all local assets.

Browser checks use a separate headless installation of Chrome and verify desktop/mobile layouts, keyboard flow, completion, restart, and offline play. With Chrome installed, run `npm install` followed by `npx playwright test` (use `npm.cmd` / `npx.cmd` if required on Windows). Review images are saved in `screenshots/`. These development dependencies are not needed to play the game.

`engine.js` is independent of the DOM and uses injected randomness/clock functions for deterministic tests. The app is static HTML, CSS and JavaScript, so it can also be hosted by any static web host.
