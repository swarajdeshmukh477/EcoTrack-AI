import type { ActivityCategory } from "@/features/activities/activity.types";
import type { CarbonFactor } from "./carbon.types";

export const carbonFactors: CarbonFactor[] = [
  {
    id: "car_km",
    label: "Car travel",
    category: "transport",
    unit: "km",
    kgCo2ePerUnit: 0.192,
  },
  {
    id: "bus_km",
    label: "Bus travel",
    category: "transport",
    unit: "km",
    kgCo2ePerUnit: 0.089,
  },
  {
    id: "rail_km",
    label: "Rail travel",
    category: "transport",
    unit: "km",
    kgCo2ePerUnit: 0.041,
  },
  {
    id: "beef_meal",
    label: "Beef meal",
    category: "food",
    unit: "meal",
    kgCo2ePerUnit: 6,
  },
  {
    id: "vegetarian_meal",
    label: "Vegetarian meal",
    category: "food",
    unit: "meal",
    kgCo2ePerUnit: 1.2,
  },
  {
    id: "plant_based_meal",
    label: "Plant-based meal",
    category: "food",
    unit: "meal",
    kgCo2ePerUnit: 0.7,
  },
  {
    id: "electricity_kwh",
    label: "Electricity use",
    category: "home",
    unit: "kwh",
    kgCo2ePerUnit: 0.385,
  },
  {
    id: "clothing_item",
    label: "Clothing purchase",
    category: "shopping",
    unit: "item",
    kgCo2ePerUnit: 8,
  },
  {
    id: "electronics_item",
    label: "Electronics purchase",
    category: "shopping",
    unit: "item",
    kgCo2ePerUnit: 50,
  },
  {
    id: "landfill_kg",
    label: "Landfill waste",
    category: "waste",
    unit: "kg",
    kgCo2ePerUnit: 0.45,
  },
  {
    id: "recycled_kg",
    label: "Recycled waste",
    category: "waste",
    unit: "kg",
    kgCo2ePerUnit: 0.02,
  },
];

export function getFactorsByCategory(category: ActivityCategory) {
  return carbonFactors.filter((factor) => factor.category === category);
}

export function getCarbonFactor(activityType: string) {
  return carbonFactors.find((factor) => factor.id === activityType);
}
