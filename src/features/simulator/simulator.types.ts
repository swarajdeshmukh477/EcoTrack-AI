import type { ActivityCategory } from "@/features/activities/activity.types";

export type SimulatorDataSource = "activity_logs" | "profile";

export type HabitAdjustments = {
  transportReductionPercent: number;
  electricityReductionPercent: number;
  meatMealsReducedPerWeek: number;
  shoppingReductionPercent: number;
  wasteDiversionPercent: number;
};

export type ImpactCategoryResult = {
  category: ActivityCategory;
  currentAnnualKg: number;
  futureAnnualKg: number;
  annualSavingsKg: number;
};

export type FutureImpactResult = {
  dataSource: SimulatorDataSource;
  currentAnnualKg: number;
  futureAnnualKg: number;
  reductionPercent: number;
  annualSavingsKg: number;
  categories: ImpactCategoryResult[];
};
