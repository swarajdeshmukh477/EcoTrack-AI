import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportDownloadPanel } from "@/components/features/report-download-panel";
import type { Activity } from "@/features/activities/activity.types";
import { EcoTrackProvider } from "@/state/ecotrack-state";

const storageKey = "ecotrack-ai-state-v1";

function activity(): Activity {
  return {
    id: "activity-1",
    category: "transport",
    activityType: "car_km",
    amount: 12,
    unit: "km",
    co2eKg: 2.31,
    date: "2026-06-09",
    createdAt: "2026-06-09T00:00:00.000Z",
  };
}

describe("ReportDownloadPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        activities: [activity()],
        coachHistory: [],
        profile: null,
        theme: "light",
      }),
    );

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:ecotrack-report"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("connects the button to PDF generation and download feedback", async () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(ReportDownloadPanel)));

    const button = await screen.findByRole("button", { name: "Download Sustainability Report" });

    fireEvent.click(button);

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob)));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled();
    expect(screen.getByText("Report downloaded successfully")).toBeInTheDocument();
  });
});
