export type ProgressSummary = {
  currentMonthKg: number;
  previousMonthKg: number;
  changePercent: number | null;
};

export type ProgressPeriod = "daily" | "weekly" | "monthly";

export type ProgressPoint = {
  period: string;
  co2eKg: number;
};

export type PeriodProgressSummary = {
  currentKg: number;
  previousKg: number;
  improvementPercent: number | null;
};

export type ProgressReport = {
  daily: ProgressPoint[];
  weekly: ProgressPoint[];
  monthly: ProgressPoint[];
  summaries: Record<ProgressPeriod, PeriodProgressSummary>;
};
