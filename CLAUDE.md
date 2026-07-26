# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal single-user tracker for the Harry Browne permanent portfolio strategy
(equal-weight stocks / long-term bonds / gold / cash). React + Vite + Recharts,
no backend. All state lives in the browser's `localStorage`; optional
cross-device sync is a private GitHub Gist, read/written directly from the
client using a personal access token the user pastes into Settings.

This source tree was reconstructed in 2026-07 from a minified single-file
`index.html` build that was the only thing previously committed (every prior
commit was a whole-file re-upload via GitHub's web UI, no source). The
reconstruction was verified pixel- and behavior-identical to that build. Going
forward, commit source normally — don't collapse back to a single built file.

## Commands

```
npm install
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

No test suite exists. Verification so far has been manual/visual (screenshot
diffing against the prior build) — there's no `npm test`.

## Architecture

- `src/App.jsx` — owns all state (`holdings`, `settings`, `snapshots`, sync
  state) and the effects that persist it. Everything else is a fairly dumb
  view fed by props/callbacks. There's no state management library and no
  routing — `activeTab` is a plain string switched over in the `<main>` JSX.
- `src/lib/compute.js` — derives the dashboard view model (per-category
  share/target/deviation/action, balance score, month-over-month delta) from
  raw `holdings` + `settings` + `snapshots`. Pure function, no React.
- `src/lib/allocate.js` — the "Allocate New Funds" waterfall/proportional
  split algorithm. Also pure, also worth keeping pure — the Allocate screen's
  correctness depends on exact rounding behavior (rounds to nearest 100, then
  nudges the largest category to absorb the remainder so amounts sum exactly).
- `src/lib/storage.js` — localStorage read/write for portfolio data
  (`pp:data:v1`) and sync settings (`pp:sync:v1`), plus the default
  holdings/settings shape used to backfill missing fields on load.
- `src/lib/gistSync.js` — thin wrapper over the GitHub REST API (gists
  endpoint only). `App.jsx` handles the actual merge/conflict UX around it
  (first-connect merge prompt, debounced push, skip-next-push echo guard).
- `src/lib/format.js` — currency/percent formatting and the "smart" numeric
  expression parser (`parseExpression`) used by `SmartInput` — accepts things
  like `5万` or `50000+3000`, evaluated via a regex-gated `Function()` call.
  Any change here needs to keep the regex gate airtight since it's eval'ing
  user input.
- `src/index.css` — one global stylesheet, BEM-ish class names per section
  (`upd-*` for the Update form, `reb-*` for rebalance rows, `qa-*` for the
  quick-adjust popover, etc.). No CSS modules, no Tailwind.

### Data model

`holdings`: `{ stocks, bonds, gold, cash, updatedAt }` — all four are
JPY-denominated, overwrite-style values entered directly on the Update
screen (whatever the user reads off their brokerage / MMF app that day).
There is no incremental activity log and no stored exchange rate.

`cash` specifically represents the JPY-equivalent market value of a USD
money-market fund holding — money earmarked for investment, not everyday
spending cash (which this app deliberately does not track at all). Because
it's entered the same overwrite way as stocks/bonds/gold, FX moves and MMF
interest just show up as an ordinary month-over-month gain/loss for that
category, exactly like market moves do for the others. This replaced an
earlier design (`cashJPY` + `cashCNY` + a stored `jpyPerCny` rate, with an
incremental "activity" log for salary/remittances/living expenses) that
conflated investable cash with daily spending cash.

`settings`: `{ targetStocks, targetBonds, targetGold, targetCash, threshold }`
— no exchange rate field.

`snapshots`: one per calendar month, `{ ym, date, stocks, bonds, gold, cash }`.

## Editing conventions here

- Keep `lib/*` pure and React-free — `App.jsx` is the only place with
  `useState`/`useEffect`; components take computed values as props.
- The original app's UI copy is bilingual (Chinese labels, English subtitles)
  — match that pattern for new fields rather than picking one language.
- `formatCurrency`/`formatPercent` are the only formatters; don't inline
  `toLocaleString` elsewhere.
