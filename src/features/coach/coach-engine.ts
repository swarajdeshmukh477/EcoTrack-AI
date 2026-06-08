import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { carbonFactors } from "@/features/carbon/carbon-factors";
import { buildCarbonEngineResult, formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import { formatCarbon } from "@/lib/format";
import type {
  CoachAction,
  CoachConversationResponse,
  CoachRecommendation,
  StructuredCoachInsight,
} from "./coach.types";

const categoryLabels: Record<ActivityCategory, string> = {
  transport: "transportation",
  food: "food",
  home: "electricity and home energy",
  shopping: "shopping",
  waste: "waste",
};

/**
 * Builds a structured coach analysis from logged activities only.
 * No activities means no insight, recommendation, rating explanation, or plan.
 */
export function buildStructuredCoachInsight(activities: Activity[]): StructuredCoachInsight | null {
  const carbon = buildCarbonEngineResult(activities);
  const [highestSource] = [...carbon.categoryBreakdown].sort((a, b) => b.co2eKg - a.co2eKg);

  if (!highestSource) {
    return null;
  }

  const sourceActivities = getSourceActivities(activities, highestSource.category);
  const topActivity = sourceActivities[0];
  const label = categoryLabels[highestSource.category];
  const activityLabel = topActivity ? getActivityLabel(topActivity.activityType) : label;
  const scoreExplanation = carbon.score
    ? `Your score is ${carbon.score.value}/100, rated ${formatSustainabilityRating(
        carbon.score.rating,
      ).toLowerCase()}, because your logged activities annualize to ${formatCarbon(carbon.score.annualizedKg)}.`
    : "Your score will appear after you add at least one activity.";

  return {
    highestSource: {
      category: highestSource.category,
      co2eKg: highestSource.co2eKg,
      percentage: highestSource.percentage,
    },
    reason: `${capitalize(label)} is highest because it contributes ${formatCarbon(
      highestSource.co2eKg,
    )}, or ${highestSource.percentage.toFixed(1)}% of your logged footprint.${
      topActivity
        ? ` Your largest related entry is ${activityLabel} on ${topActivity.date} at ${formatCarbon(topActivity.co2eKg)}.`
        : ""
    }`,
    scoreExplanation,
    improvements: buildImprovements(highestSource.category, highestSource.co2eKg, sourceActivities),
    weeklyPlan: buildWeeklyPlan(highestSource.category, highestSource.co2eKg),
  };
}

export function buildCoachRecommendations(activities: Activity[]): CoachRecommendation[] {
  const insight = buildStructuredCoachInsight(activities);

  if (!insight) {
    return [];
  }

  return insight.improvements.map((improvement) => ({
    id: improvement.id,
    title: improvement.title,
    reason: improvement.detail,
    category: insight.highestSource.category,
    estimatedImpactKg: improvement.estimatedImpactKg,
    sourceActivityIds: improvement.sourceActivityIds,
  }));
}

export function answerCoachQuestion(activities: Activity[], question: string): CoachConversationResponse | null {
  const activityStatementResponse = answerActivityStatement(question);

  if (activityStatementResponse) {
    return activityStatementResponse;
  }

  const insight = buildStructuredCoachInsight(activities);

  if (!insight) {
    return null;
  }

  const normalized = question.toLowerCase();
  const sourceIds = uniqueIds(insight.improvements.flatMap((item) => item.sourceActivityIds));

  if (containsAny(normalized, ["why", "high", "footprint"])) {
    return {
      answer: insight.reason,
      sourceActivityIds: sourceIds,
    };
  }

  if (containsAny(normalized, ["improve", "first", "priority", "focus"])) {
    const firstAction = insight.improvements[0];
    return {
      answer: firstAction
        ? `Start with ${firstAction.title.toLowerCase()}. ${firstAction.detail} Estimated impact: ${formatCarbon(
            firstAction.estimatedImpactKg,
          )}.`
        : insight.reason,
      sourceActivityIds: firstAction ? uniqueIds(firstAction.sourceActivityIds) : sourceIds,
    };
  }

  if (containsAny(normalized, ["score", "rating", "simple", "explain"])) {
    return {
      answer: insight.scoreExplanation,
      sourceActivityIds: sourceIds,
    };
  }

  if (containsAny(normalized, ["plan", "week", "weekly"])) {
    return {
      answer: insight.weeklyPlan.map((item) => `${item.day}: ${item.task} ${item.reason}`).join("\n"),
      sourceActivityIds: sourceIds,
    };
  }

  return {
    answer: `${insight.reason}\n\nBest first action: ${insight.improvements[0]?.title ?? "Add more activity data"}.`,
    sourceActivityIds: sourceIds,
  };
}

function answerActivityStatement(question: string): CoachConversationResponse | null {
  const normalized = question.toLowerCase();
  const distanceMatch = normalized.match(/(?:less than|under|below)?\s*(\d+(?:\.\d+)?)\s*(?:km|kilometer|kilometers)/);
  const isCarTravel = containsAny(normalized, ["drove", "drive", "driven", "car"]);

  if (!distanceMatch || !isCarTravel) {
    return null;
  }

  const distanceKm = Number(distanceMatch[1]);
  const isUpperBound = containsAny(normalized, ["less than", "under", "below"]);
  const carFactor = carbonFactors.find((factor) => factor.id === "car_km");

  if (!carFactor || Number.isNaN(distanceKm)) {
    return null;
  }

  const estimatedKg = roundCarbon(distanceKm * carFactor.kgCo2ePerUnit);
  const qualifier = isUpperBound ? "at most " : "";

  return {
    answer: `That sounds like a car travel activity. If you log it as ${qualifier}${distanceKm} km of car travel, it would add about ${formatCarbon(
      estimatedKg,
    )} or less to your footprint. I have not counted it in your charts yet because chat messages do not create activity logs; add it in the activity form to include it in your history and score.`,
    sourceActivityIds: [],
  };
}

function buildImprovements(
  category: ActivityCategory,
  categoryKg: number,
  sourceActivities: Activity[],
): CoachAction[] {
  const sourceActivityIds = sourceActivities.map((activity) => activity.id);
  const primaryImpact = roundCarbon(categoryKg * 0.15);
  const secondaryImpact = roundCarbon(categoryKg * 0.08);

  const actions: Record<ActivityCategory, Array<Omit<CoachAction, "estimatedImpactKg" | "sourceActivityIds">>> = {
    transport: [
      {
        id: "transport-replace-trip",
        title: "Replace the highest-emission trip",
        detail: `Your transport logs are the largest source, so reducing one similar trip targets the biggest part of your current data.`,
      },
      {
        id: "transport-batch-trips",
        title: "Batch short trips",
        detail: `Combining errands can reduce repeated travel emissions in the same category that is driving your footprint.`,
      },
    ],
    food: [
      {
        id: "food-swap-meal",
        title: "Swap the highest-impact meal",
        detail: `Your food entries lead your footprint, so replacing a similar high-emission meal directly targets the largest source.`,
      },
      {
        id: "food-plan-low-carbon",
        title: "Plan lower-carbon meals first",
        detail: `Pre-planning meals helps reduce repeats of the food entries currently contributing most of your logged emissions.`,
      },
    ],
    home: [
      {
        id: "home-reduce-peak-use",
        title: "Reduce the largest electricity entry",
        detail: `Home energy is highest in your logs, so lowering the next similar kWh entry should move your score fastest.`,
      },
      {
        id: "home-check-standby",
        title: "Cut avoidable standby use",
        detail: `Small reductions help because this category already takes the largest share of your logged footprint.`,
      },
    ],
    shopping: [
      {
        id: "shopping-delay-purchase",
        title: "Delay one similar purchase",
        detail: `Shopping is your highest source, so avoiding or delaying a repeat purchase addresses the biggest logged category.`,
      },
      {
        id: "shopping-buy-durable",
        title: "Choose longer-lasting items",
        detail: `Durable choices reduce how often this high-impact category appears in future logs.`,
      },
    ],
    waste: [
      {
        id: "waste-divert-landfill",
        title: "Divert the largest waste entry",
        detail: `Waste leads your footprint, so shifting similar landfill weight toward recycling targets your largest source.`,
      },
      {
        id: "waste-plan-sorting",
        title: "Sort waste before disposal",
        detail: `Sorting helps reduce repeated waste entries in the category currently driving your footprint.`,
      },
    ],
  };

  return actions[category].map((action, index) => ({
    ...action,
    estimatedImpactKg: index === 0 ? primaryImpact : secondaryImpact,
    sourceActivityIds,
  }));
}

function buildWeeklyPlan(category: ActivityCategory, categoryKg: number) {
  const label = categoryLabels[category];
  const dailyTarget = formatCarbon(roundCarbon(categoryKg * 0.03));

  return [
    {
      day: "Monday",
      task: `Review your ${label} logs.`,
      reason: `They are currently your highest source at ${formatCarbon(categoryKg)}.`,
    },
    {
      day: "Tuesday",
      task: `Pick one repeat ${label} activity to reduce.`,
      reason: `A small target of about ${dailyTarget} keeps the plan realistic.`,
    },
    {
      day: "Wednesday",
      task: `Choose the lower-emission option before logging a similar activity.`,
      reason: `This directly changes the category that is driving your footprint.`,
    },
    {
      day: "Thursday",
      task: `Avoid or reduce one similar ${label} entry if possible.`,
      reason: `The coach is using your highest category, not a generic goal.`,
    },
    {
      day: "Friday",
      task: `Compare the new log with your earlier ${label} entries.`,
      reason: `Progress is measured from your own activity history.`,
    },
    {
      day: "Saturday",
      task: `Plan next week's largest ${label} decision in advance.`,
      reason: `Planning helps prevent repeat high-emission choices.`,
    },
    {
      day: "Sunday",
      task: "Check your score and category breakdown.",
      reason: "Use the updated logged data to decide the next priority.",
    },
  ];
}

function getSourceActivities(activities: Activity[], category: ActivityCategory) {
  return activities
    .filter((activity) => activity.category === category)
    .sort((a, b) => b.co2eKg - a.co2eKg);
}

function getActivityLabel(activityType: string) {
  return carbonFactors.find((factor) => factor.id === activityType)?.label ?? activityType;
}

function containsAny(value: string, words: string[]) {
  return words.some((word) => value.includes(word));
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
