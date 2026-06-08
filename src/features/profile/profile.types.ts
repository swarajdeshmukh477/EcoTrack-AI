export const transportModes = ["car", "bus", "rail", "bike_walk", "remote"] as const;
export const dietTypes = ["omnivore", "pescatarian", "vegetarian", "vegan"] as const;

export type TransportMode = (typeof transportModes)[number];
export type DietType = (typeof dietTypes)[number];

export type UserProfile = {
  transportation: {
    primaryMode: TransportMode;
    weeklyDistanceKm: number;
    sharedTripsPerWeek: number;
  };
  electricity: {
    monthlyKwh: number;
    renewablePercent: number;
  };
  food: {
    dietType: DietType;
    meatMealsPerWeek: number;
  };
  shopping: {
    clothingItemsPerMonth: number;
    electronicsItemsPerYear: number;
  };
  waste: {
    landfillKgPerWeek: number;
    recyclingKgPerWeek: number;
  };
};
