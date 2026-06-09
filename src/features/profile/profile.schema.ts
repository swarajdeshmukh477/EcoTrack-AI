import { z } from "zod";
import { dietTypes, transportModes } from "./profile.types";

const countSchema = z.number().finite("Use a valid number.").min(0, "Enter zero or a positive number.");

export const profileSchema = z.object({
  transportation: z.object({
    primaryMode: z.enum(transportModes),
    weeklyDistanceKm: countSchema.max(10000, "Enter a realistic weekly distance."),
    sharedTripsPerWeek: countSchema.max(100, "Enter a realistic weekly trip count."),
  }),
  electricity: z.object({
    monthlyKwh: countSchema.max(100000, "Enter a realistic monthly electricity amount."),
    renewablePercent: countSchema.max(100, "Renewable electricity cannot exceed 100%."),
  }),
  food: z.object({
    dietType: z.enum(dietTypes),
    meatMealsPerWeek: countSchema.max(100, "Enter a realistic weekly meal count."),
  }),
  shopping: z.object({
    clothingItemsPerMonth: countSchema.max(1000, "Enter a realistic monthly item count."),
    electronicsItemsPerYear: countSchema.max(1000, "Enter a realistic yearly item count."),
  }),
  waste: z.object({
    landfillKgPerWeek: countSchema.max(10000, "Enter a realistic weekly waste amount."),
    recyclingKgPerWeek: countSchema.max(10000, "Enter a realistic weekly recycling amount."),
  }),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const emptyProfileFormValues: ProfileFormValues = {
  transportation: {
    primaryMode: "car",
    weeklyDistanceKm: 0,
    sharedTripsPerWeek: 0,
  },
  electricity: {
    monthlyKwh: 0,
    renewablePercent: 0,
  },
  food: {
    dietType: "omnivore",
    meatMealsPerWeek: 0,
  },
  shopping: {
    clothingItemsPerMonth: 0,
    electronicsItemsPerYear: 0,
  },
  waste: {
    landfillKgPerWeek: 0,
    recyclingKgPerWeek: 0,
  },
};
