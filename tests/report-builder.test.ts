import { describe, expect, it } from "vitest";
import type { Activity } from "@/features/activities/activity.types";
import { buildCarbonReport } from "@/features/report/report-builder";
import { buildReportFileName, createReportPdfBlob, createReportPdfDocument } from "@/features/report/pdf-generator";

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

describe("buildCarbonReport", () => {
  it("returns null until score, breakdown, twin, recommendations, and plan exist", () => {
    expect(buildCarbonReport(null, [])).toBeNull();
  });

  it("builds a complete report from activity data", () => {
    const report = buildCarbonReport(null, [activity("a1", "food", 10), activity("a2", "transport", 3)]);

    expect(report?.score.value).toBeGreaterThan(0);
    expect(report?.breakdown).toHaveLength(2);
    expect(report?.twin.identity).toBeTruthy();
    expect(report?.recommendations.length).toBeGreaterThan(0);
    expect(report?.weeklyPlan).toHaveLength(7);
    expect(report?.futureImpact.currentAnnualKg).toBeGreaterThan(0);
    expect(report?.futureImpact.annualSavingsKg).toBeGreaterThanOrEqual(0);
  });
});

describe("createReportPdfBlob", () => {
  it("creates a downloadable PDF blob", async () => {
    const report = buildCarbonReport(null, [activity("a1", "food", 10)]);

    expect(report).not.toBeNull();

    const blob = createReportPdfBlob(report!);
    const document = createReportPdfDocument(report!);
    const text = document.output();

    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(0);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("EcoTrack AI Sustainability Report");
    expect(text).toContain("Future Impact Summary");
    expect(text).toContain(String(report!.score.value));
    expect(buildReportFileName(report!)).toMatch(/^ecotrack-report-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});
