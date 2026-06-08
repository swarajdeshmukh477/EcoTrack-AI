import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { buildCarbonEngineResult, calculateCarbonScore } from "@/features/carbon/carbon-engine";

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
});

describe("calculateCarbonScore", () => {
  it("creates a rating from annualized logged emissions", () => {
    expect(calculateCarbonScore([activity("a1", "2026-06-08", 10)])).toEqual({
      value: 55,
      rating: "moderate",
      annualizedKg: 3650,
    });
  });
});
