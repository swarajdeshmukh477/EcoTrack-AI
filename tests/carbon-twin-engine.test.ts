import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import { emptyProfileFormValues } from "@/features/profile/profile.schema";
import type { UserProfile } from "@/features/profile/profile.types";

function activity(id: string, category: Activity["category"], co2eKg: number): Activity {
  return {
    id,
    category,
    co2eKg,
    activityType: category === "food" ? "beef_meal" : "car_km",
    amount: 1,
    unit: category === "food" ? "meal" : "km",
    date: "2026-06-09",
    createdAt: "2026-06-09T00:00:00.000Z",
  };
}

describe("buildCarbonTwin", () => {
  it("returns no twin for brand-new users with zero data", () => {
    expect(buildCarbonTwin(null, [])).toBeNull();
    expect(buildCarbonTwin(emptyProfileFormValues, [])).toBeNull();
  });

  it("generates Urban Commuter from transport-heavy data", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "car",
        weeklyDistanceKm: 40,
        sharedTripsPerWeek: 0,
      },
    };

    const twin = buildCarbonTwin(profile, [activity("a1", "transport", 20), activity("a2", "food", 2)]);

    expect(twin?.identity).toBe("Urban Commuter");
    expect(twin?.dominantCategory).toBe("transport");
    expect(twin?.weaknesses.some((item) => item.includes("car"))).toBe(true);
  });

  it("generates Conscious Consumer from shopping-heavy profile data", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      shopping: {
        clothingItemsPerMonth: 8,
        electronicsItemsPerYear: 2,
      },
    };

    const twin = buildCarbonTwin(profile, []);

    expect(twin?.identity).toBe("Conscious Consumer");
    expect(twin?.dataSource).toBe("profile");
    expect(twin?.opportunities).toContain("Delay one non-essential purchase for 48 hours.");
  });

  it("generates Green Explorer from low-carbon travel profile data", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "bike_walk",
        weeklyDistanceKm: 10,
        sharedTripsPerWeek: 0,
      },
      food: {
        dietType: "vegetarian",
        meatMealsPerWeek: 1,
      },
    };

    const twin = buildCarbonTwin(profile, []);

    expect(twin?.identity).toBe("Green Explorer");
    expect(twin?.strengths.some((item) => item.includes("travel habit"))).toBe(true);
  });
});
