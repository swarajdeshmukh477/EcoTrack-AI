import { z } from "zod";

export const coachQuestionSchema = z.object({
  question: z.string().trim().min(3, "Ask at least a few words.").max(180, "Keep the question under 180 characters."),
});

export const coachResponseCardSchema = z.object({
  analysis: z.string().min(1),
  reasoning: z.string().min(1),
  recommendation: z.string().min(1),
  expectedImpact: z.string().min(1),
});

export const coachChatMessageSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1).max(180),
  answer: z.string().min(1).max(2000),
  card: coachResponseCardSchema.optional(),
  sourceActivityIds: z.array(z.string()),
  createdAt: z.string().datetime(),
});

export type CoachQuestionInput = z.infer<typeof coachQuestionSchema>;
