import { describe, expect, it } from "vitest";
import { getProgressSummary } from "@/features/progress/progress-calculator";
import type { Activity } from "@/features/activities/activity.types";

function activity(id: string, date: string, co2eKg: number): Activity {
  return {
    id,
    date,
    co2eKg,
    category: "transport",
    activityType: "car_km",
    amount: 1,
    unit: "km",
    createdAt: `${date}T00:00:00.000Z`,
  };
}

describe("getProgressSummary", () => {
  it("returns no percentage when there is no previous month", () => {
    expect(getProgressSummary([activity("a1", "2026-06-08", 3)])).toEqual({
      currentMonthKg: 3,
      previousMonthKg: 0,
      changePercent: null,
    });
  });

  it("compares the two latest logged months", () => {
    expect(
      getProgressSummary([activity("a1", "2026-05-08", 10), activity("a2", "2026-06-08", 8)]),
    ).toEqual({
      currentMonthKg: 8,
      previousMonthKg: 10,
      changePercent: -20,
    });
  });
});
