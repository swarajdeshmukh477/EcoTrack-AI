import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ActivityForm } from "@/components/features/activity-form";
import { EcoTrackProvider } from "@/state/ecotrack-state";

describe("ActivityForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders labeled controls for keyboard and screen reader users", () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(ActivityForm)));

    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Activity type")).toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toBeInTheDocument();
    expect(screen.getByLabelText("Date")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add activity/i })).toBeInTheDocument();
  });
});
