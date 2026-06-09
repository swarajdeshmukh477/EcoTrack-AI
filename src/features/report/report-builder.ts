import type { Activity } from "@/features/activities/activity.types";
import { buildCarbonEngineResult } from "@/features/carbon/carbon-engine";
import { buildStructuredCoachInsight } from "@/features/coach/coach-engine";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { defaultHabitAdjustments } from "@/features/simulator/simulator.schema";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import type { UserProfile } from "@/features/profile/profile.types";
import type { CarbonReport } from "./report.types";

export function buildCarbonReport(profile: UserProfile | null, activities: Activity[]): CarbonReport | null {
  const carbon = buildCarbonEngineResult(activities);
  const twin = buildCarbonTwin(profile, activities);
  const coach = buildStructuredCoachInsight(activities);
  const futureImpact = simulateFutureImpact(profile, activities, defaultHabitAdjustments);

  if (!carbon.score || carbon.categoryBreakdown.length === 0 || !twin || !coach || !futureImpact) {
    return null;
  }

  return {
    generatedAt: new Date().toISOString(),
    score: carbon.score,
    breakdown: carbon.categoryBreakdown,
    twin,
    recommendations: coach.improvements,
    weeklyPlan: coach.weeklyPlan,
    futureImpact,
  };
}
