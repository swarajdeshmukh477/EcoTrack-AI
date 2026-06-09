import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { buildCarbonEngineResult, calculateCarbonScore, formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import { getHighestCategory } from "@/features/carbon/carbon-breakdown";

function activity(id: string, date: string, co2eKg: number, category: Activity["category"] = "transport"): Activity {
  return {
    id,
    date,
    co2eKg,
    category,
    activityType: category === "food" ? "beef_meal" : "car_km",
    amount: 1,
    unit: category === "food" ? "meal" : "km",
    createdAt: `${date}T00:00:00.000Z`,
  };
}

describe("buildCarbonEngineResult", () => {
  it("returns zero totals and no rating for new users", () => {
    expect(buildCarbonEngineResult([])).toEqual({
      totalKg: 0,
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
      score: null,
      categoryBreakdown: [],
    });
  });

  it("groups emissions by day, week, month, and year", () => {
    const result = buildCarbonEngineResult([
      activity("a1", "2026-06-08", 2),
      activity("a2", "2026-06-08", 3, "food"),
      activity("a3", "2026-06-15", 4),
    ]);

    expect(result.daily).toEqual([
      { period: "2026-06-08", co2eKg: 5 },
      { period: "2026-06-15", co2eKg: 4 },
    ]);
    expect(result.weekly).toEqual([
      { period: "2026-W24", co2eKg: 5 },
      { period: "2026-W25", co2eKg: 4 },
    ]);
    expect(result.monthly).toEqual([{ period: "2026-06", co2eKg: 9 }]);
    expect(result.yearly).toEqual([{ period: "2026", co2eKg: 9 }]);
  });

  it("calculates category percentages from logged emissions", () => {
    const result = buildCarbonEngineResult([
      activity("a1", "2026-06-08", 2),
      activity("a2", "2026-06-08", 6, "food"),
    ]);

    expect(result.categoryBreakdown).toEqual([
      { category: "transport", co2eKg: 2, percentage: 25 },
      { category: "food", co2eKg: 6, percentage: 75 },
    ]);
  });

  it("identifies the highest category or returns null for empty logs", () => {
    expect(getHighestCategory([])).toBeNull();
    expect(getHighestCategory([activity("a1", "2026-06-08", 3), activity("a2", "2026-06-08", 9, "food")])).toBe(
      "food",
    );
  });
});

describe("calculateCarbonScore", () => {
  it("creates a rating from annualized logged emissions", () => {
    expect(calculateCarbonScore([activity("a1", "2026-06-08", 10)])).toEqual({
      value: 55,
      rating: "moderate",
      annualizedKg: 3650,
    });
  });

  it("returns null without logged activities", () => {
    expect(calculateCarbonScore([])).toBeNull();
  });

  it.each([
    [2, 90, "excellent", 730],
    [5, 75, "good", 1825],
    [10, 55, "moderate", 3650],
    [20, 35, "high", 7300],
    [35, 15, "very_high", 12775],
  ] as const)("maps %s kg per active day to the expected score band", (dailyKg, value, rating, annualizedKg) => {
    expect(calculateCarbonScore([activity("band", "2026-06-08", dailyKg)])).toEqual({
      value,
      rating,
      annualizedKg,
    });
  });

  it("annualizes emissions across the full active date range", () => {
    expect(calculateCarbonScore([activity("a1", "2026-06-08", 5), activity("a2", "2026-06-09", 5)])).toEqual({
      value: 75,
      rating: "good",
      annualizedKg: 1825,
    });
  });

  it("formats every sustainability rating for display", () => {
    expect(formatSustainabilityRating("excellent")).toBe("Excellent");
    expect(formatSustainabilityRating("good")).toBe("Good");
    expect(formatSustainabilityRating("moderate")).toBe("Moderate");
    expect(formatSustainabilityRating("high")).toBe("High impact");
    expect(formatSustainabilityRating("very_high")).toBe("Very high impact");
  });
});
