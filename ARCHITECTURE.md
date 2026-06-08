# EcoTrack AI Architecture

## Product Shape

EcoTrack AI is a single-page climate coaching app. It combines a carbon calculator, personalized profile generation, recommendation logic, habit simulations, daily challenges, gamification, and analytics in one responsive dashboard.

The first screen is the product experience itself, not a landing page.

## Information Architecture

- App header: product identity, footprint summary, level, XP, streak.
- Carbon calculator: editable habits across transportation, electricity, diet, shopping, and waste.
- Carbon Twin profile: main emission source, sustainability score, and personality archetype.
- AI sustainability coach: habit-aware recommendations derived from the calculated footprint mix.
- Future impact simulator: scenario controls that preview new footprint, reduction, annual impact, and tree equivalents.
- Daily green challenges: rotating tasks that award XP and maintain streak behavior.
- Analytics dashboard: category breakdown, weekly trend, monthly trend, and improvement history.
- Achievement badges: unlock based on score, challenge completion, and projected reductions.

## State Model

The app keeps a single in-memory state object:

- `habits`: user input values for each footprint category.
- `footprint`: calculated daily, monthly, annual, and category totals.
- `profile`: derived carbon twin personality and sustainability score.
- `simulation`: adjusted habit scenario and projected impact.
- `game`: XP, level, streak, completed challenges, achievements.
- `analytics`: derived chart-ready values.

All derived values are recalculated after state changes so features stay synchronized.

## Calculation Model

Emissions are expressed in kilograms of CO2e.

- Transportation: km/day by car, public transport, bike/walk days, flights/year.
- Electricity: monthly kWh, AC usage, renewable energy percentage.
- Diet: diet type, meat meals/week, food waste level.
- Shopping: monthly purchases, second-hand ratio.
- Waste: recycling rate, landfill bags/week.

Daily footprint is the sum of normalized category totals. Monthly and annual footprints are derived from the daily total.

## Recommendation Model

The coaching engine ranks categories by emissions share and produces recommendations using deterministic rules. This keeps the app usable without requiring an external AI API while preserving an AI-coach style experience.

Recommendation inputs:

- Highest-emission category.
- Sustainability score.
- Current habit values.
- Simulation opportunity size.

Recommendation outputs:

- Main insight.
- Actionable habit change.
- Estimated annual reduction.
- Encouraging coach note.

## Frontend Structure

```text
/
  index.html
  src/
    styles.css
    app.js
    data/
      constants.js
      challenges.js
    services/
      calculator.js
      coach.js
      gamification.js
      simulator.js
    ui/
      charts.js
      render.js
```

## Design System

- Dense dashboard layout for repeat use.
- Calm neutral background with distinct category colors.
- Compact panels with 8px radius.
- Icon-first controls where practical.
- Responsive grid that becomes a single-column workspace on mobile.
- CSS-only charts to keep runtime simple.

## Extensibility

The service modules are intentionally isolated:

- Replace `coach.js` with a real LLM/API-powered coach later.
- Add persistence by writing `state` to localStorage or a backend.
- Add authentication and user history without changing the calculator logic.
- Swap CSS charts for a chart library if more analytics depth is needed.
