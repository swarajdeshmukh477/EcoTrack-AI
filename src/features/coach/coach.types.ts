import type { ActivityCategory } from "@/features/activities/activity.types";

export type CoachRecommendation = {
  id: string;
  title: string;
  reason: string;
  category: ActivityCategory;
  estimatedImpactKg?: number;
  sourceActivityIds: string[];
};

export type CoachAction = {
  id: string;
  title: string;
  detail: string;
  estimatedImpactKg: number;
  sourceActivityIds: string[];
};

export type CoachActionPlanItem = {
  day: string;
  task: string;
  reason: string;
};

export type StructuredCoachInsight = {
  highestSource: {
    category: ActivityCategory;
    co2eKg: number;
    percentage: number;
  };
  reason: string;
  scoreExplanation: string;
  improvements: CoachAction[];
  weeklyPlan: CoachActionPlanItem[];
};

export type CoachConversationResponse = {
  answer: string;
  card: CoachResponseCard;
  sourceActivityIds: string[];
};

export type CoachChatMessage = {
  id: string;
  question: string;
  answer: string;
  card?: CoachResponseCard;
  sourceActivityIds: string[];
  createdAt: string;
};

export type CoachResponseCard = {
  analysis: string;
  reasoning: string;
  recommendation: string;
  expectedImpact: string;
};
