import { describe, expect, it } from "vitest";
import { activityInputSchema } from "@/features/activities/activity.schema";

describe("activityInputSchema", () => {
  it("accepts a valid activity input", () => {
    const result = activityInputSchema.safeParse({
      category: "home",
      activityType: "electricity_kwh",
      amount: 12,
      unit: "kwh",
      date: "2026-06-08",
    });

    expect(result.success).toBe(true);
  });

  it("rejects zero amounts", () => {
    const result = activityInputSchema.safeParse({
      category: "home",
      activityType: "electricity_kwh",
      amount: 0,
      unit: "kwh",
      date: "2026-06-08",
    });

    expect(result.success).toBe(false);
  });
});
