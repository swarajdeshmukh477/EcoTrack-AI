import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { activityCategories } from "@/features/activities/activity.types";
import { toMonthKey, toWeekKey, toYearKey } from "@/lib/format";
import type { CarbonBreakdownItem, CarbonPeriodTotal, MonthlyCarbonTotal } from "./carbon.types";
import { roundCarbon } from "./carbon-calculator";

export function getTotalCarbon(activities: Activity[]) {
  return roundCarbon(activities.reduce((total, activity) => total + activity.co2eKg, 0));
}

export function getCategoryBreakdown(activities: Activity[]): CarbonBreakdownItem[] {
  const totalKg = getTotalCarbon(activities);

  return activityCategories
    .map((category) => {
      const co2eKg = roundCarbon(
        activities
          .filter((activity) => activity.category === category)
          .reduce((total, activity) => total + activity.co2eKg, 0),
      );

      return {
        category,
        co2eKg,
        percentage: totalKg > 0 ? roundCarbon((co2eKg / totalKg) * 100) : 0,
      };
    })
    .filter((item) => item.co2eKg > 0);
}

export function getHighestCategory(activities: Activity[]): ActivityCategory | null {
  const [highest] = getCategoryBreakdown(activities).sort((a, b) => b.co2eKg - a.co2eKg);
  return highest?.category ?? null;
}

export function getMonthlyTotals(activities: Activity[]): MonthlyCarbonTotal[] {
  return groupCarbonByPeriod(activities, toMonthKey).map((item) => ({
    month: item.period,
    co2eKg: item.co2eKg,
  }));
}

export function getDailyTotals(activities: Activity[]): CarbonPeriodTotal[] {
  return groupCarbonByPeriod(activities, (date) => date);
}

export function getWeeklyTotals(activities: Activity[]): CarbonPeriodTotal[] {
  return groupCarbonByPeriod(activities, toWeekKey);
}

export function getYearlyTotals(activities: Activity[]): CarbonPeriodTotal[] {
  return groupCarbonByPeriod(activities, toYearKey);
}

function groupCarbonByPeriod(activities: Activity[], getPeriod: (date: string) => string): CarbonPeriodTotal[] {
  const totals = new Map<string, number>();

  for (const activity of activities) {
    const period = getPeriod(activity.date);
    totals.set(period, (totals.get(period) ?? 0) + activity.co2eKg);
  }

  return Array.from(totals.entries())
    .map(([period, co2eKg]) => ({ period, co2eKg: roundCarbon(co2eKg) }))
    .sort((a, b) => a.period.localeCompare(b.period));
}
