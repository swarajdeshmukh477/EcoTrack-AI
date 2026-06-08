import { describe, expect, it } from "vitest";
import { calculateActivityCarbon } from "@/features/carbon/carbon-calculator";

describe("calculateActivityCarbon", () => {
  it("calculates emissions from a valid activity factor", () => {
    expect(
      calculateActivityCarbon({
        category: "transport",
        activityType: "car_km",
        amount: 10,
        unit: "km",
        date: "2026-06-08",
      }),
    ).toBe(1.92);
  });

  it("rejects mismatched units", () => {
    expect(() =>
      calculateActivityCarbon({
        category: "transport",
        activityType: "car_km",
        amount: 10,
        unit: "meal",
        date: "2026-06-08",
      }),
    ).toThrow("must match");
  });
});
