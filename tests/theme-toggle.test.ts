import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EcoTrackApp } from "@/components/ecotrack-app";

describe("theme toggle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("toggles between light and dark mode", () => {
    render(React.createElement(EcoTrackApp));

    expect(screen.getByRole("heading", { name: "Your Personal Sustainability Coach" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("shows bottom navigation after loading", () => {
    render(React.createElement(EcoTrackApp));

    fireEvent.click(screen.getByRole("button", { name: /get started/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(document.getElementById("main-content")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main application tabs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Home tab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Coach tab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Simulator tab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Progress tab" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Profile tab" })).toBeInTheDocument();
  });
});
