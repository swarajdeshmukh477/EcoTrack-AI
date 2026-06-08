import type { ActivityCategory } from "@/features/activities/activity.types";

export type CarbonTwinIdentity = "Urban Commuter" | "Green Explorer" | "Conscious Consumer" | "Climate Warrior";

export type CarbonTwin = {
  identity: CarbonTwinIdentity;
  profile: string;
  dataSource: "activity_logs" | "profile";
  dominantCategory: ActivityCategory;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
};
