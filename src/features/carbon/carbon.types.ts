import type { ActivityCategory, ActivityUnit } from "@/features/activities/activity.types";

export type CarbonFactor = {
  id: string;
  label: string;
  category: ActivityCategory;
  unit: ActivityUnit;
  kgCo2ePerUnit: number;
};

export type CarbonBreakdownItem = {
  category: ActivityCategory;
  co2eKg: number;
  percentage: number;
};

export type MonthlyCarbonTotal = {
  month: string;
  co2eKg: number;
};

export type CarbonPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type CarbonPeriodTotal = {
  period: string;
  co2eKg: number;
};

export type SustainabilityRating = "excellent" | "good" | "moderate" | "high" | "very_high";

export type CarbonScore = {
  value: number;
  rating: SustainabilityRating;
  annualizedKg: number;
};

export type CarbonEngineResult = {
  totalKg: number;
  daily: CarbonPeriodTotal[];
  weekly: CarbonPeriodTotal[];
  monthly: CarbonPeriodTotal[];
  yearly: CarbonPeriodTotal[];
  score: CarbonScore | null;
  categoryBreakdown: CarbonBreakdownItem[];
};
