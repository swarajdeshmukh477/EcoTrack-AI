# EcoTrack AI

EcoTrack AI is a mobile-first sustainability tracking app that helps users understand, track, and reduce their carbon footprint through dynamic calculations, personalized insights, and practical action planning.

The app is built with Next.js, TypeScript, Tailwind CSS, shadcn/ui-style components, Recharts, Zod, React Hook Form, and Vitest. It uses local storage only. There is no login, database, or backend service.

## Problem Statement

Many people want to reduce their environmental impact but do not know which daily habits matter most. Carbon footprint tools often feel generic, overwhelming, or disconnected from a user's real behavior.

EcoTrack AI solves this by helping users:

- Track emissions from transportation, electricity, food, shopping, and waste.
- Understand their biggest emission sources.
- Receive personalized recommendations from their own data.
- Simulate future habit changes.
- Monitor progress over time.
- Export a professional carbon report.

## Chosen Vertical

Sustainability and Environmental Impact

EcoTrack AI focuses on helping individuals understand, track, and reduce their carbon footprint through personalized insights, activity tracking, sustainability coaching, and future impact simulations.

## Solution Overview

EcoTrack AI turns user-provided lifestyle information and activity logs into a personal sustainability dashboard.

The app starts with zero user data and never displays invented statistics, demo users, hardcoded rewards, or static recommendations. Scores, charts, actions, reports, simulations, and coaching responses are generated from profile data or logged activities.

Core flow:

1. User opens a welcome screen.
2. User enters lifestyle profile data or logs activities.
3. Carbon engine calculates emissions and score.
4. Coach and action engines generate recommendations.
5. Simulator previews future impact.
6. Progress page tracks history from local storage.

## Approach and Logic

EcoTrack AI follows a data-driven approach.

1. Collect lifestyle information and sustainability-related activities from the user.
2. Convert activities into carbon emissions using category-specific emission factors.
3. Calculate carbon score, sustainability rating, and category breakdown.
4. Identify the user's largest emission sources.
5. Generate personalized recommendations and simple sustainability actions.
6. Simulate future lifestyle changes and estimate potential emission reductions.
7. Track progress over time using local storage.
8. Present insights through dashboards, coaching, reports, and visualizations.

The system is deterministic, transparent, and based entirely on user-provided information.

All recommendations, simulations, scores, reports, and sustainability insights are generated dynamically from the user's data.

## How the Solution Works

1. Users begin on a welcome screen and create their sustainability profile.
2. Lifestyle information is collected across transportation, electricity, food, shopping, and waste categories.
3. Activities are converted into estimated carbon emissions using category-specific emission factors.
4. The Carbon Engine calculates total emissions, carbon score, sustainability rating, and category breakdown.
5. The Smart Sustainability Coach analyzes the user's profile and emissions to generate personalized guidance.
6. The Future Impact Simulator allows users to explore how behavioral changes could reduce emissions.
7. The Progress system stores historical information in local storage and tracks improvement over time.
8. The Report Generator creates a downloadable sustainability report based on current user data.

## Features

- Welcome screen with loading transition.
- Fixed bottom navigation:
  - Home
  - Coach
  - Simulator
  - Progress
  - Profile
- Profile collection with React Hook Form and Zod validation.
- Local storage persistence.
- Carbon score and sustainability rating.
- Category breakdown charts.
- Carbon Twin identity generation.
- Smart Sustainability Coach with structured response cards.
- Simple Actions Engine for practical daily actions.
- Future Impact Simulator.
- Progress tracking with daily, weekly, and monthly trends.
- Activity history table.
- PDF report generator.
- Dark mode and high contrast support.
- Keyboard-accessible navigation.
- Screen reader-friendly UI patterns.

## Architecture

The project follows a small, modular frontend architecture.

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

Design principles:

- Small reusable components.
- Strict TypeScript.
- Zod validation at input and persistence boundaries.
- Testable business logic in `src/features`.
- Local-only persistence through React state and `localStorage`.
- Semantic HTML with accessible controls.

## Carbon Engine

The carbon engine calculates emissions from activity logs using category-specific emission factors.

It supports:

- Daily emissions.
- Weekly emissions.
- Monthly emissions.
- Yearly emissions.
- Total emissions.
- Carbon score.
- Sustainability rating.
- Category breakdown percentages.

