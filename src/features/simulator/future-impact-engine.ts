import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { buildCarbonEngineResult } from "@/features/carbon/carbon-engine";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import { estimateWeeklyProfileEmissions } from "@/features/profile/profile-emissions";
import type { UserProfile } from "@/features/profile/profile.types";
import type { FutureImpactResult, HabitAdjustments, ImpactCategoryResult, SimulatorDataSource } from "./simulator.types";

type AnnualCategoryEstimate = {
  category: ActivityCategory;
  annualKg: number;
};

/**
 * Simulates future impact from real logged emissions or saved profile estimates.
 * It returns null when the user has no usable data, keeping new users at zero data.
 */
export function simulateFutureImpact(
  profile: UserProfile | null,
  activities: Activity[],
  adjustments: HabitAdjustments,
): FutureImpactResult | null {
  const source = getCurrentAnnualEstimates(profile, activities);

  if (source.estimates.length === 0) {
    return null;
  }

  const categories = source.estimates.map((estimate) => applyAdjustment(estimate, adjustments, profile));
  const currentAnnualKg = roundCarbon(categories.reduce((total, item) => total + item.currentAnnualKg, 0));
  const futureAnnualKg = roundCarbon(categories.reduce((total, item) => total + item.futureAnnualKg, 0));
  const annualSavingsKg = roundCarbon(Math.max(0, currentAnnualKg - futureAnnualKg));

  return {
    dataSource: source.dataSource,
    currentAnnualKg,
    futureAnnualKg,
    reductionPercent: currentAnnualKg > 0 ? roundCarbon((annualSavingsKg / currentAnnualKg) * 100) : 0,
    annualSavingsKg,
    categories,
  };
}

function getCurrentAnnualEstimates(profile: UserProfile | null, activities: Activity[]) {
  const loggedEstimates = getLoggedAnnualEstimates(activities);

  if (loggedEstimates.length > 0) {
    return {
      dataSource: "activity_logs" as SimulatorDataSource,
      estimates: loggedEstimates,
    };
  }

  if (!profile) {
    return {
      dataSource: "profile" as SimulatorDataSource,
      estimates: [],
    };
  }

  return {
    dataSource: "profile" as SimulatorDataSource,
    estimates: estimateWeeklyProfileEmissions(profile).map((item) => ({
      category: item.category,
      annualKg: roundCarbon(item.weeklyKg * 52),
    })),
  };
}

function getLoggedAnnualEstimates(activities: Activity[]): AnnualCategoryEstimate[] {
  const carbon = buildCarbonEngineResult(activities);

  if (carbon.categoryBreakdown.length === 0 || !carbon.score) {
    return [];
  }

  return carbon.categoryBreakdown.map((item) => ({
    category: item.category,
    annualKg: roundCarbon(carbon.score ? carbon.score.annualizedKg * (item.percentage / 100) : 0),
  }));
}

function applyAdjustment(
  estimate: AnnualCategoryEstimate,
  adjustments: HabitAdjustments,
  profile: UserProfile | null,
): ImpactCategoryResult {
  const reductionKg = getReductionKg(estimate, adjustments, profile);
  const futureAnnualKg = roundCarbon(Math.max(0, estimate.annualKg - reductionKg));

  return {
    category: estimate.category,
    currentAnnualKg: estimate.annualKg,
    futureAnnualKg,
    annualSavingsKg: roundCarbon(estimate.annualKg - futureAnnualKg),
  };
}

function getReductionKg(
  estimate: AnnualCategoryEstimate,
  adjustments: HabitAdjustments,
  profile: UserProfile | null,
) {
  switch (estimate.category) {
    case "transport":
      return estimate.annualKg * (adjustments.transportReductionPercent / 100);
    case "home":
      return estimate.annualKg * (adjustments.electricityReductionPercent / 100);
    case "food": {
      const currentMeatMeals = profile?.food.meatMealsPerWeek ?? 0;
      const requestedReduction = adjustments.meatMealsReducedPerWeek * 6 * 52;
      const maxProfileReduction = currentMeatMeals > 0 ? currentMeatMeals * 6 * 52 : estimate.annualKg;
      return Math.min(estimate.annualKg, requestedReduction, maxProfileReduction);
    }
    case "shopping":
      return estimate.annualKg * (adjustments.shoppingReductionPercent / 100);
    case "waste":
      return estimate.annualKg * (adjustments.wasteDiversionPercent / 100);
    default:
      return 0;
  }
}
