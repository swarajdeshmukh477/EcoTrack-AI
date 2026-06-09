import { describe, expect, it } from "vitest";
import {
  answerCoachQuestion,
  buildCoachRecommendations,
  buildStructuredCoachInsight,
} from "@/features/coach/coach-engine";
import type { Activity } from "@/features/activities/activity.types";
import { emptyProfileFormValues } from "@/features/profile/profile.schema";
import type { UserProfile } from "@/features/profile/profile.types";

const baseActivity = {
  id: "a1",
  date: "2026-06-08",
  createdAt: "2026-06-08T00:00:00.000Z",
  note: undefined,
} satisfies Partial<Activity>;

describe("buildCoachRecommendations", () => {
  it("does not create recommendations without activity data", () => {
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

  it.each([
    ["transport", "Replace the highest-emission trip"],
    ["home", "Reduce the largest electricity entry"],
    ["waste", "Divert the largest waste entry"],
  ] as const)("creates category-specific improvements for %s", (category, title) => {
    const insight = buildStructuredCoachInsight([
      {
        ...baseActivity,
        category,
        activityType: category === "home" ? "electricity_kwh" : category === "waste" ? "landfill_kg" : "car_km",
        amount: 10,
        unit: category === "home" ? "kwh" : category === "waste" ? "kg" : "km",
        co2eKg: 10,
      },
    ]);

    expect(insight?.improvements[0]?.title).toBe(title);
    expect(insight?.weeklyPlan).toHaveLength(7);
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

  it("estimates direct driving statements without an upper-bound phrase", () => {
    const response = answerCoachQuestion([], "I drove 2 km by car");

    expect(response?.card.reasoning).toContain("2 km");
    expect(response?.card.reasoning).not.toContain("at most");
    expect(response?.card.expectedImpact).toContain("0.38 kg CO2e");
  });

  it("answers profile-based improvement questions before activity logs exist", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      electricity: {
        monthlyKwh: 300,
        renewablePercent: 0,
      },
    };

    const response = answerCoachQuestion([], "What should I improve first?", profile);

    expect(response?.card.analysis).toContain("Electricity");
    expect(response?.card.recommendation).toContain("Reduce AC usage");
    expect(response?.sourceActivityIds).toEqual([]);
  });

  it("answers why questions from profile fallback context", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      food: {
        dietType: "omnivore",
        meatMealsPerWeek: 5,
      },
    };

    const response = answerCoachQuestion([], "Why is my footprint high?", profile);

    expect(response?.card.analysis).toContain("Food");
    expect(response?.card.recommendation).toContain("meal");
  });

  it("explains missing score when only profile data exists", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      waste: {
        landfillKgPerWeek: 8,
        recyclingKgPerWeek: 0,
      },
    };

    const response = answerCoachQuestion([], "Explain my score simply.", profile);

    expect(response?.card.analysis).toContain("needs activity logs");
    expect(response?.card.recommendation).toContain("Add one dated activity log");
  });

  it("answers AC impact questions with simulator context", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      electricity: {
        monthlyKwh: 200,
        renewablePercent: 0,
      },
    };

    const response = answerCoachQuestion([], "What happens if I reduce AC usage?", profile);

    expect(response?.card.analysis).toContain("Home energy");
    expect(response?.card.recommendation).toContain("Reduce AC");
    expect(response?.card.expectedImpact).toContain("annual savings");
  });

  it("handles AC questions when home energy is not the available profile signal", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "car",
        weeklyDistanceKm: 20,
        sharedTripsPerWeek: 0,
      },
    };

    const response = answerCoachQuestion([], "What happens if I reduce AC usage?", profile);

    expect(response?.card.analysis).toContain("Home energy impact needs electricity data");
    expect(response?.card.expectedImpact).toContain("Save electricity data");
  });

  it("creates a weekly plan from profile fallback data", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      waste: {
        landfillKgPerWeek: 6,
        recyclingKgPerWeek: 0,
      },
    };

    const response = answerCoachQuestion([], "Create a weekly sustainability plan.", profile);

    expect(response?.card.recommendation).toContain("Monday:");
    expect(response?.card.recommendation).toContain("waste");
  });

  it("answers carbon identity questions from the generated twin", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      shopping: {
        clothingItemsPerMonth: 6,
        electronicsItemsPerYear: 1,
      },
    };

    const response = answerCoachQuestion([], "How can I become an Earth Guardian?", profile);

    expect(response?.card.analysis).toContain("Conscious Consumer");
    expect(response?.card.recommendation).toContain("purchase");
  });

  it("uses the default advisor response for general questions", () => {
    const response = answerCoachQuestion(activities, "Give me guidance.");

    expect(response?.card.analysis).toContain("Shopping");
    expect(response?.card.recommendation).toContain("Delay");
  });
});
