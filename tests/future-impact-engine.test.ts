import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { defaultHabitAdjustments, habitAdjustmentsSchema } from "@/features/simulator/simulator.schema";
import { emptyProfileFormValues } from "@/features/profile/profile.schema";
import type { UserProfile } from "@/features/profile/profile.types";

function activity(id: string, co2eKg: number, category: Activity["category"] = "transport"): Activity {
  return {
    id,
    category,
    activityType: category === "food" ? "beef_meal" : "car_km",
    amount: 1,
    unit: category === "food" ? "meal" : "km",
    co2eKg,
    date: "2026-06-09",
    createdAt: "2026-06-09T00:00:00.000Z",
  };
}

describe("simulateFutureImpact", () => {
  it("returns null for users with no usable data", () => {
    expect(simulateFutureImpact(null, [], defaultHabitAdjustments)).toBeNull();
    expect(simulateFutureImpact(emptyProfileFormValues, [], defaultHabitAdjustments)).toBeNull();
  });

  it("simulates future emissions from logged activity data", () => {
    const result = simulateFutureImpact(null, [activity("a1", 10)], {
      ...defaultHabitAdjustments,
      transportReductionPercent: 20,
    });

    expect(result?.dataSource).toBe("activity_logs");
    expect(result?.currentAnnualKg).toBe(3650);
    expect(result?.futureAnnualKg).toBe(2920);
    expect(result?.reductionPercent).toBe(20);
    expect(result?.annualSavingsKg).toBe(730);
  });

  it("uses saved profile data when there are no activity logs", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      electricity: {
        monthlyKwh: 100,
        renewablePercent: 0,
      },
    };

    const result = simulateFutureImpact(profile, [], {
      ...defaultHabitAdjustments,
      electricityReductionPercent: 10,
    });

    expect(result?.dataSource).toBe("profile");
    expect(result?.currentAnnualKg).toBeCloseTo(460.77, 2);
    expect(result?.futureAnnualKg).toBeCloseTo(414.69, 2);
    expect(result?.reductionPercent).toBe(10);
  });

  it("simulates all adjustable profile categories together", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "car",
        weeklyDistanceKm: 100,
        sharedTripsPerWeek: 0,
      },
      electricity: {
        monthlyKwh: 100,
        renewablePercent: 0,
      },
      food: {
        dietType: "omnivore",
        meatMealsPerWeek: 3,
      },
      shopping: {
        clothingItemsPerMonth: 2,
        electronicsItemsPerYear: 1,
      },
      waste: {
        landfillKgPerWeek: 10,
        recyclingKgPerWeek: 2,
      },
    };

    const result = simulateFutureImpact(profile, [], {
      transportReductionPercent: 25,
      electricityReductionPercent: 10,
      meatMealsReducedPerWeek: 2,
      shoppingReductionPercent: 20,
      wasteDiversionPercent: 50,
    });

    expect(result?.categories.find((item) => item.category === "transport")?.annualSavingsKg).toBeCloseTo(249.6, 1);
    expect(result?.categories.find((item) => item.category === "home")?.annualSavingsKg).toBeCloseTo(46.08, 1);
    expect(result?.categories.find((item) => item.category === "food")?.annualSavingsKg).toBe(624);
    expect(result?.categories.find((item) => item.category === "shopping")?.annualSavingsKg).toBeCloseTo(48.3, 1);
    expect(result?.categories.find((item) => item.category === "waste")?.annualSavingsKg).toBeCloseTo(118.04, 1);
    expect(result?.annualSavingsKg).toBeGreaterThan(1000);
    expect(result?.futureAnnualKg).toBeLessThan(result?.currentAnnualKg ?? 0);
  });

  it("caps meat-meal reductions at available food emissions", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      food: {
        dietType: "omnivore",
        meatMealsPerWeek: 1,
      },
    };

    const result = simulateFutureImpact(profile, [], {
      ...defaultHabitAdjustments,
      meatMealsReducedPerWeek: 10,
    });

    expect(result?.categories.find((item) => item.category === "food")?.futureAnnualKg).toBe(0);
    expect(result?.categories.find((item) => item.category === "food")?.annualSavingsKg).toBe(312);
  });

  it("uses logged food emissions as the max reduction when no profile exists", () => {
    const result = simulateFutureImpact(null, [activity("food-log", 6, "food")], {
      ...defaultHabitAdjustments,
      meatMealsReducedPerWeek: 20,
    });

    expect(result?.categories.find((item) => item.category === "food")?.futureAnnualKg).toBe(0);
    expect(result?.categories.find((item) => item.category === "food")?.annualSavingsKg).toBe(2190);
  });

  it("validates simulator adjustment boundaries", () => {
    expect(
      habitAdjustmentsSchema.safeParse({
        transportReductionPercent: 101,
        electricityReductionPercent: 10,
        meatMealsReducedPerWeek: 1,
        shoppingReductionPercent: 10,
        wasteDiversionPercent: 10,
      }).success,
    ).toBe(false);

    expect(
      habitAdjustmentsSchema.parse({
        transportReductionPercent: "15",
        electricityReductionPercent: "10",
        meatMealsReducedPerWeek: "2",
        shoppingReductionPercent: "5",
        wasteDiversionPercent: "20",
      }),
    ).toEqual({
      transportReductionPercent: 15,
      electricityReductionPercent: 10,
      meatMealsReducedPerWeek: 2,
      shoppingReductionPercent: 5,
      wasteDiversionPercent: 20,
    });
  });
});
