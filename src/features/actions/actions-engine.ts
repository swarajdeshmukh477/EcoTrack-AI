import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { buildCarbonEngineResult } from "@/features/carbon/carbon-engine";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import { estimateWeeklyProfileEmissions } from "@/features/profile/profile-emissions";
import type { UserProfile } from "@/features/profile/profile.types";
import type { SimpleAction, SimpleActionsResult, SimpleActionSource } from "./actions.types";

type CategoryEstimate = {
  category: ActivityCategory;
  co2eKg: number;
  source: SimpleActionSource;
};

/**
 * Creates small, practical actions from the user's own logs/profile.
 * Empty users receive no actions so the app never shows generic tips as fake personalization.
 */
export function buildSimpleActions(profile: UserProfile | null, activities: Activity[]): SimpleActionsResult {
  const highestSource = getHighestSource(profile, activities);

  if (!highestSource || highestSource.co2eKg <= 0) {
    return {
      highestSource: null,
      actions: [],
    };
  }

  return {
    highestSource,
    actions: createActionsForCategory(highestSource, profile).slice(0, 5),
  };
}

function getHighestSource(profile: UserProfile | null, activities: Activity[]): CategoryEstimate | null {
  const carbon = buildCarbonEngineResult(activities);
  const [highestLoggedCategory] = [...carbon.categoryBreakdown].sort((a, b) => b.co2eKg - a.co2eKg);

  if (highestLoggedCategory) {
    return {
      category: highestLoggedCategory.category,
      co2eKg: highestLoggedCategory.co2eKg,
      source: "activity_logs",
    };
  }

  if (!profile) {
    return null;
  }

  const [highestProfileCategory] = estimateProfileEmissions(profile).sort((a, b) => b.co2eKg - a.co2eKg);
  return highestProfileCategory?.co2eKg ? highestProfileCategory : null;
}

function estimateProfileEmissions(profile: UserProfile): CategoryEstimate[] {
  return estimateWeeklyProfileEmissions(profile).map((item) => ({
    category: item.category,
    co2eKg: item.weeklyKg,
    source: "profile",
  }));
}

function createActionsForCategory(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const builders: Record<ActivityCategory, () => SimpleAction[]> = {
    transport: () => transportActions(source, profile),
    home: () => electricityActions(source, profile),
    food: () => foodActions(source, profile),
    shopping: () => shoppingActions(source, profile),
    waste: () => wasteActions(source, profile),
  };

  return builders[source.category]().filter((action) => action.estimatedImpactKg > 0);
}

function transportActions(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const weeklyDistance = profile?.transportation.weeklyDistanceKm ?? 0;
  const mode = profile?.transportation.primaryMode;
  const baseReason = sourceReason(source);

  return [
    createAction({
      id: "transport-public-once",
      title: "Use public transport once this week",
      description: mode === "car" ? "Replace one car trip with bus or rail." : "Use your lower-emission travel mode for one trip.",
      category: "transport",
      reason: `${baseReason}${weeklyDistance > 0 ? ` Your profile lists ${weeklyDistance} km of weekly travel.` : ""}`,
      estimatedImpactKg: source.co2eKg * 0.15,
      source: source.source,
    }),
    createAction({
      id: "transport-walk-short",
      title: "Walk for trips under 2 km",
      description: "Choose walking for one nearby trip instead of motor travel.",
      category: "transport",
      reason: `${baseReason} This targets short trips inside your highest source.`,
      estimatedImpactKg: Math.min(source.co2eKg * 0.1, 0.384),
      source: source.source,
    }),
    createAction({
      id: "transport-combine-errands",
      title: "Combine two errands into one trip",
      description: "Reduce repeated travel by planning nearby errands together.",
      category: "transport",
      reason: `${baseReason} Combining trips lowers future transport entries without changing your whole routine.`,
      estimatedImpactKg: source.co2eKg * 0.08,
      source: source.source,
    }),
  ];
}

function electricityActions(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const monthlyKwh = profile?.electricity.monthlyKwh ?? 0;
  const baseReason = sourceReason(source);

  return [
    createAction({
      id: "electricity-ac-one-hour",
      title: "Reduce AC usage by 1 hour",
      description: "Pick one day this week to reduce AC or heavy appliance use by one hour.",
      category: "home",
      reason: `${baseReason}${monthlyKwh > 0 ? ` Your profile lists ${monthlyKwh} kWh per month.` : ""}`,
      estimatedImpactKg: Math.max(0.385, source.co2eKg * 0.08),
      source: source.source,
    }),
    createAction({
      id: "electricity-idle-off",
      title: "Turn off idle appliances",
      description: "Switch off unused chargers, lights, or standby devices before sleep.",
      category: "home",
      reason: `${baseReason} This is a daily action that reduces the same home energy source.`,
      estimatedImpactKg: source.co2eKg * 0.06,
      source: source.source,
    }),
    createAction({
      id: "electricity-daylight",
      title: "Use daylight for one routine",
      description: "Move one task to daylight hours and avoid extra lighting.",
      category: "home",
      reason: `${baseReason} It is practical because it changes one routine, not the whole household.`,
      estimatedImpactKg: source.co2eKg * 0.04,
      source: source.source,
    }),
  ];
}

