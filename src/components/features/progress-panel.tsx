"use client";

import { getProgressSummary } from "@/features/progress/progress-calculator";
import { formatCarbon, formatPercent } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { useEcoTrack } from "@/state/ecotrack-state";

export function ProgressPanel() {
  const { activities } = useEcoTrack();

  if (activities.length === 0) {
    return (
      <EmptyState
        title="No progress yet"
        description="Progress is calculated from your logged months, not demo statistics."
      />
    );
  }

  const summary = getProgressSummary(activities);

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      <ProgressItem label="Current logged month" value={formatCarbon(summary.currentMonthKg)} />
      <ProgressItem label="Previous logged month" value={formatCarbon(summary.previousMonthKg)} />
      <ProgressItem
        label="Month change"
        value={summary.changePercent === null ? "Needs another month" : formatPercent(summary.changePercent)}
      />
    </dl>
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