Main modules:

- `src/features/carbon/carbon-calculator.ts`
- `src/features/carbon/carbon-breakdown.ts`
- `src/features/carbon/carbon-engine.ts`
- `src/features/carbon/carbon-factors.ts`

The engine returns zero totals and no score for new users with no data.

## Smart Coach

The Smart Sustainability Coach is deterministic and data-driven. It does not call an external AI API.

The coach can:

- Analyze user activity logs and profile data.
- Identify the highest emission source.
- Explain why emissions are high.
- Suggest practical improvements.
- Generate weekly sustainability plans.
- Answer natural-language questions such as:
  - "Why is my footprint high?"
  - "What should I improve first?"
  - "Explain my score simply."
  - "Create a weekly sustainability plan."

Coach responses are displayed as structured advisor cards:

- Analysis
- Reasoning
- Recommendation
- Expected Impact

Main modules:

- `src/features/coach/coach-engine.ts`
- `src/features/actions/actions-engine.ts`
- `src/components/features/coach-panel.tsx`

## Simulator

The Future Impact Simulator helps users explore habit changes before making them.

Users can adjust:

- Transport reduction.
- Electricity reduction.
- Meat meals reduced per week.
- Shopping reduction.
- Waste diversion.

The simulator dynamically calculates:

- Current annual emissions.
- Future annual emissions.
- Reduction percentage.
- Annual savings.
- Category impact comparison.
- Before vs after visualization.

Main module:

- `src/features/simulator/future-impact-engine.ts`

## Assumptions Made

- Users provide honest and reasonably accurate lifestyle information.
- Carbon calculations are estimates based on simplified emission factors and are intended for education and awareness purposes.
- All user data remains on the user's device through local storage.
- No external AI services, cloud databases, or backend infrastructure are required.
- New users begin with no stored data and must provide profile information or activity logs before insights can be generated.
- The application is designed for personal sustainability tracking rather than regulatory or scientific carbon accounting.
- Recommendations are intended to encourage sustainable behavior and are not professional environmental consulting advice.

## Accessibility

EcoTrack AI includes accessibility-focused implementation details:

- Semantic landmarks: `header`, `main`, `nav`, `section`, `form`, and `table`.
- Fixed bottom navigation with icon and text labels.
- Skip link hidden by default and visible on keyboard focus.
- Keyboard-accessible progress tabs with arrow key support.
- Focus indicators for buttons, inputs, selects, and interactive controls.
- `aria-label`, `aria-current`, `aria-selected`, `aria-controls`, and `aria-live` where appropriate.
- Screen reader-friendly empty states.
- Form validation errors connected with `aria-describedby` and `role="alert"`.
- Dark mode support.
- Forced-colors high contrast support.
- Reduced-motion support.

## Security

Security choices:

- No authentication.
- No database.
- No backend API.
- No external AI calls.
- User data stays in browser local storage.
- Zod validates profile, activity, coach history, and persisted app state.
- No user-provided HTML is rendered.
- Dependencies are checked with `npm audit`.

Current audit status:

- `0` known vulnerabilities.

## Testing

Testing uses Vitest and Testing Library.

Test coverage includes:

- Carbon calculations.
- Sustainability ratings.
- Coach recommendations.
- Carbon Twin generation.
- Simulator calculations.
- Zod schemas.
- Progress calculations.
- Accessibility behavior.
- Theme toggle behavior.
- PDF report generation.

Coverage is enforced for core feature engines.

Current core coverage:

- Statements: 97.7%
- Branches: 80.34%
- Functions: 98.03%
- Lines: 97.84%

Commands:

```bash
npm test
npm run coverage
npm run typecheck
npm run build
npm audit
```

## Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run tests:

```bash
npm test
```

Run coverage:

```bash
npm run coverage
```

Build for production:

```bash
npm run build
```

## Deployment

EcoTrack AI is a standard Next.js app and can be deployed to Vercel or any platform that supports Next.js.

Recommended Vercel flow:

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Use the default Next.js build settings.
4. Build command: `npm run build`
5. No environment variables are required.

Because the app uses local storage only, no database provisioning or backend configuration is needed.
