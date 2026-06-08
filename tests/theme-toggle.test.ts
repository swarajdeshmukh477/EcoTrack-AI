import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { EcoTrackApp } from "@/components/ecotrack-app";

describe("theme toggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("toggles between light and dark mode", () => {
    render(React.createElement(EcoTrackApp));

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });
});