function foodActions(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const meatMeals = profile?.food.meatMealsPerWeek ?? 0;
  const baseReason = sourceReason(source);

  return [
    createAction({
      id: "food-swap-one-meal",
      title: "Swap one high-impact meal",
      description: "Choose one vegetarian or plant-based meal this week.",
      category: "food",
      reason: `${baseReason}${meatMeals > 0 ? ` Your profile lists ${meatMeals} meat meals per week.` : ""}`,
      estimatedImpactKg: Math.max(1.2, source.co2eKg * 0.12),
      source: source.source,
    }),
    createAction({
      id: "food-plan-leftovers",
      title: "Plan one leftover meal",
      description: "Use leftovers for one meal instead of buying or cooking a new high-impact option.",
      category: "food",
      reason: `${baseReason} This reduces repeat food emissions using a small planning step.`,
      estimatedImpactKg: source.co2eKg * 0.06,
      source: source.source,
    }),
    createAction({
      id: "food-lower-carbon-shopping",
      title: "Choose a lower-carbon protein once",
      description: "Pick beans, lentils, eggs, tofu, or another lower-impact option for one meal.",
      category: "food",
      reason: `${baseReason} It targets your highest category without requiring a full diet change.`,
      estimatedImpactKg: source.co2eKg * 0.1,
      source: source.source,
    }),
  ];
}

function shoppingActions(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const clothingItems = profile?.shopping.clothingItemsPerMonth ?? 0;
  const baseReason = sourceReason(source);

  return [
    createAction({
      id: "shopping-delay-one-item",
      title: "Delay one non-essential purchase",
      description: "Wait 48 hours before buying one item this week.",
      category: "shopping",
      reason: `${baseReason}${clothingItems > 0 ? ` Your profile lists ${clothingItems} clothing items per month.` : ""}`,
      estimatedImpactKg: Math.max(2, source.co2eKg * 0.12),
      source: source.source,
    }),
    createAction({
      id: "shopping-repair-first",
      title: "Repair or reuse one item",
      description: "Before replacing something, repair, borrow, or reuse one item.",
      category: "shopping",
      reason: `${baseReason} This avoids adding another shopping entry in your highest source.`,
      estimatedImpactKg: source.co2eKg * 0.08,
      source: source.source,
    }),
    createAction({
      id: "shopping-combine-order",
      title: "Combine purchases into one order",
      description: "Group planned purchases together instead of making separate orders.",
      category: "shopping",
      reason: `${baseReason} Fewer purchases make the action easier to complete and track.`,
      estimatedImpactKg: source.co2eKg * 0.05,
      source: source.source,
    }),
  ];
}

function wasteActions(source: CategoryEstimate, profile: UserProfile | null): SimpleAction[] {
  const landfillKg = profile?.waste.landfillKgPerWeek ?? 0;
  const baseReason = sourceReason(source);

  return [
    createAction({
      id: "waste-recycle-household",
      title: "Recycle household waste",
      description: "Sort one bag of recyclable waste before disposal.",
      category: "waste",
      reason: `${baseReason}${landfillKg > 0 ? ` Your profile lists ${landfillKg} kg of landfill waste per week.` : ""}`,
      estimatedImpactKg: source.co2eKg * 0.12,
      source: source.source,
    }),
    createAction({
      id: "waste-reusable-bottle",
      title: "Use a reusable bottle",
      description: "Carry a reusable bottle for one full day.",
      category: "waste",
      reason: `${baseReason} It is a small daily action that can reduce repeat waste entries.`,
      estimatedImpactKg: source.co2eKg * 0.05,
      source: source.source,
    }),
    createAction({
      id: "waste-separate-organics",
      title: "Separate food scraps once",
      description: "Keep one meal's food scraps out of general landfill waste.",
      category: "waste",
      reason: `${baseReason} It directly targets the waste source that is currently highest.`,
      estimatedImpactKg: source.co2eKg * 0.08,
      source: source.source,
    }),
  ];
}

function createAction(action: SimpleAction) {
  return {
    ...action,
    estimatedImpactKg: roundCarbon(action.estimatedImpactKg),
  };
}

function sourceReason(source: CategoryEstimate) {
  const dataSource = source.source === "activity_logs" ? "logged activities" : "saved profile";
  return `${capitalize(source.category)} is currently your highest source from ${dataSource} at about ${source.co2eKg} kg CO2e.`;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
