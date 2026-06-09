import { z } from "zod";

export const coachQuestionSchema = z.object({
  question: z.string().trim().min(3, "Ask at least a few words.").max(180, "Keep the question under 180 characters."),
});

export const coachResponseCardSchema = z.object({
  analysis: z.string().min(1).max(1000),
  reasoning: z.string().min(1).max(1000),
  recommendation: z.string().min(1).max(1000),
  expectedImpact: z.string().min(1).max(1000),
});

export const coachChatMessageSchema = z.object({
  id: z.string().min(1).max(120),
  question: z.string().min(1).max(180),
  answer: z.string().min(1).max(2000),
  card: coachResponseCardSchema.optional(),
  sourceActivityIds: z.array(z.string().min(1).max(120)).max(500),
  createdAt: z.string().datetime(),
});

export type CoachQuestionInput = z.infer<typeof coachQuestionSchema>;
