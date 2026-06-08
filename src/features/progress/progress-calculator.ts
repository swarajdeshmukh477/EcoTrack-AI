import type { Activity } from "@/features/activities/activity.types";
import { getMonthlyTotals } from "@/features/carbon/carbon-breakdown";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import type { ProgressSummary } from "./progress.types";

export function getProgressSummary(activities: Activity[]): ProgressSummary {
  const monthlyTotals = getMonthlyTotals(activities);
  const current = monthlyTotals.at(-1)?.co2eKg ?? 0;
  const previous = monthlyTotals.at(-2)?.co2eKg ?? 0;

  if (previous === 0) {
    return {
      currentMonthKg: current,
      previousMonthKg: previous,
      changePercent: null,
    };
  }

  return {
    currentMonthKg: current,
    previousMonthKg: previous,
    changePercent: roundCarbon(((current - previous) / previous) * 100),
  };
}
