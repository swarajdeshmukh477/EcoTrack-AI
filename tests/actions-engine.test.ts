import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { buildSimpleActions } from "@/features/actions/actions-engine";
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

describe("buildSimpleActions", () => {
  it("returns no actions for users with no profile or activity data", () => {
    expect(buildSimpleActions(null, [])).toEqual({
      highestSource: null,
      actions: [],
    });
  });

  it("does not create generic actions from a zero profile", () => {
    expect(buildSimpleActions(emptyProfileFormValues, [])).toEqual({
      highestSource: null,
      actions: [],
    });
  });

  it("generates practical actions from the highest logged emission source", () => {
    const result = buildSimpleActions(null, [
      activity("a1", "food", 12),
      activity("a2", "transport", 4),
    ]);

    expect(result.highestSource).toEqual({
      category: "food",
      co2eKg: 12,
      source: "activity_logs",
    });
    expect(result.actions).toHaveLength(3);
    expect(result.actions[0]?.title).toContain("Swap");
    expect(result.actions.every((action) => action.category === "food")).toBe(true);
  });

  it("uses nonzero profile data when there are no logs", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "car",
        weeklyDistanceKm: 40,
        sharedTripsPerWeek: 0,
      },
    };

    const result = buildSimpleActions(profile, []);

    expect(result.highestSource).toEqual({
      category: "transport",
      co2eKg: 7.68,
      source: "profile",
    });
    expect(result.actions.map((action) => action.title)).toContain("Walk for trips under 2 km");
  });

  it.each([
    [
      "home",
      {
        electricity: {
          monthlyKwh: 200,
          renewablePercent: 0,
        },
      },
      "Reduce AC usage by 1 hour",
    ],
    [
      "shopping",
      {
        shopping: {
          clothingItemsPerMonth: 4,
          electronicsItemsPerYear: 1,
        },
      },
      "Delay one non-essential purchase",
    ],
    [
      "waste",
      {
        waste: {
          landfillKgPerWeek: 12,
          recyclingKgPerWeek: 1,
        },
      },
      "Recycle household waste",
    ],
  ] as const)("generates %s actions from profile-specific data", (category, patch, expectedTitle) => {
    const profile = {
      ...emptyProfileFormValues,
      ...patch,
    } as UserProfile;
    const result = buildSimpleActions(profile, []);

    expect(result.highestSource?.category).toBe(category);
    expect(result.actions[0]?.title).toBe(expectedTitle);
    expect(result.actions.every((action) => action.estimatedImpactKg > 0)).toBe(true);
  });

  it("uses lower-emission transport copy for non-car profiles", () => {
    const profile: UserProfile = {
      ...emptyProfileFormValues,
      transportation: {
        primaryMode: "bus",
        weeklyDistanceKm: 40,
        sharedTripsPerWeek: 4,
      },
    };

    const result = buildSimpleActions(profile, []);

    expect(result.actions[0]?.description).toContain("lower-emission travel mode");
  });

  it("generates transport actions from logs when no profile is saved", () => {
    const result = buildSimpleActions(null, [activity("a1", "transport", 20)]);

    expect(result.highestSource?.source).toBe("activity_logs");
    expect(result.actions[0]?.description).toContain("lower-emission travel mode");
    expect(result.actions[1]?.estimatedImpactKg).toBe(0.384);
  });

  it.each([
    ["shopping", "Delay one non-essential purchase"],
    ["waste", "Recycle household waste"],
  ] as const)("generates %s actions from logs without profile-only details", (category, expectedTitle) => {
    const result = buildSimpleActions(null, [activity("a1", category, 10)]);

    expect(result.actions[0]?.title).toBe(expectedTitle);
    expect(result.actions[0]?.reason).not.toContain("Your profile lists");
  });
});
