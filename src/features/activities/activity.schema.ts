import { z } from "zod";
import { activityCategories, activityUnits } from "./activity.types";

export const activityInputSchema = z.object({
  category: z.enum(activityCategories),
  activityType: z.string().min(1, "Choose an activity type."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  unit: z.enum(activityUnits),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date."),
  note: z.string().max(140, "Notes must be 140 characters or fewer.").optional(),
});

export const activitySchema = activityInputSchema.extend({
  id: z.string().min(1),
  co2eKg: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});

export const activitiesSchema = z.array(activitySchema);
