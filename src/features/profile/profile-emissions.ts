import type { ActivityCategory } from "@/features/activities/activity.types";
import { roundCarbon } from "@/features/carbon/carbon-calculator";
import type { UserProfile } from "./profile.types";

export type ProfileEmissionEstimate = {
  category: ActivityCategory;
  weeklyKg: number;
};

const transportFactors = {
  car: 0.192,
  bus: 0.089,
  rail: 0.041,
  bike_walk: 0,
  remote: 0,
} as const;

export function estimateWeeklyProfileEmissions(profile: UserProfile): ProfileEmissionEstimate[] {
  const estimates: ProfileEmissionEstimate[] = [
    {
      category: "transport",
      weeklyKg: roundCarbon(profile.transportation.weeklyDistanceKm * transportFactors[profile.transportation.primaryMode]),
    },
    {
      category: "home",
      weeklyKg: roundCarbon((profile.electricity.monthlyKwh * 0.385 * (1 - profile.electricity.renewablePercent / 100)) / 4.345),
    },
    {
      category: "food",
      weeklyKg: roundCarbon(profile.food.meatMealsPerWeek * 6),
    },
    {
      category: "shopping",
      weeklyKg: roundCarbon(profile.shopping.clothingItemsPerMonth * 8 / 4.345 + profile.shopping.electronicsItemsPerYear * 50 / 52),
    },
    {
      category: "waste",
      weeklyKg: roundCarbon(profile.waste.landfillKgPerWeek * 0.45 + profile.waste.recyclingKgPerWeek * 0.02),
    },
  ];

  return estimates.filter((item) => item.weeklyKg > 0);
}
