import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { buildCarbonEngineResult } from "@/features/carbon/carbon-engine";
import { estimateWeeklyProfileEmissions } from "@/features/profile/profile-emissions";
import type { UserProfile } from "@/features/profile/profile.types";
import type { CarbonTwin, CarbonTwinIdentity } from "./carbon-twin.types";

type CategorySignal = {
  category: ActivityCategory;
  co2eKg: number;
};

export function buildCarbonTwin(profile: UserProfile | null, activities: Activity[]): CarbonTwin | null {
  const signals = getSignals(profile, activities);

  if (signals.categories.length === 0) {
    return null;
  }

  const [dominant] = [...signals.categories].sort((a, b) => b.co2eKg - a.co2eKg);

  if (!dominant) {
    return null;
  }

  const identity = chooseIdentity(profile, dominant.category, signals.scoreValue);

  return {
    identity,
    profile: buildProfileSummary(identity, dominant.category, signals.dataSource),
    dataSource: signals.dataSource,
    dominantCategory: dominant.category,
    strengths: buildStrengths(profile, signals.categories),
    weaknesses: buildWeaknesses(profile, dominant),
    opportunities: buildOpportunities(profile, dominant.category),
  };
}

function getSignals(profile: UserProfile | null, activities: Activity[]) {
  const carbon = buildCarbonEngineResult(activities);

  if (carbon.categoryBreakdown.length > 0) {
    return {
      dataSource: "activity_logs" as const,
      categories: carbon.categoryBreakdown.map((item) => ({
        category: item.category,
        co2eKg: item.co2eKg,
      })),
      scoreValue: carbon.score?.value ?? null,
    };
  }

  if (!profile) {
    return {
      dataSource: "profile" as const,
      categories: [],
      scoreValue: null,
    };
  }

  return {
    dataSource: "profile" as const,
    categories: estimateWeeklyProfileEmissions(profile).map((item) => ({
      category: item.category,
      co2eKg: item.weeklyKg,
    })),
    scoreValue: null,
  };
}

function chooseIdentity(
  profile: UserProfile | null,
  dominantCategory: ActivityCategory,
  scoreValue: number | null,
): CarbonTwinIdentity {
  if (scoreValue !== null && scoreValue >= 75) {
    return "Climate Warrior";
  }

  if (dominantCategory === "transport" && profile?.transportation.primaryMode !== "bike_walk") {
    return "Urban Commuter";
  }

  if (profile?.transportation.primaryMode === "bike_walk" || profile?.transportation.primaryMode === "remote") {
    return "Green Explorer";
  }

  if (dominantCategory === "shopping" || dominantCategory === "waste") {
    return "Conscious Consumer";
  }

  return dominantCategory === "food" || dominantCategory === "home" ? "Climate Warrior" : "Conscious Consumer";
}

function buildProfileSummary(
  identity: CarbonTwinIdentity,
  dominantCategory: ActivityCategory,
  dataSource: CarbonTwin["dataSource"],
) {
  const source = dataSource === "activity_logs" ? "logged activities" : "saved profile";
  const categoryLabel = formatCategory(dominantCategory);

  return `${identity} is generated from your ${source}. Your strongest signal is ${categoryLabel}, so this twin focuses on practical changes in that area.`;
}

function buildStrengths(profile: UserProfile | null, categories: CategorySignal[]) {
  const strengths: string[] = [];
  const lowest = [...categories].sort((a, b) => a.co2eKg - b.co2eKg)[0];

  if (lowest) {
    strengths.push(`${formatCategory(lowest.category)} is currently your lowest measured source.`);
  }

  if (profile?.transportation.primaryMode === "bike_walk" || profile?.transportation.primaryMode === "remote") {
    strengths.push("Your saved travel habit already avoids many daily transport emissions.");
  }

  if (profile && profile.electricity.renewablePercent >= 50) {
    strengths.push(`Your profile lists ${profile.electricity.renewablePercent}% renewable electricity.`);
  }

  if (profile && profile.waste.recyclingKgPerWeek > profile.waste.landfillKgPerWeek) {
    strengths.push("Your recycling profile is stronger than your landfill waste profile.");
  }

  return strengths.slice(0, 3);
}

function buildWeaknesses(profile: UserProfile | null, dominant: CategorySignal) {
  const weaknesses = [`${formatCategory(dominant.category)} is your highest measured source at ${dominant.co2eKg} kg CO2e.`];

  if (dominant.category === "transport" && profile?.transportation.primaryMode === "car") {
    weaknesses.push("Your saved primary travel mode is car, which raises transport impact.");
  }

  if (dominant.category === "food" && profile && profile.food.meatMealsPerWeek > 0) {
    weaknesses.push(`Your profile lists ${profile.food.meatMealsPerWeek} meat meals per week.`);
  }

  if (dominant.category === "home" && profile && profile.electricity.renewablePercent < 50) {
    weaknesses.push("Your saved electricity mix is less than 50% renewable.");
  }

  if (dominant.category === "shopping" && profile && profile.shopping.clothingItemsPerMonth > 0) {
    weaknesses.push(`Your profile lists ${profile.shopping.clothingItemsPerMonth} clothing items per month.`);
  }

  if (dominant.category === "waste" && profile && profile.waste.landfillKgPerWeek > 0) {
    weaknesses.push(`Your profile lists ${profile.waste.landfillKgPerWeek} kg of landfill waste per week.`);
  }

  return weaknesses.slice(0, 3);
}

function buildOpportunities(profile: UserProfile | null, dominantCategory: ActivityCategory) {
  const opportunities: Record<ActivityCategory, string[]> = {
    transport: [
      "Try one public transport trip this week.",
      "Walk or bike one trip under 2 km.",
      profile?.transportation.weeklyDistanceKm ? `Reduce weekly travel by 10% from ${profile.transportation.weeklyDistanceKm} km.` : "Log travel distances to refine your twin.",
    ],
    food: [
      "Swap one high-impact meal for a lower-carbon option.",
      "Plan one leftover meal this week.",
      profile?.food.meatMealsPerWeek ? `Reduce meat meals from ${profile.food.meatMealsPerWeek} by one this week.` : "Log meals to refine your food profile.",
    ],
    home: [
      "Reduce AC or heavy appliance use by one hour.",
      "Turn off idle appliances before sleep.",
      profile?.electricity.monthlyKwh ? `Aim to reduce monthly electricity from ${profile.electricity.monthlyKwh} kWh by 5%.` : "Save electricity usage to refine your twin.",
    ],
    shopping: [
      "Delay one non-essential purchase for 48 hours.",
      "Repair or reuse one item before replacing it.",
      profile?.shopping.clothingItemsPerMonth ? `Reduce clothing purchases from ${profile.shopping.clothingItemsPerMonth} this month by one.` : "Log purchases to refine your shopping pattern.",
    ],
    waste: [
      "Sort one bag of recyclable household waste.",
      "Use a reusable bottle for one day.",
      profile?.waste.landfillKgPerWeek ? `Divert part of your ${profile.waste.landfillKgPerWeek} kg landfill waste to recycling.` : "Save waste amounts to refine your twin.",
    ],
  };

  return opportunities[dominantCategory].slice(0, 3);
}

function formatCategory(category: ActivityCategory) {
  const labels: Record<ActivityCategory, string> = {
    transport: "transportation",
    food: "food",
    home: "electricity",
    shopping: "shopping",
    waste: "waste",
  };

  return labels[category];
}
