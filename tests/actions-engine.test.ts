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
});
