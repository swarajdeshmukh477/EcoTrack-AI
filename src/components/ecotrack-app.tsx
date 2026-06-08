"use client";

import { Activity, BarChart3, Brain, CheckCircle2, Leaf, Moon, Route, Sparkles, Sun, type LucideIcon } from "lucide-react";
import { ActivityForm } from "@/components/features/activity-form";
import { ActivityList } from "@/components/features/activity-list";
import { CarbonChart } from "@/components/features/carbon-chart";
import { CarbonSummary } from "@/components/features/carbon-summary";
import { CoachPanel } from "@/components/features/coach-panel";
import { ProfileOnboarding } from "@/components/features/profile-onboarding";
import { ProgressPanel } from "@/components/features/progress-panel";
import { SimpleActionsPanel } from "@/components/features/simple-actions-panel";
import { FutureImpactSimulator } from "@/components/features/future-impact-simulator";
import { CarbonTwinPanel } from "@/components/features/carbon-twin-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EcoTrackProvider, useEcoTrack } from "@/state/ecotrack-state";

export function EcoTrackApp() {
  return (
    <EcoTrackProvider>
      <EcoTrackWorkspace />
    </EcoTrackProvider>
  );
}

function EcoTrackWorkspace() {
  const { activities, theme, toggleTheme } = useEcoTrack();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Leaf aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold">EcoTrack AI</p>
                <p className="text-sm text-muted-foreground">Personal carbon tracking from your own logs.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge>{activities.length} logs</Badge>
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
          <nav aria-label="Primary" className="grid grid-cols-4 gap-2 text-sm sm:flex">
            <a className="rounded-md px-3 py-2 hover:bg-secondary" href="#profile">
              Profile
            </a>
            <a className="rounded-md px-3 py-2 hover:bg-secondary" href="#log">
              Log
            </a>
            <a className="rounded-md px-3 py-2 hover:bg-secondary" href="#insights">
              Insights
            </a>
            <a className="rounded-md px-3 py-2 hover:bg-secondary" href="#progress">
              Progress
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[360px_1fr] lg:px-8">
        <section id="log" aria-labelledby="log-heading" className="space-y-5">
          <div>
            <h1 id="log-heading" className="text-2xl font-semibold tracking-normal">
              Track your footprint
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add activities as they happen. EcoTrack stores them locally in this browser.
            </p>
          </div>
          <div id="profile">
            <ProfileOnboarding />
          </div>
          <ActivityForm />
          <ActivityList />
        </section>

        <section aria-label="Carbon dashboard" className="space-y-5">
          <CarbonSummary />
          <div id="insights" className="grid gap-5 xl:grid-cols-2">
            <DashboardPanel icon={BarChart3} title="Emission history" variant="plain">
              <CarbonChart />
            </DashboardPanel>
            <DashboardPanel icon={Brain} title="Sustainability coach">
              <CoachPanel />
            </DashboardPanel>
          </div>
          <div id="progress">
            <DashboardPanel icon={Activity} title="Progress">
              <ProgressPanel />
            </DashboardPanel>
          </div>
          <DashboardPanel icon={CheckCircle2} title="Simple actions">
            <SimpleActionsPanel />
          </DashboardPanel>
          <DashboardPanel icon={Route} title="Future impact simulator">
            <FutureImpactSimulator />
          </DashboardPanel>
          <DashboardPanel icon={Sparkles} title="Carbon twin">
            <CarbonTwinPanel />
          </DashboardPanel>
        </section>
      </main>
    </div>
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
