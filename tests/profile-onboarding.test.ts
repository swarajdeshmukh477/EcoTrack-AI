import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { ProfileOnboarding } from "@/components/features/profile-onboarding";
import { EcoTrackProvider } from "@/state/ecotrack-state";

describe("ProfileOnboarding", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders accessible profile collection fields", () => {
    render(React.createElement(EcoTrackProvider, null, React.createElement(ProfileOnboarding)));

    expect(screen.getByRole("group", { name: "Transportation" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Electricity" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Food" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Shopping" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Waste" })).toBeInTheDocument();
    expect(screen.getByLabelText("Primary transportation mode")).toBeInTheDocument();
    expect(screen.getByLabelText("Monthly electricity use")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save profile/i })).toBeInTheDocument();
  });
});
