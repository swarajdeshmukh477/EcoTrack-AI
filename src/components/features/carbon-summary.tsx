"use client";

import { CalendarDays, ChartNoAxesColumnIncreasing, Gauge, ListTree, type LucideIcon } from "lucide-react";
import { buildCarbonEngineResult, formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import { formatCarbon } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEcoTrack } from "@/state/ecotrack-state";

export function CarbonSummary() {
  const { activities } = useEcoTrack();
  const result = buildCarbonEngineResult(activities);
  const latestDaily = result.daily.at(-1)?.co2eKg ?? 0;
  const latestWeekly = result.weekly.at(-1)?.co2eKg ?? 0;
  const latestMonthly = result.monthly.at(-1)?.co2eKg ?? 0;
  const latestYearly = result.yearly.at(-1)?.co2eKg ?? 0;

  const items = [
    {
      label: "Latest day",
      value: formatCarbon(latestDaily),
      icon: CalendarDays,
    },
    {
      label: "Latest week",
      value: formatCarbon(latestWeekly),
      icon: ChartNoAxesColumnIncreasing,
    },
    {
      label: "Latest month",
      value: formatCarbon(latestMonthly),
      icon: ChartNoAxesColumnIncreasing,
    },
    {
      label: "Latest year",
      value: formatCarbon(latestYearly),
      icon: ListTree,
    },
  ];

  const scoreItems = [
    {
      label: "Carbon score",
      value: result.score ? `${result.score.value}/100` : "No score yet",
      description: "Generated after activity logs exist.",
      icon: Gauge,
    },
    {
      label: "Sustainability rating",
      value: result.score ? formatSustainabilityRating(result.score.rating) : "No rating yet",
      description: result.score ? `${formatCarbon(result.score.annualizedKg)} annualized from logs.` : "No fake rating for new users.",
      icon: ListTree,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <SummaryCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {scoreItems.map((item) => (
            <SummaryCard key={item.label} {...item} />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Category breakdown</CardTitle>
            <CardDescription>Calculated only from logged activities.</CardDescription>
          </CardHeader>
          <CardContent>
            {result.categoryBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            ) : (
              <ul className="space-y-2" aria-label="Carbon emissions by category">
                {result.categoryBreakdown.map((item) => (
                  <li key={item.category} className="grid gap-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="capitalize">{item.category}</span>
                      <span className="font-mono">{formatCarbon(item.co2eKg)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary" aria-hidden="true">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
};

function SummaryCard({ label, value, description, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="font-mono text-xl font-semibold capitalize">{value}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
