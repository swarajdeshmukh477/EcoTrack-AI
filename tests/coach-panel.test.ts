import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CoachPanel } from "@/components/features/coach-panel";
import { EcoTrackProvider } from "@/state/ecotrack-state";

describe("CoachPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("answers a typed driving statement and allows deleting it from chat", () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(CoachPanel)));

    fireEvent.change(screen.getByRole("textbox", { name: "Ask your coach" }), {
      target: { value: "I drove less than 1 km" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask coach" }));

    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByText("Reasoning")).toBeInTheDocument();
    expect(screen.getByText("Recommendation")).toBeInTheDocument();
    expect(screen.getByText("Expected Impact")).toBeInTheDocument();
    expect(screen.getAllByText(/car travel/i).length).toBeGreaterThan(1);
    fireEvent.click(screen.getByRole("button", { name: "Delete chat message" }));
    expect(screen.queryByText(/car travel/i)).not.toBeInTheDocument();
  });

  it("has a history toggle in the advisor chat", () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(CoachPanel)));

    expect(screen.getByRole("button", { name: "Hide history" })).toBeInTheDocument();
  });
});
