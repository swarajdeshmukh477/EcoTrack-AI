import { describe, expect, it } from "vitest";
import {
  answerCoachQuestion,
  buildCoachRecommendations,
  buildStructuredCoachInsight,
} from "@/features/coach/coach-engine";
import type { Activity } from "@/features/activities/activity.types";

const baseActivity = {
  id: "a1",
  date: "2026-06-08",
  createdAt: "2026-06-08T00:00:00.000Z",
  note: undefined,
} satisfies Partial<Activity>;

describe("buildCoachRecommendations", () => {
  it("does not create placeholder recommendations without activity data", () => {
    expect(buildCoachRecommendations([])).toEqual([]);
  });

  it("creates a recommendation from the highest real category", () => {
    const recommendations = buildCoachRecommendations([
      {
        ...baseActivity,
        category: "food",
        activityType: "beef_meal",
        amount: 2,
        unit: "meal",
        co2eKg: 12,
      },
      {
        ...baseActivity,
        id: "a2",
        category: "transport",
        activityType: "rail_km",
        amount: 10,
        unit: "km",
        co2eKg: 0.41,
      },
    ]);

    expect(recommendations.length).toBeGreaterThan(1);
    expect(recommendations[0]?.category).toBe("food");
    expect(recommendations[0]?.sourceActivityIds).toEqual(["a1"]);
  });
});

describe("buildStructuredCoachInsight", () => {
  it("returns no structured insight without user data", () => {
    expect(buildStructuredCoachInsight([])).toBeNull();
  });

  it("identifies the highest emission source and explains it with user data", () => {
    const insight = buildStructuredCoachInsight([
      {
        ...baseActivity,
        category: "food",
        activityType: "beef_meal",
        amount: 2,
        unit: "meal",
        co2eKg: 12,
      },
      {
        ...baseActivity,
        id: "a2",
        category: "transport",
        activityType: "rail_km",
        amount: 10,
        unit: "km",
        co2eKg: 3,
      },
    ]);

    expect(insight?.highestSource).toEqual({
      category: "food",
      co2eKg: 12,
      percentage: 80,
    });
    expect(insight?.reason).toContain("80.0%");
    expect(insight?.improvements[0]?.sourceActivityIds).toEqual(["a1"]);
  });
});

describe("answerCoachQuestion", () => {
  const activities: Activity[] = [
    {
      ...baseActivity,
      category: "shopping",
      activityType: "clothing_item",
      amount: 3,
      unit: "item",
      co2eKg: 24,
    },
  ];

  it("answers score questions from logged data", () => {
    const response = answerCoachQuestion(activities, "Explain my score simply.");

    expect(response?.answer).toContain("Your score is");
    expect(response?.sourceActivityIds).toEqual(["a1"]);
  });

  it("generates a weekly action plan from the highest category", () => {
    const response = answerCoachQuestion(activities, "Generate a weekly plan.");

    expect(response?.answer).toContain("Monday:");
    expect(response?.answer).toContain("shopping");
  });

  it("does not answer without logged activity data", () => {
    expect(answerCoachQuestion([], "What should I improve first?")).toBeNull();
  });

  it("responds appropriately to a typed driving activity statement", () => {
    const response = answerCoachQuestion([], "I drove less than 1 km");

    expect(response?.answer).toContain("car travel");
    expect(response?.answer).toContain("0.19 kg CO2e");
    expect(response?.answer).toContain("I have not counted it");
    expect(response?.sourceActivityIds).toEqual([]);
  });
});
