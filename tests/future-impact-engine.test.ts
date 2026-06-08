import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { defaultHabitAdjustments } from "@/features/simulator/simulator.schema";
import { emptyProfileFormValues } from "@/features/profile/profile.schema";
import type { UserProfile } from "@/features/profile/profile.types";

function activity(id: string, co2eKg: number): Activity {
  return {
    id,
    category: "transport",
    activityType: "car_km",
    amount: 1,
    unit: "km",
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
});
