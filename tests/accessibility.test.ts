import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProgressPanel } from "@/components/features/progress-panel";
import { EcoTrackProvider } from "@/state/ecotrack-state";

const storageKey = "ecotrack-ai-state-v1";

describe("accessibility behavior", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("supports arrow-key navigation in progress period tabs", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        activities: [
          {
            id: "a1",
            category: "transport",
            activityType: "car_km",
            amount: 10,
            unit: "km",
            date: "2026-06-08",
            co2eKg: 1.92,
            createdAt: "2026-06-08T00:00:00.000Z",
          },
          {
            id: "a2",
            category: "transport",
            activityType: "car_km",
            amount: 5,
            unit: "km",
            date: "2026-06-09",
            co2eKg: 0.96,
            createdAt: "2026-06-09T00:00:00.000Z",
          },
        ],
        profile: null,
        coachHistory: [],
        theme: "light",
      }),
    );

    render(React.createElement(EcoTrackProvider, null, React.createElement(ProgressPanel)));

    const dailyTab = await screen.findByRole("tab", { name: "Daily" });
    expect(dailyTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(dailyTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "Weekly" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Weekly" })).toBeInTheDocument();
  });
});
