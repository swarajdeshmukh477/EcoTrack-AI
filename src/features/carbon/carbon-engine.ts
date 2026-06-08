import type { Activity } from "@/features/activities/activity.types";
import {
  getCategoryBreakdown,
  getDailyTotals,
  getMonthlyTotals,
  getTotalCarbon,
  getWeeklyTotals,
  getYearlyTotals,
} from "./carbon-breakdown";
import { roundCarbon } from "./carbon-calculator";
import type { CarbonEngineResult, CarbonScore, SustainabilityRating } from "./carbon.types";

const scoreBands: Array<{ maxAnnualKg: number; rating: SustainabilityRating; score: number }> = [
  { maxAnnualKg: 1000, rating: "excellent", score: 90 },
  { maxAnnualKg: 2500, rating: "good", score: 75 },
  { maxAnnualKg: 5000, rating: "moderate", score: 55 },
  { maxAnnualKg: 10000, rating: "high", score: 35 },
  { maxAnnualKg: Number.POSITIVE_INFINITY, rating: "very_high", score: 15 },
];

/**
 * Builds the complete carbon result from real activity logs only.
 * Empty input returns zero totals and no score/rating so new users never receive fake progress.
 */
export function buildCarbonEngineResult(activities: Activity[]): CarbonEngineResult {
  const totalKg = getTotalCarbon(activities);

  return {
    totalKg,
    daily: getDailyTotals(activities),
    weekly: getWeeklyTotals(activities),
    monthly: getMonthlyTotals(activities).map((item) => ({
      period: item.month,
      co2eKg: item.co2eKg,
    })),
    yearly: getYearlyTotals(activities),
    score: calculateCarbonScore(activities),
    categoryBreakdown: getCategoryBreakdown(activities),
  };
}

/**
 * Produces an app-level score from the user's logged average daily emissions.
 * This is a lightweight estimate for product feedback, not a certification or external benchmark.
 */
export function calculateCarbonScore(activities: Activity[]): CarbonScore | null {
  if (activities.length === 0) {
    return null;
  }

  const annualizedKg = annualizeLoggedEmissions(activities);
  const band = scoreBands.find((item) => annualizedKg <= item.maxAnnualKg) ?? scoreBands.at(-1);

  if (!band) {
    return null;
  }

  return {
    value: band.score,
    rating: band.rating,
    annualizedKg,
  };
}

function annualizeLoggedEmissions(activities: Activity[]) {
  const totalKg = getTotalCarbon(activities);
  const dates = activities.map((activity) => new Date(`${activity.date}T00:00:00.000Z`).getTime());
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);
  const activeDays = Math.max(1, Math.floor((lastDate - firstDate) / 86400000) + 1);

  return roundCarbon((totalKg / activeDays) * 365);
}

export function formatSustainabilityRating(rating: SustainabilityRating) {
  const labels: Record<SustainabilityRating, string> = {
    excellent: "Excellent",
    good: "Good",
    moderate: "Moderate",
    high: "High impact",
    very_high: "Very high impact",
  };

  return labels[rating];
}
