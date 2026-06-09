"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarCheck,
  CheckCircle2,
  FileText,
  Home,
  Leaf,
  Moon,
  Route,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  User,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ActivityForm } from "@/components/features/activity-form";
import { CoachPanel } from "@/components/features/coach-panel";
import { ProfileOnboarding } from "@/components/features/profile-onboarding";
import { ProgressPanel } from "@/components/features/progress-panel";
import { FutureImpactSimulator } from "@/components/features/future-impact-simulator";
import { ReportDownloadPanel } from "@/components/features/report-download-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityCategory } from "@/features/activities/activity.types";
import { buildSimpleActions } from "@/features/actions/actions-engine";
import { buildCarbonEngineResult, formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import type { CarbonBreakdownItem } from "@/features/carbon/carbon.types";
import type { UserProfile } from "@/features/profile/profile.types";
import { buildProgressReport } from "@/features/progress/progress-calculator";
import { defaultHabitAdjustments } from "@/features/simulator/simulator.schema";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import { formatCarbon } from "@/lib/format";
import { EcoTrackProvider, useEcoTrack } from "@/state/ecotrack-state";
import { LoadingScreen, WelcomeScreen } from "@/components/welcome-screen";

type AppStage = "welcome" | "loading" | "app";
type AppTab = "home" | "coach" | "simulator" | "progress" | "profile";

export function EcoTrackApp() {
  return (
    <EcoTrackProvider>
      <EcoTrackEntry />
    </EcoTrackProvider>
  );
}

function EcoTrackEntry() {
  const [stage, setStage] = useState<AppStage>("welcome");

  function startApp() {
    setStage("loading");
    window.setTimeout(() => setStage("app"), 1000);
  }

  if (stage === "welcome") {
    return <WelcomeScreen onGetStarted={startApp} />;
  }

  if (stage === "loading") {
    return <LoadingScreen />;
  }

  return <EcoTrackWorkspace />;
}

function EcoTrackWorkspace() {
  const { activities, theme, toggleTheme } = useEcoTrack();
  const [activeTab, setActiveTab] = useState<AppTab>("home");

  return (
    <div className="min-h-screen pb-24">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-green-600 focus:px-4 focus:py-2 focus:text-white"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold">EcoTrack AI</p>
                <p className="text-sm text-muted-foreground">
                  Track, understand, and reduce your carbon footprint through personalized sustainability coaching.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{activities.length} activities</Badge>
              <Button
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                size="icon"
                type="button"
                variant="secondary"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <Sun aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Moon aria-hidden="true" className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {activeTab === "home" ? <HomePage /> : null}

        {activeTab === "coach" ? (
          <CoachPanel />
        ) : null}

        {activeTab === "simulator" ? (
          <section className="space-y-5" aria-label="Simulator">
            <div>
              <h1 className="text-2xl font-semibold tracking-normal">Future Impact Simulator</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore how lifestyle changes could reduce your future emissions before making real-world decisions.
              </p>
            </div>
            <DashboardPanel icon={Route} title="Scenario controls">
              <FutureImpactSimulator />
            </DashboardPanel>
            <DashboardPanel icon={FileText} title="PDF report">
              <ReportDownloadPanel />
            </DashboardPanel>
          </section>
        ) : null}

        {activeTab === "progress" ? (
          <section className="space-y-5" aria-label="Progress and activity history">
            <ActivityForm />
            <DashboardPanel icon={BarChart3} title="Progress">
              <ProgressPanel />
            </DashboardPanel>
          </section>
        ) : null}

        {activeTab === "profile" ? <ProfilePage /> : null}
      </main>

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}

const tabs: Array<{ id: AppTab; label: string; icon: LucideIcon }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "coach", label: "Coach", icon: Bot },
  { id: "simulator", label: "Simulator", icon: TrendingDown },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

const categoryLabels: Record<ActivityCategory, string> = {
  transport: "Transportation",
  food: "Food",
  home: "Electricity",
  shopping: "Shopping",
  waste: "Waste",
};

const chartColors: Record<ActivityCategory, string> = {
  transport: "#0f766e",
  food: "#65a30d",
  home: "#2563eb",
  shopping: "#ca8a04",
  waste: "#16a34a",
};

type CategoryChartRow = CarbonBreakdownItem & {
  label: string;
};

function HomePage() {
  const { activities, coachHistory, profile } = useEcoTrack();
  const carbon = buildCarbonEngineResult(activities);
  const actions = buildSimpleActions(profile, activities);
  const twin = buildCarbonTwin(profile, activities);
  const progress = buildProgressReport(activities);
  const impact = simulateFutureImpact(profile, activities, defaultHabitAdjustments);
  const categoryRows = carbon.categoryBreakdown.map((item) => ({
    ...item,
    label: categoryLabels[item.category],
  }));
  const biggest = [...categoryRows].sort((a, b) => b.co2eKg - a.co2eKg)[0] ?? null;
  const dailyChallenge = actions.actions[0] ?? null;
  const quickStartSteps = [
    {
      label: "Complete Profile",
      complete: Boolean(profile),
      helper: "Save lifestyle details so insights match your habits.",
    },
    {
      label: "Log First Activity",
      complete: activities.length > 0,
      helper: "Add one dated activity to calculate your first footprint.",
    },
    {
      label: "Explore Carbon Insights",
      complete: categoryRows.length > 0,
      helper: "Review your score, rating, and category breakdown.",
    },
    {
      label: "Ask the AI Coach",
      complete: coachHistory.length > 0,
      helper: "Ask a question after profile or activity data is available.",
    },
  ];

  return (
    <section className="space-y-5" aria-label="Home dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your current sustainability status from saved profile data and activity logs.
        </p>
      </div>

      <QuickStartCard steps={quickStartSteps} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusCard
          icon={Target}
          label="Carbon Score"
          value={carbon.score ? `${carbon.score.value}/100` : "Not calculated yet"}
          detail={carbon.score ? `${formatCarbon(carbon.score.annualizedKg)} annualized` : "Log one real activity to generate your first personalized carbon score."}
        />
        <StatusCard
          icon={Leaf}
          label="Sustainability Rating"
          value={carbon.score ? formatSustainabilityRating(carbon.score.rating) : "Not rated yet"}
          detail={carbon.score ? "Generated from real activity history." : "Your rating will explain overall footprint health after emissions are logged."}
        />
        <StatusCard
          icon={Sparkles}
          label="Carbon Twin Profile"
          value={twin?.identity ?? "Not generated yet"}
          detail={twin ? `Dominant source: ${categoryLabels[twin.dominantCategory]}` : "Save lifestyle details or log activity so EcoTrack can describe your carbon identity."}
        />
        <StatusCard
          icon={BarChart3}
          label="Biggest Contributor"
          value={biggest ? categoryLabels[biggest.category] : actions.highestSource ? categoryLabels[actions.highestSource.category] : "Not identified yet"}
          detail={biggest ? `${biggest.percentage.toFixed(1)}% of logged emissions` : "Complete your profile or log activity so EcoTrack can find the category to improve first."}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <DashboardPanel icon={BarChart3} title="Category breakdown chart">
          <CategoryBreakdownChart rows={categoryRows} />
        </DashboardPanel>
        <DashboardPanel icon={CheckCircle2} title="Recommended actions">
          {actions.actions.length > 0 ? (
            <ol className="space-y-3">
              {actions.actions.slice(0, 3).map((action) => (
                <li key={action.id} className="rounded-lg border p-3">
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              title="Personalized actions need your habits"
              description="Recommended actions turn your largest emission source into practical next steps. Complete your profile or log one activity to generate suggestions from your own data."
            />
          )}
        </DashboardPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <DashboardPanel icon={CalendarCheck} title="Daily challenge">
          {dailyChallenge ? (
            <div className="rounded-lg border-l-4 border-l-primary p-4">
              <p className="text-base font-semibold">{dailyChallenge.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{dailyChallenge.reason}</p>
              <p className="mt-3 text-sm font-medium">Estimated impact: {formatCarbon(dailyChallenge.estimatedImpactKg)}</p>
            </div>
          ) : (
            <EmptyState
              title="Your daily challenge will be personalized"
              description="Daily challenges help you try one small sustainability habit at a time. Complete your profile or log one activity to create a challenge based on your footprint."
            />
          )}
        </DashboardPanel>
        <DashboardPanel icon={TrendingDown} title="Quick progress summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <ProgressMetric label="Current Week Improvement" value={formatImprovement(progress.summaries.weekly.improvementPercent)} />
            <ProgressMetric label="Monthly Improvement" value={formatImprovement(progress.summaries.monthly.improvementPercent)} />
            <ProgressMetric
              label="Simulated Reduction"
              value={impact ? `${Math.max(0, impact.reductionPercent).toFixed(1)}% possible` : "Profile details needed"}
            />
          </div>
        </DashboardPanel>
      </div>
    </section>
  );
}

function CategoryBreakdownChart({ rows }: { rows: CategoryChartRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Category insights start with activity data"
        description="This chart shows which parts of your lifestyle create the most emissions so you can focus on the highest-impact change first. Log one activity on the Progress tab to build the breakdown."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <div className="h-56" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="co2eKg" nameKey="label" innerRadius={52} outerRadius={84} paddingAngle={3}>
              {rows.map((row) => (
                <Cell key={row.category} fill={chartColors[row.category]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCarbon(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-3" aria-label="Category breakdown">
        {rows.map((row) => (
          <li key={row.category} className="grid gap-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>{row.label}</span>
              <span className="font-mono">{formatCarbon(row.co2eKg)}</span>
            </div>
            <div className="h-2 rounded-full bg-secondary" aria-hidden="true">
              <div
                className="h-2 rounded-full"
                style={{ width: `${Math.min(100, row.percentage)}%`, backgroundColor: chartColors[row.category] }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{row.percentage.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfilePage() {
  const { profile, resetData, theme, toggleTheme } = useEcoTrack();

  function handleReset() {
    if (window.confirm("Reset all EcoTrack AI profile, activity, coach, and progress data stored on this device?")) {
      resetData();
    }
  }

  return (
    <section aria-labelledby="profile-heading" className="space-y-5">
      <div>
        <h1 id="profile-heading" className="text-2xl font-semibold tracking-normal">
          Profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage lifestyle information and app settings. Activity logs live on the Progress tab.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <ProfileOnboarding />
        <div className="space-y-5">
          <ProfileCompletionCard profile={profile} />
          <Card>
            <CardHeader>
              <CardTitle>Profile options</CardTitle>
              <CardDescription>Update lifestyle data, export reports, or clear local data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" type="button" variant="secondary" onClick={toggleTheme}>
                {theme === "dark" ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </Button>
              <Button className="w-full justify-start" type="button" variant="secondary" onClick={handleReset}>
                <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                Reset data
              </Button>
            </CardContent>
          </Card>
          <ReportDownloadPanel />
        </div>
      </div>
    </section>
  );
}

function QuickStartCard({
  steps,
}: {
  steps: Array<{
    complete: boolean;
    helper: string;
    label: string;
  }>;
}) {
  const completedCount = steps.filter((step) => step.complete).length;

  return (
    <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/20">
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>
          {completedCount} of {steps.length} steps complete. Follow these steps to unlock personalized carbon insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2" aria-label="Getting started checklist">
          {steps.map((step) => (
            <li key={step.label} className="flex gap-3 rounded-lg border bg-background/85 p-3">
              <span
                className={
                  step.complete
                    ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
                    : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold text-muted-foreground"
                }
                aria-hidden="true"
              >
                {step.complete ? "\u2713" : ""}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{step.label}</p>
                  <Badge className={step.complete ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-background"}>
                    {step.complete ? "Complete" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{step.helper}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ProfileCompletionCard({ profile }: { profile: UserProfile | null }) {
  const percentage = getProfileCompletion(profile);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>{getProfileCompletionMessage(percentage)}</CardDescription>
          </div>
          <Badge>{percentage}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div
          aria-label="Profile completion"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={percentage}
          className="h-3 rounded-full bg-secondary"
          role="progressbar"
        >
          <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold capitalize">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ProgressMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatImprovement(value: number | null) {
  if (value === null) {
    return "Log another period";
  }

  if (value >= 0) {
    return `${value.toFixed(1)}% better`;
  }

  return `${Math.abs(value).toFixed(1)}% higher`;
}

function getProfileCompletion(profile: UserProfile | null) {
  if (!profile) {
    return 0;
  }

  const sections = [
    profile.transportation.weeklyDistanceKm > 0 ||
      profile.transportation.sharedTripsPerWeek > 0 ||
      profile.transportation.primaryMode !== "car",
    profile.electricity.monthlyKwh > 0 || profile.electricity.renewablePercent > 0,
    profile.food.meatMealsPerWeek > 0 || profile.food.dietType !== "omnivore",
    profile.shopping.clothingItemsPerMonth > 0 || profile.shopping.electronicsItemsPerYear > 0,
    profile.waste.landfillKgPerWeek > 0 || profile.waste.recyclingKgPerWeek > 0,
  ];
  const completedSections = sections.filter(Boolean).length;

  return Math.round((completedSections / sections.length) * 100);
}

function getProfileCompletionMessage(percentage: number) {
  if (percentage === 0) {
    return "Start building your sustainability profile.";
  }

  if (percentage === 100) {
    return "Profile complete. Your sustainability coach can now provide better recommendations.";
  }

  if (percentage >= 50) {
    return "You're halfway to personalized sustainability insights.";
  }

  return "Add a few more lifestyle details to improve your recommendations.";
}

function BottomNavigation({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <nav
      aria-label="Main application tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 py-2 backdrop-blur"
    >
      <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            aria-label={`Open ${tab.label} tab`}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:bg-secondary aria-current:bg-primary aria-current:text-primary-foreground"
            type="button"
            onClick={() => onChange(tab.id)}
          >
            <tab.icon aria-hidden="true" className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

type DashboardPanelProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  variant?: "card" | "plain";
};

function DashboardPanel({ icon: Icon, title, children, variant = "card" }: DashboardPanelProps) {
  const headingId = `${title.toLowerCase().replaceAll(" ", "-")}-heading`;

  return (
    <section
      className={variant === "card" ? "rounded-lg border bg-card p-5" : "py-2"}
      aria-labelledby={headingId}
    >
      <div className="mb-4 flex items-center gap-2">
        <Icon aria-hidden="true" className="h-5 w-5 text-primary" />
        <h2 id={headingId} className="text-base font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
