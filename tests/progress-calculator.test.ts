import { describe, expect, it } from "vitest";
import { buildProgressReport, getProgressSummary, summarizeProgress } from "@/features/progress/progress-calculator";
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

describe("buildProgressReport", () => {
  it("tracks daily, weekly, and monthly emissions from activity history", () => {
    const report = buildProgressReport([
      activity("a1", "2026-06-08", 10),
      activity("a2", "2026-06-09", 5),
      activity("a3", "2026-06-15", 4),
    ]);

    expect(report.daily).toEqual([
      { period: "2026-06-08", co2eKg: 10 },
      { period: "2026-06-09", co2eKg: 5 },
      { period: "2026-06-15", co2eKg: 4 },
    ]);
    expect(report.weekly).toEqual([
      { period: "2026-W24", co2eKg: 15 },
      { period: "2026-W25", co2eKg: 4 },
    ]);
    expect(report.monthly).toEqual([{ period: "2026-06", co2eKg: 19 }]);
  });

  it("calculates positive improvement when emissions decrease", () => {
    expect(
      summarizeProgress([
        { period: "2026-W24", co2eKg: 10 },
        { period: "2026-W25", co2eKg: 7 },
      ]),
    ).toEqual({
      currentKg: 7,
      previousKg: 10,
      improvementPercent: 30,
    });
  });
});
