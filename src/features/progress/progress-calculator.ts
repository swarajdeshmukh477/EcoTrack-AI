import type { Activity } from "@/features/activities/activity.types";
import { getDailyTotals, getMonthlyTotals, getWeeklyTotals } from "@/features/carbon/carbon-breakdown";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import type { PeriodProgressSummary, ProgressPoint, ProgressReport, ProgressSummary } from "./progress.types";

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

export function buildProgressReport(activities: Activity[]): ProgressReport {
  const daily = getDailyTotals(activities);
  const weekly = getWeeklyTotals(activities);
  const monthly = getMonthlyTotals(activities).map((item) => ({
    period: item.month,
    co2eKg: item.co2eKg,
  }));

  return {
    daily,
    weekly,
    monthly,
    summaries: {
      daily: summarizeProgress(daily),
      weekly: summarizeProgress(weekly),
      monthly: summarizeProgress(monthly),
    },
  };
}

export function summarizeProgress(points: ProgressPoint[]): PeriodProgressSummary {
  const currentKg = points.at(-1)?.co2eKg ?? 0;
  const previousKg = points.at(-2)?.co2eKg ?? 0;

  if (previousKg === 0) {
    return {
      currentKg,
      previousKg,
      improvementPercent: null,
    };
  }

  return {
    currentKg,
    previousKg,
    improvementPercent: roundCarbon(((previousKg - currentKg) / previousKg) * 100),
  };
}
