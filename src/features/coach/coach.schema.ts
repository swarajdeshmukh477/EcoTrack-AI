import { z } from "zod";

export const coachQuestionSchema = z.object({
  question: z.string().trim().min(3, "Ask at least a few words.").max(180, "Keep the question under 180 characters."),
});

export const coachChatMessageSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  sourceActivityIds: z.array(z.string()),
  createdAt: z.string().datetime(),
});

export type CoachQuestionInput = z.infer<typeof coachQuestionSchema>;
