import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { buildSimpleActions } from "@/features/actions/actions-engine";
import { carbonFactors } from "@/features/carbon/carbon-factors";
import { buildCarbonEngineResult, formatSustainabilityRating } from "@/features/carbon/carbon-engine";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import { defaultHabitAdjustments } from "@/features/simulator/simulator.schema";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import type { UserProfile } from "@/features/profile/profile.types";
import { formatCarbon } from "@/lib/format";
import type {
  CoachAction,
  CoachConversationResponse,
  CoachRecommendation,
  CoachResponseCard,
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
    : "Your score is not calculated yet because no activity emissions have been logged.";

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

export function answerCoachQuestion(
  activities: Activity[],
  question: string,
  profile: UserProfile | null = null,
): CoachConversationResponse | null {
  const activityStatementResponse = answerActivityStatement(question);

  if (activityStatementResponse) {
    return activityStatementResponse;
  }

  const insight = buildStructuredCoachInsight(activities);
  const fallback = buildFallbackContext(profile, activities);

  if (!insight && !fallback) {
    return null;
  }

  const normalized = question.toLowerCase();
  const sourceIds = insight ? uniqueIds(insight.improvements.flatMap((item) => item.sourceActivityIds)) : [];

  if (containsAny(normalized, ["why", "high", "footprint"])) {
    const card = insight
      ? makeCard({
          analysis: insight.reason,
          reasoning: "The coach compares your category breakdown and finds the largest measured source.",
          recommendation: insight.improvements[0]?.title ?? "Add more activity data.",
          expectedImpact: insight.improvements[0] ? formatCarbon(insight.improvements[0].estimatedImpactKg) : "Needs more data.",
        })
      : fallback!.card;
    return responseFromCard(card, sourceIds);
  }

  if (containsAny(normalized, ["improve", "first", "priority", "focus"])) {
    const firstAction = insight?.improvements[0] ?? fallback?.firstAction;
    const card = makeCard({
      analysis: insight?.reason ?? fallback?.analysis ?? "Your saved data points to a first priority.",
      reasoning: getActionReason(firstAction) ?? fallback?.reasoning ?? "The action is selected from your highest source.",
      recommendation: firstAction?.title ?? "Add more activity data.",
      expectedImpact: firstAction ? formatCarbon(firstAction.estimatedImpactKg) : fallback?.impact ?? "Needs more data.",
    });
    return responseFromCard(card, firstAction ? uniqueIds(getActionSourceIds(firstAction)) : sourceIds);
  }

  if (containsAny(normalized, ["score", "rating", "simple", "explain"])) {
    const card = makeCard({
      analysis: insight?.scoreExplanation ?? "Your carbon score needs activity logs to be calculated.",
      reasoning: "EcoTrack scores are based on measured activity emissions, not profile guesses.",
      recommendation: insight ? "Use your highest-source recommendation first." : "Add one dated activity log to unlock your score.",
      expectedImpact: insight?.improvements[0] ? formatCarbon(insight.improvements[0].estimatedImpactKg) : "Score unlocks after logs.",
    });
    return responseFromCard(card, sourceIds);
  }

  if (containsAny(normalized, ["plan", "week", "weekly"])) {
    const plan = insight?.weeklyPlan ?? fallback?.weeklyPlan ?? [];
    const card = makeCard({
      analysis: plan.length ? "Your weekly plan targets your highest source." : "A plan needs profile or activity data.",
      reasoning: "Each day focuses on one small action so the plan stays practical.",
      recommendation: plan.map((item) => `${item.day}: ${item.task}`).join(" "),
      expectedImpact: fallback?.impact ?? (insight?.improvements[0] ? formatCarbon(insight.improvements[0].estimatedImpactKg) : "Needs more data."),
    });
    return responseFromCard(card, sourceIds);
  }

  if (containsAny(normalized, ["ac", "electricity", "appliance", "energy"])) {
    const impact = fallback?.impactResult?.categories.find((item) => item.category === "home");
    const card = makeCard({
      analysis: impact ? `Home energy is currently ${formatCarbon(impact.currentAnnualKg)} annually.` : "Home energy impact needs electricity data.",
      reasoning: "Reducing AC or idle appliance use lowers the home-energy part of your footprint.",
      recommendation: "Reduce AC or heavy appliance usage by 1 hour daily.",
      expectedImpact: impact ? `${formatCarbon(impact.annualSavingsKg)} annual savings in the simulator.` : "Save electricity data to estimate impact.",
    });
    return responseFromCard(card, sourceIds);
  }

  if (containsAny(normalized, ["earth guardian", "guardian", "warrior", "climate"])) {
    const twin = fallback?.twin;
    const card = makeCard({
      analysis: twin ? `Your current carbon twin is ${twin.identity}.` : "Your carbon twin needs profile or activity data.",
      reasoning: twin ? twin.weaknesses[0] ?? twin.profile : "EcoTrack needs your pattern before setting an identity path.",
      recommendation: twin?.opportunities[0] ?? "Save profile data and log one activity.",
      expectedImpact: fallback?.impact ?? "Impact appears after enough data is available.",
    });
    return responseFromCard(card, sourceIds);
  }

  const card = insight
    ? makeCard({
        analysis: insight.reason,
        reasoning: insight.scoreExplanation,
        recommendation: insight.improvements[0]?.title ?? "Add more activity data.",
        expectedImpact: insight.improvements[0] ? formatCarbon(insight.improvements[0].estimatedImpactKg) : "Needs more data.",
      })
    : fallback!.card;
  return responseFromCard(card, sourceIds);
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
    answer: `Analysis: car travel statement. Reasoning: ${qualifier}${distanceKm} km uses the car travel factor. Recommendation: I have not counted it automatically; log it in the activity form if you want it counted. Expected Impact: about ${formatCarbon(estimatedKg)} or less.`,
    card: makeCard({
      analysis: "That sounds like a car travel activity.",
      reasoning: `${qualifier}${distanceKm} km uses the car travel emissions factor.`,
      recommendation: "I have not counted it automatically; log it in the activity form if you want it counted in charts and score.",
      expectedImpact: `About ${formatCarbon(estimatedKg)} or less.`,
    }),
    sourceActivityIds: [],
  };
}

