"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { z } from "zod";
import type { Activity, ActivityInput } from "@/features/activities/activity.types";
import { activitySchema } from "@/features/activities/activity.schema";
import { calculateActivityCarbon } from "@/features/carbon/carbon-calculator";
import type { CoachChatMessage } from "@/features/coach/coach.types";
import { coachChatMessageSchema } from "@/features/coach/coach.schema";
import type { UserProfile } from "@/features/profile/profile.types";
import { profileSchema } from "@/features/profile/profile.schema";

const STORAGE_KEY = "ecotrack-ai-state-v1";

const themeSchema = z.enum(["light", "dark"]);

const appStateSchema = z.object({
  activities: z.array(activitySchema).default([]),
  profile: profileSchema.nullable().default(null),
  coachHistory: z.array(coachChatMessageSchema).default([]),
  theme: themeSchema.default("light"),
});

type EcoTrackState = z.infer<typeof appStateSchema>;

type EcoTrackAction =
  | { type: "activities/add"; payload: ActivityInput }
  | { type: "activities/remove"; payload: string }
  | { type: "profile/save"; payload: UserProfile }
  | { type: "coach/history/add"; payload: Omit<CoachChatMessage, "id" | "createdAt"> }
  | { type: "coach/history/delete"; payload: string }
  | { type: "coach/history/clear" }
  | { type: "theme/toggle" }
  | { type: "state/reset" }
  | { type: "state/load"; payload: EcoTrackState };

type EcoTrackContextValue = EcoTrackState & {
  addActivity: (activity: ActivityInput) => void;
  removeActivity: (id: string) => void;
  saveProfile: (profile: UserProfile) => void;
  addCoachMessage: (message: Omit<CoachChatMessage, "id" | "createdAt">) => void;
  deleteCoachMessage: (id: string) => void;
  clearCoachHistory: () => void;
  toggleTheme: () => void;
  resetData: () => void;
};

const initialState: EcoTrackState = {
  activities: [],
  profile: null,
  coachHistory: [],
  theme: "light",
};

const EcoTrackContext = createContext<EcoTrackContextValue | null>(null);

function reducer(state: EcoTrackState, action: EcoTrackAction): EcoTrackState {
  switch (action.type) {
    case "activities/add": {
      const now = new Date().toISOString();
      const activity: Activity = {
        ...action.payload,
        id: createId(),
        co2eKg: calculateActivityCarbon(action.payload),
        createdAt: now,
      };

      return {
        ...state,
        activities: [activity, ...state.activities],
      };
    }
    case "activities/remove":
      return {
        ...state,
        activities: state.activities.filter((activity) => activity.id !== action.payload),
      };
    case "profile/save":
      return {
        ...state,
        profile: action.payload,
      };
    case "coach/history/add":
      return {
        ...state,
        coachHistory: [
          ...state.coachHistory,
          {
            ...action.payload,
            id: createId("coach-message"),
            createdAt: new Date().toISOString(),
          },
        ],
      };
    case "coach/history/delete":
      return {
        ...state,
        coachHistory: state.coachHistory.filter((message) => message.id !== action.payload),
      };
    case "coach/history/clear":
      return {
        ...state,
        coachHistory: [],
      };
    case "theme/toggle":
      return {
        ...state,
        theme: state.theme === "dark" ? "light" : "dark",
      };
    case "state/reset":
      return {
        ...initialState,
        theme: state.theme,
      };
    case "state/load":
      return action.payload;
    default:
      return state;
  }
}

export function EcoTrackProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredState();
    if (stored) {
      dispatch({ type: "state/load", payload: stored });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  const value = useMemo<EcoTrackContextValue>(
    () => ({
      ...state,
      addActivity: (activity) => dispatch({ type: "activities/add", payload: activity }),
      removeActivity: (id) => dispatch({ type: "activities/remove", payload: id }),
      saveProfile: (profile) => dispatch({ type: "profile/save", payload: profile }),
      addCoachMessage: (message) => dispatch({ type: "coach/history/add", payload: message }),
      deleteCoachMessage: (id) => dispatch({ type: "coach/history/delete", payload: id }),
      clearCoachHistory: () => dispatch({ type: "coach/history/clear" }),
      toggleTheme: () => dispatch({ type: "theme/toggle" }),
      resetData: () => dispatch({ type: "state/reset" }),
    }),
    [state],
  );

  return <EcoTrackContext.Provider value={value}>{children}</EcoTrackContext.Provider>;
}

export function useEcoTrack() {
  const context = useContext(EcoTrackContext);

  if (!context) {
    throw new Error("useEcoTrack must be used inside EcoTrackProvider.");
  }

  return context;
}

function readStoredState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = appStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : initialState;
  } catch {
    return initialState;
  }
}

function createId(prefix = "activity") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}`;
}
