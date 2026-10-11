# Runway

**Make ₹10,000 last 30 days.** A personal finance simulator for Gen Z where every money decision has visible, connected consequences.

Most budgeting apps only record what you already spent. Runway lets you **simulate a decision before you make it** and shows how it changes your balance, daily allowance, month-end forecast, savings goals, financial risk and health score, all at once.

**Live demo:** _add your Netlify/Vercel link here_

---

## The scenario

You play **Aarav**, a college student in Delhi, on day 1 of a 30-day month with ₹10,000 in pocket money. Upcoming commitments include:

- Hostel mess share (₹3,000, day 5)
- Phone recharge (₹299, day 10)
- Study loan EMI (₹800, day 15)
- Netflix, Spotify and Gym subscriptions

After commitments, only about ₹4,900 is safe to spend, so every choice matters.

## Features

- **Home:** safe-to-spend number, daily allowance, balance, risk level, health score, a 30-day timeline of dues, and quick actions (Next day, Throw me a curveball, +₹1,000 side gig, Reset). A "Month Complete" summary appears on day 30.
- **Simulate before you spend:** test a one-time purchase, a new subscription, a daily habit, pausing a subscription, a goal contribution, or a shock expense. See Now vs After for daily allowance, month-end forecast, risk and health, then Commit or Discard.
- **Sleep on it:** for purchases and subscriptions, shows what waiting until a later day does (and honestly, what it doesn't do).
- **Spend:** log expenses, mark them as need or want, and see category totals.
- **Plan:** commitments and subscriptions with pause/resume, plus a calendar of upcoming dues.
- **Goals:** progress and projected completion that reacts to your spending.
- **Forecast and health:** best, expected and worst month-end scenarios, a health score broken into five weighted parts, and prioritised next steps.
- **Curveballs:** random shocks (cracked phone, wedding gift, doctor visit) to stress-test your plan.
- **Persistence:** state is saved in `localStorage`, with corrupted data falling back to the starting scenario.

## How the numbers work

Everything is derived from one state object by pure functions in `src/domain/`. Nothing derived is stored.

| Value | Definition |
|---|---|
| **Safe to spend** | Balance, minus unpaid active commitments and subscriptions, minus remaining daily habit costs |
| **Daily allowance** | Safe to spend ÷ days remaining (never below ₹0) |
| **Burn rate** | Average everyday spend per day, blended with a ₹100/day prior (worth 3 days) so early days aren't misleading. One-off purchases and shocks are excluded. |
| **Forecast** | Safe to spend − burn × days remaining, under three scenarios (burn × 0.8, × 1.0, × 1.3) |
| **Risk** | **Low:** forecast ≥ ₹1,000. **Watch:** ₹0 to ₹1,000. **High:** below ₹0. **Critical:** below ₹0 and runway under 60% of the days left |
| **Health score (0 to 100)** | Runway coverage 30%, needs vs wants 20%, savings progress 20%, commitment coverage 15%, spending consistency 15% |

The same `apply()` function is used for previewing and for committing a decision, so a simulation can never disagree with what actually happens.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript (strict)
- State: `useReducer` + Context
- Styling: plain CSS with custom properties (design tokens), with light and dark themes
- Charts: hand-written inline SVG (no chart library)
- Tests: [Vitest](https://vitest.dev/)
- No backend and no external APIs

## Getting started

Requires **Node.js 18 or newer**.

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (usually http://localhost:5173).

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm test` | Run the domain test suite |
| `npm run build` | Type-check and create the production bundle in `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
  domain/          Pure TypeScript, no React
    types.ts         State and decision types
    seed.ts          Starting scenario and shock events
    selectors.ts     summary(): all derived numbers
    simulate.ts      apply(), nextDay(), simulate(), simulateWait()
    __tests__/       Vitest suite for the financial logic
  state/           Reducer, context, localStorage persistence
  views/           Home, Simulate, Spend, Plan, Goals, Forecast
  styles/          Global styles and design tokens
```

Keeping `domain/` free of UI code means the financial logic is easy to test and the interface can be restyled without touching it.

## Testing

```bash
npm test
```

The suite covers safe-to-spend, all four risk tiers, health score weights, `nextDay()` scheduling, day-30 and negative-balance edge cases, unreachable goals, the wait-until-day-X comparison, and regression tests for past bugs (one-off purchases inflating the burn rate, stale goal IDs losing money, and goal contributions wrongly slowing goals).

## Deployment

It's a static site. On Netlify or Vercel:

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18 or newer (set `NODE_VERSION=20` if needed)

For GitHub Pages or any sub-path hosting, set `base` in `vite.config.ts` to match the path.

## Accessibility

- Semantic landmarks, labelled form fields, and visible keyboard focus
- Risk, status and timeline markers use icons and text as well as colour
- Live regions announce changing numbers
- Interactive days and calendar cells are real buttons with descriptive labels
- Colour themes follow the system's light or dark setting

## Known limitations

- Data is stored per browser, so clearing site data resets the month and nothing syncs between devices.
- The goal completion estimate is a deliberate simplification: it divides the month-end surplus (plus money already saved) across goals.
- Daily spending is estimated from a smoothed average rather than a per-category model.
- This is a simulation for learning and decision-making, not financial advice.

## Roadmap

- Visual redesign
- Animated number changes and toasts after committing a decision
- Richer forecast chart with axis labels
- Per-category budgets