import type { ActivityCategory } from "@/features/activities/activity.types";

export type SimpleActionSource = "activity_logs" | "profile";

export type SimpleAction = {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  reason: string;
  estimatedImpactKg: number;
  source: SimpleActionSource;
};

export type SimpleActionsResult = {
  highestSource: {
    category: ActivityCategory;
    co2eKg: number;
    source: SimpleActionSource;
  } | null;
  actions: SimpleAction[];
};
