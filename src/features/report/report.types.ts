import type { CarbonBreakdownItem, CarbonScore } from "@/features/carbon/carbon.types";
import type { CoachAction, CoachActionPlanItem } from "@/features/coach/coach.types";
import type { FutureImpactResult } from "@/features/simulator/simulator.types";
import type { CarbonTwin } from "@/features/twin/carbon-twin.types";

export type CarbonReport = {
  generatedAt: string;
  score: CarbonScore;
  breakdown: CarbonBreakdownItem[];
  twin: CarbonTwin;
  recommendations: CoachAction[];
  weeklyPlan: CoachActionPlanItem[];
  futureImpact: FutureImpactResult;
};
