import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { EcoTrackProvider, useEcoTrack } from "@/state/ecotrack-state";

const storageKey = "ecotrack-ai-state-v1";

function StateProbe() {
  const { activities, addActivity } = useEcoTrack();

  return React.createElement(
    "div",
    null,
    React.createElement("p", null, `Activities: ${activities.length}`),
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () =>
          addActivity({
            amount: Number.POSITIVE_INFINITY,
            activityType: "unknown",
            category: "transport",
            date: "not-a-date",
            unit: "km",
          }),
      },
      "Add invalid activity",
    ),
  );
}

describe("EcoTrack state persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("falls back safely when localStorage contains malformed JSON", async () => {
    window.localStorage.setItem(storageKey, "{bad json");

    render(React.createElement(EcoTrackProvider, null, React.createElement(StateProbe)));

    expect(await screen.findByText("Activities: 0")).toBeInTheDocument();
  });

  it("falls back safely when localStorage contains schema-invalid data", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        activities: [
          {
            amount: Number.POSITIVE_INFINITY,
            category: "transport",
            activityType: "car_km",
            co2eKg: Number.POSITIVE_INFINITY,
            createdAt: "bad-date",
            date: "bad-date",
            id: "",
            unit: "km",
          },
        ],
        coachHistory: [],
        profile: null,
        theme: "light",
      }),
    );

    render(React.createElement(EcoTrackProvider, null, React.createElement(StateProbe)));

    expect(await screen.findByText("Activities: 0")).toBeInTheDocument();
  });

  it("ignores invalid runtime activity payloads before calculation", async () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(StateProbe)));

    fireEvent.click(await screen.findByRole("button", { name: "Add invalid activity" }));

    expect(screen.getByText("Activities: 0")).toBeInTheDocument();
  });
});
