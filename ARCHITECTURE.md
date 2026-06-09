# EcoTrack AI Architecture

## Product Shape

EcoTrack AI is a local-first sustainability coaching application built with Next.js, TypeScript, Tailwind CSS, Recharts, Zod, React Hook Form, and Vitest.

The product helps users understand, track, and reduce their carbon footprint using only user-provided profile data and activity logs. New users start with zero data. The app does not use authentication, a database, external AI APIs, or a backend service.

## Information Architecture

The application opens with a dedicated welcome screen, then transitions into a five-tab mobile-first workspace.

- `Home`: carbon score, sustainability rating, carbon twin, biggest contributor, category breakdown chart, recommended actions, daily challenge, and quick progress summary.
- `Coach`: structured sustainability advisor with data-driven insights, recommendations, weekly plan, visual impact cards, and conversational prompts.
- `Simulator`: future impact controls for transport, electricity, food, shopping, and waste changes.
- `Progress`: activity entry, daily/weekly/monthly progress, trend charts, emission history, and activity history.
- `Profile`: lifestyle profile collection, theme setting, PDF export, and local reset option.

The fixed bottom navigation remains visible across the main application.

## Folder Structure

```text
src/
  app/
    globals.css
    page.tsx
  components/
    ecotrack-app.tsx
    welcome-screen.tsx
    features/
      activity-form.tsx
      coach-panel.tsx
      future-impact-simulator.tsx
      progress-panel.tsx
      profile-onboarding.tsx
      report-download-panel.tsx
    ui/
      badge.tsx
      button.tsx
      card.tsx
      empty-state.tsx
      input.tsx
      label.tsx
  features/
    actions/
    activities/
    carbon/
    coach/
    profile/
    progress/
    report/
    simulator/
    twin/
  lib/
  state/
tests/
```

## State Model

State is managed in `src/state/ecotrack-state.tsx` with a reducer and React context.

Persisted local state:

- `activities`: dated emission activity logs.
- `profile`: lifestyle profile answers.
- `coachHistory`: saved coach messages.
- `theme`: light or dark mode.

The state boundary is validated with Zod before stored data is trusted. Invalid local storage data falls back to the empty initial state.

## Carbon Engine

The carbon engine lives in `src/features/carbon`.

Responsibilities:

- Validate selected carbon factors.
- Calculate activity emissions in kg CO2e.
- Group activity logs by day, week, month, and year.
- Calculate category breakdown percentages.
- Generate the carbon score and sustainability rating.

Empty activity input returns zero totals and no score. This prevents invented progress or hardcoded ratings for new users.

## Recommendation and Coach Engines

The recommendation logic is deterministic and testable.

Primary modules:

- `src/features/actions/actions-engine.ts`
- `src/features/coach/coach-engine.ts`

The engines:

- Rank the highest emission source from activity logs or profile estimates.
- Generate practical actions from that highest source.
- Explain why emissions are high.
- Generate structured response cards with Analysis, Reasoning, Recommendation, and Expected Impact.
- Generate weekly plans from user data.

Coach answers do not automatically create activity logs. Users must explicitly log activities for charts and score updates.

## Carbon Twin

The Carbon Twin engine lives in `src/features/twin`.

It generates identities such as:

- Urban Commuter
- Green Explorer
- Conscious Consumer
- Climate Warrior

The identity, strengths, weaknesses, and opportunities are derived from profile data or activity logs. No carbon twin is generated for a brand-new user with no usable data.

## Simulator

The simulator lives in `src/features/simulator`.

It compares current annual emissions against future habit adjustments:

- Transport reduction percentage.
- Electricity reduction percentage.
- Meat meals reduced per week.
- Shopping reduction percentage.
- Waste diversion percentage.

The result includes current emissions, future emissions, reduction percentage, annual savings, and category-level impact comparisons.

## Progress Tracking

Progress tracking lives in `src/features/progress`.

It derives:

- Daily totals.
- Weekly totals.
- Monthly totals.
- Improvement percentages.
- Best improvement periods.
- Current improvement streak.

History is stored locally through activity logs. No server-side tracking is used.

## Report Generation

Report generation lives in `src/features/report`.

The PDF report includes:

- Carbon score.
- Category breakdown.
- Carbon Twin.
- Recommendations.
- Weekly plan.

Reports are generated from current local data only.

## Accessibility

Accessibility is treated as a core architecture concern.

Implemented patterns:

- Semantic landmarks and headings.
- Fixed bottom navigation with labels and icons.
- Skip link hidden by default and visible on keyboard focus.
- Keyboard-accessible tabs.
- Focus-visible indicators.
- `aria-live` for dynamic empty states.
- `aria-describedby` and `role="alert"` for form errors.
- Reduced-motion support.
- Forced-colors high contrast support.

## Security

Security model:

- Local-only data storage.
- No authentication.
- No database.
- No backend API.
- No external AI API calls.
- Zod validation for user input and persisted state.
- No rendering of user-provided HTML.
- Dependency auditing through `npm audit`.

## Testing and Quality Gates

Vitest covers the core business logic and key UI behavior.

Test areas:

- Carbon calculations.
- Sustainability score bands.
- Coach recommendations.
- Carbon Twin generation.
- Simulator calculations.
- Progress calculations.
- PDF report generation.
- Accessibility behavior.

Coverage is enforced for core engines with 80% minimum thresholds for statements, branches, functions, and lines.

Recommended verification:

```bash
npm run typecheck
npm test
npm run coverage
npm run build
npm audit
```
