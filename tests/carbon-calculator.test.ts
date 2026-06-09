import { describe, expect, it } from "vitest";
import { calculateActivityCarbon, roundCarbon } from "@/features/carbon/carbon-calculator";

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

  it("rejects unknown activity factors", () => {
    expect(() =>
      calculateActivityCarbon({
        category: "transport",
        activityType: "unknown_factor",
        amount: 1,
        unit: "km",
        date: "2026-06-08",
      }),
    ).toThrow("Unknown activity type");
  });

  it("rounds emissions to three decimals", () => {
    expect(roundCarbon(1.23456)).toBe(1.235);
    expect(
      calculateActivityCarbon({
        category: "transport",
        activityType: "rail_km",
        amount: 3.333,
        unit: "km",
        date: "2026-06-08",
      }),
    ).toBe(0.137);
  });
});