function buildFallbackContext(profile: UserProfile | null, activities: Activity[]) {
  const actions = buildSimpleActions(profile, activities);
  const firstAction = actions.actions[0];
  const twin = buildCarbonTwin(profile, activities);
  const impactResult = simulateFutureImpact(profile, activities, defaultHabitAdjustments);

  if (!actions.highestSource && !twin && !impactResult) {
    return null;
  }

  const category = actions.highestSource?.category ?? twin?.dominantCategory ?? "transport";
  const analysis = actions.highestSource
    ? `${capitalize(categoryLabels[category])} is currently the strongest signal from your ${actions.highestSource.source === "profile" ? "profile" : "logs"}.`
    : twin?.profile ?? "Your profile has enough data for coaching.";
  const reasoning = firstAction?.reason ?? twin?.weaknesses[0] ?? "The recommendation is based on your strongest available source.";
  const impact = impactResult ? `${impactResult.reductionPercent.toFixed(1)}% potential annual reduction` : "Save more data to estimate impact.";
  const card = makeCard({
    analysis,
    reasoning,
    recommendation: firstAction?.title ?? twin?.opportunities[0] ?? "Add one activity log.",
    expectedImpact: firstAction ? formatCarbon(firstAction.estimatedImpactKg) : impact,
  });

  return {
    analysis,
    reasoning,
    impact,
    card,
    firstAction,
    weeklyPlan: buildWeeklyPlan(category, actions.highestSource?.co2eKg ?? 0),
    impactResult,
    twin,
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

function makeCard(card: CoachResponseCard) {
  return card;
}

function responseFromCard(card: CoachResponseCard, sourceActivityIds: string[]): CoachConversationResponse {
  return {
    answer: `Analysis: ${card.analysis}\nReasoning: ${card.reasoning}\nRecommendation: ${card.recommendation}\nExpected Impact: ${card.expectedImpact}`,
    card,
    sourceActivityIds,
  };
}

function getActionReason(action: CoachAction | ReturnType<typeof buildSimpleActions>["actions"][number] | undefined) {
  if (!action) {
    return null;
  }

  return "detail" in action ? action.detail : action.reason;
}

function getActionSourceIds(action: CoachAction | ReturnType<typeof buildSimpleActions>["actions"][number]) {
  return "sourceActivityIds" in action ? action.sourceActivityIds : [];
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
