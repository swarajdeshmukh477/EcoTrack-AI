export const activityCategories = [
  "transport",
  "food",
  "home",
  "shopping",
  "waste",
] as const;

export const activityUnits = ["km", "meal", "kwh", "item", "kg"] as const;

export type ActivityCategory = (typeof activityCategories)[number];
export type ActivityUnit = (typeof activityUnits)[number];

export type ActivityInput = {
  category: ActivityCategory;
  activityType: string;
  amount: number;
  unit: ActivityUnit;
  date: string;
  note?: string;
};

export type Activity = ActivityInput & {
  id: string;
  co2eKg: number;
  createdAt: string;
};
