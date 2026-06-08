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

    fireEvent.click(screen.getByRole("tab", { name: "Conversational" }));
    fireEvent.change(screen.getByLabelText("Ask about your footprint"), {
      target: { value: "I drove less than 1 km" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ask coach" }));

    expect(screen.getByText(/car travel/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete chat message" }));
    expect(screen.queryByText(/car travel/i)).not.toBeInTheDocument();
  });

  it("has a history toggle in conversational mode", () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(CoachPanel)));

    fireEvent.click(screen.getByRole("tab", { name: "Conversational" }));

    expect(screen.getByRole("button", { name: "Hide history" })).toBeInTheDocument();
  });
});
