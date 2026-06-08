import { z } from "zod";

const percentSchema = z.coerce.number().min(0, "Use zero or a positive number.").max(100, "Percent cannot exceed 100.");

export const habitAdjustmentsSchema = z.object({
  transportReductionPercent: percentSchema,
  electricityReductionPercent: percentSchema,
  meatMealsReducedPerWeek: z.coerce.number().min(0, "Use zero or a positive number.").max(21, "Use a realistic weekly meal count."),
  shoppingReductionPercent: percentSchema,
  wasteDiversionPercent: percentSchema,
});

export const defaultHabitAdjustments = {
  transportReductionPercent: 10,
  electricityReductionPercent: 10,
  meatMealsReducedPerWeek: 1,
  shoppingReductionPercent: 10,
  wasteDiversionPercent: 10,
} satisfies z.infer<typeof habitAdjustmentsSchema>;

export type HabitAdjustmentValues = z.infer<typeof habitAdjustmentsSchema>;
