"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { buildProgressReport } from "@/features/progress/progress-calculator";
import type { ProgressPeriod } from "@/features/progress/progress.types";
import { carbonFactors } from "@/features/carbon/carbon-factors";
import { formatCarbon } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { useEcoTrack } from "@/state/ecotrack-state";

const periodLabels: Record<ProgressPeriod, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

const progressPeriods: ProgressPeriod[] = ["daily", "weekly", "monthly"];

export function ProgressPanel() {
  const { activities, removeActivity } = useEcoTrack();
  const [period, setPeriod] = useState<ProgressPeriod>("daily");

  if (activities.length === 0) {
    return (
      <EmptyState
        title="Track improvement from your activity history"
        description="Progress charts compare emissions over time so you can see whether your habits are improving. Log a dated activity above to start your history."
      />
    );
  }

  const report = buildProgressReport(activities);
  const points = report[period];
  const summary = report.summaries[period];
  const bestPeriod = findBestImprovementPeriod(report[period]);
  const streak = getCurrentImprovementStreak(report.daily);
  const selectedTabId = `progress-tab-${period}`;

  function handlePeriodKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, currentPeriod: ProgressPeriod) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    const currentIndex = progressPeriods.indexOf(currentPeriod);
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? progressPeriods.length - 1
          : event.key === "ArrowRight"
            ? (currentIndex + 1) % progressPeriods.length
            : (currentIndex - 1 + progressPeriods.length) % progressPeriods.length;
    const nextPeriod = progressPeriods[nextIndex];
    setPeriod(nextPeriod);
    window.requestAnimationFrame(() => document.getElementById(`progress-tab-${nextPeriod}`)?.focus());
  }

  return (
    <section className="space-y-5" aria-label="Progress tracking">
      <div>
        <h3 className="text-base font-semibold">Daily, weekly, and monthly progress</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Historical improvement is calculated only from dated activity logs stored on this device.
        </p>
      </div>

      <dl className="grid gap-3 md:grid-cols-3">
        <ProgressItem label="Daily progress" value={formatImprovement(report.summaries.daily.improvementPercent)} />
        <ProgressItem label="Weekly progress" value={formatImprovement(report.summaries.weekly.improvementPercent)} />
        <ProgressItem label="Monthly progress" value={formatImprovement(report.summaries.monthly.improvementPercent)} />
      </dl>

      <div className="grid grid-cols-3 rounded-md border p-1" role="tablist" aria-label="Progress period">
        {progressPeriods.map((item) => (
          <button
            key={item}
            id={`progress-tab-${item}`}
            aria-controls="progress-period-panel"
            aria-selected={period === item}
            className="rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-selected:bg-primary aria-selected:text-primary-foreground"
            role="tab"
            tabIndex={period === item ? 0 : -1}
            type="button"
            onKeyDown={(event) => handlePeriodKeyDown(event, item)}
            onClick={() => setPeriod(item)}
          >
            {periodLabels[item]}
          </button>
        ))}
      </div>

      <div id="progress-period-panel" role="tabpanel" aria-labelledby={selectedTabId} className="space-y-5">
        <dl className="grid gap-3 sm:grid-cols-3">
          <ProgressItem label={`Current ${periodLabels[period].toLowerCase()} emissions`} value={formatCarbon(summary.currentKg)} />
          <ProgressItem label={`Previous ${periodLabels[period].toLowerCase()} emissions`} value={formatCarbon(summary.previousKg)} />
          <ProgressItem label="Improvement" value={formatImprovement(summary.improvementPercent)} />
        </dl>

        <dl className="grid gap-3 sm:grid-cols-2">
          <ProgressItem
            label="Best improvement period"
            value={bestPeriod ? `${bestPeriod.period}: ${bestPeriod.improvementPercent.toFixed(1)}% better` : "Log another period"}
          />
          <ProgressItem
            label="Current improvement streak"
            value={streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "No active streak yet"}
          />
        </dl>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{periodLabels[period]} trend</h3>
            <p className="sr-only">
              {periodLabels[period]} progress trend with {points.length} point{points.length === 1 ? "" : "s"}.
            </p>
            <div className="h-72 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={points} margin={{ bottom: 8, left: 0, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} />
                  <YAxis tickLine={false} width={44} />
                  <Tooltip formatter={(value) => formatCarbon(Number(value))} />
                  <Line dataKey="co2eKg" dot stroke="var(--primary)" strokeWidth={2} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Emissions by period</h3>
            <div className="h-72 w-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={points} margin={{ bottom: 8, left: 0, right: 16, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} />
                  <YAxis tickLine={false} width={44} />
                  <Tooltip formatter={(value) => formatCarbon(Number(value))} />
                  <Bar dataKey="co2eKg" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <caption className="sr-only">{periodLabels[period]} emission history stored from local activity logs</caption>
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-3 py-2 font-medium" scope="col">
                  Period
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Emissions
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.period} className="border-t">
                  <td className="px-3 py-2">{point.period}</td>
                  <td className="px-3 py-2 font-mono">{formatCarbon(point.co2eKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Activity history</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[620px] border-collapse text-left text-sm">
            <caption className="sr-only">Activity history with date, activity, impact, and category</caption>
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-3 py-2 font-medium" scope="col">
                  Date
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Activity
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Impact
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Category
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Remove
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                const factor = carbonFactors.find((item) => item.id === activity.activityType);

                return (
                  <tr key={activity.id} className="border-t">
                    <td className="px-3 py-2">{activity.date}</td>
                    <td className="px-3 py-2">{factor?.label ?? activity.activityType}</td>
                    <td className="px-3 py-2 font-mono">{formatCarbon(activity.co2eKg)}</td>
                    <td className="px-3 py-2 capitalize">{activity.category}</td>
                    <td className="px-3 py-2">
                      <Button
                        aria-label="Remove activity"
                        size="icon"
                        type="button"
                        variant="ghost"
                        onClick={() => removeActivity(activity.id)}
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ProgressItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-2 font-mono text-lg font-semibold">{value}</dd>
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

function findBestImprovementPeriod(points: Array<{ period: string; co2eKg: number }>) {
  return points.reduce<{ period: string; improvementPercent: number } | null>((best, point, index) => {
    const previous = points[index - 1];

    if (!previous || previous.co2eKg <= 0) {
      return best;
    }

    const improvementPercent = ((previous.co2eKg - point.co2eKg) / previous.co2eKg) * 100;

    if (improvementPercent <= 0) {
      return best;
    }

    if (!best || improvementPercent > best.improvementPercent) {
      return {
        period: point.period,
        improvementPercent,
      };
    }

    return best;
  }, null);
}

function getCurrentImprovementStreak(points: Array<{ co2eKg: number }>) {
  let streak = 0;

  for (let index = points.length - 1; index > 0; index -= 1) {
    if (points[index].co2eKg < points[index - 1].co2eKg) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}
