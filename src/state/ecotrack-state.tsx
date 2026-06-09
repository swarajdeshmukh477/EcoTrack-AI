"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { z } from "zod";
import type { Activity, ActivityInput } from "@/features/activities/activity.types";
import { activityInputSchema, activitySchema } from "@/features/activities/activity.schema";
import { calculateActivityCarbon } from "@/features/carbon/carbon-calculator";
import type { CoachChatMessage } from "@/features/coach/coach.types";
import { coachChatMessageSchema } from "@/features/coach/coach.schema";
import type { UserProfile } from "@/features/profile/profile.types";
import { profileSchema } from "@/features/profile/profile.schema";

const STORAGE_KEY = "ecotrack-ai-state-v1";
const MAX_STORED_ACTIVITIES = 500;
const MAX_STORED_COACH_MESSAGES = 100;

const themeSchema = z.enum(["light", "dark"]);

const appStateSchema = z.object({
  activities: z.array(activitySchema).max(MAX_STORED_ACTIVITIES).default([]),
  profile: profileSchema.nullable().default(null),
  coachHistory: z.array(coachChatMessageSchema).max(MAX_STORED_COACH_MESSAGES).default([]),
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
      const parsedInput = activityInputSchema.safeParse(action.payload);
      if (!parsedInput.success) {
        return state;
      }

      const co2eKg = calculateSafeActivityCarbon(parsedInput.data);

      if (co2eKg === null) {
        return state;
      }

      const now = new Date().toISOString();
      const activity: Activity = {
        ...parsedInput.data,
        id: createId(),
        co2eKg,
        createdAt: now,
      };
      const parsedActivity = activitySchema.safeParse(activity);

      if (!parsedActivity.success) {
        return state;
      }

      return {
        ...state,
        activities: [parsedActivity.data, ...state.activities].slice(0, MAX_STORED_ACTIVITIES),
      };
    }
    case "activities/remove":
      return {
        ...state,
        activities: state.activities.filter((activity) => activity.id !== action.payload),
      };
    case "profile/save": {
      const parsedProfile = profileSchema.safeParse(action.payload);
      if (!parsedProfile.success) {
        return state;
      }

      return {
        ...state,
        profile: parsedProfile.data,
      };
    }
    case "coach/history/add": {
      const message = {
        ...action.payload,
        id: createId("coach-message"),
        createdAt: new Date().toISOString(),
      };
      const parsedMessage = coachChatMessageSchema.safeParse(message);

      if (!parsedMessage.success) {
        return state;
      }

      return {
        ...state,
        coachHistory: [...state.coachHistory, parsedMessage.data].slice(-MAX_STORED_COACH_MESSAGES),
      };
    }
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

    writeStoredState(state);
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
    if (parsed.success) {
      return parsed.data;
    }

    removeStoredState();
    return initialState;
  } catch {
    removeStoredState();
    return initialState;
  }
}

function writeStoredState(state: EcoTrackState) {
  const parsed = appStateSchema.safeParse(state);
  if (!parsed.success) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.data));
  } catch {
    // Local storage can be unavailable or full. The in-memory state remains usable.
  }
}

function removeStoredState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures so corrupted persistence never crashes the app.
  }
}

function calculateSafeActivityCarbon(activity: ActivityInput) {
  try {
    return calculateActivityCarbon(activity);
  } catch {
    return null;
  }
}

function createId(prefix = "activity") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}`;
}
