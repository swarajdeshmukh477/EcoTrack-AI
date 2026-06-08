import type { ActivityInput } from "@/features/activities/activity.types";
import { getCarbonFactor } from "./carbon-factors";

export function calculateActivityCarbon(activity: ActivityInput) {
  const factor = getCarbonFactor(activity.activityType);

  if (!factor) {
    throw new Error("Unknown activity type.");
  }

  if (factor.category !== activity.category || factor.unit !== activity.unit) {
    throw new Error("Activity category and unit must match the selected factor.");
  }

  return roundCarbon(activity.amount * factor.kgCo2ePerUnit);
}

export function roundCarbon(value: number) {
  return Math.round(value * 1000) / 1000;
}
