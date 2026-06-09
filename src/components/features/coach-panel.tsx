"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  History,
  Leaf,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  Trash2,
  Trees,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Activity, ActivityCategory } from "@/features/activities/activity.types";
import { buildSimpleActions } from "@/features/actions/actions-engine";
import type { SimpleAction } from "@/features/actions/actions.types";
import { buildCarbonEngineResult } from "@/features/carbon/carbon-engine";
import { answerCoachQuestion, buildStructuredCoachInsight } from "@/features/coach/coach-engine";
import { coachQuestionSchema } from "@/features/coach/coach.schema";
import type { CoachActionPlanItem, CoachChatMessage, CoachResponseCard } from "@/features/coach/coach.types";
import type { UserProfile } from "@/features/profile/profile.types";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import { defaultHabitAdjustments } from "@/features/simulator/simulator.schema";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import { formatCarbon } from "@/lib/format";
import { useEcoTrack } from "@/state/ecotrack-state";

const suggestedPrompts = [
  "Why is my footprint high?",
  "What should I improve first?",
  "Create a weekly sustainability plan.",
  "Explain my score simply.",
  "What happens if I reduce AC usage?",
  "How can I become an Earth Guardian?",
];

const categoryLabels: Record<ActivityCategory, string> = {
  transport: "Transportation",
  home: "Electricity",
  food: "Food",
  shopping: "Shopping",
  waste: "Waste",
};

export function CoachPanel() {
  const { activities, addCoachMessage, clearCoachHistory, coachHistory, deleteCoachMessage, profile } = useEcoTrack();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  const carbon = useMemo(() => buildCarbonEngineResult(activities), [activities]);
  const insight = useMemo(() => buildStructuredCoachInsight(activities), [activities]);
  const simpleActions = useMemo(() => buildSimpleActions(profile, activities), [profile, activities]);
  const carbonTwin = useMemo(() => buildCarbonTwin(profile, activities), [profile, activities]);
  const impact = useMemo(
    () => simulateFutureImpact(profile, activities, defaultHabitAdjustments),
    [profile, activities],
  );
  const quickInsight = useMemo(
    () => buildQuickInsight(activities, profile, simpleActions.highestSource?.category ?? null, impact),
    [activities, profile, simpleActions.highestSource?.category, impact],
  );
  const weeklyPlan = useMemo(
    () => insight?.weeklyPlan ?? buildPlanFromActions(simpleActions.actions, profile),
    [insight?.weeklyPlan, simpleActions.actions, profile],
  );

  function askCoach(value: string) {
    const parsed = coachQuestionSchema.safeParse({ question: value });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a question.");
      return;
    }

    const response = answerCoachQuestion(activities, parsed.data.question, profile);

    if (!response) {
      setError("Add a profile or activity log before asking for personalized coaching.");
      return;
    }

    addCoachMessage({
      question: parsed.data.question,
      answer: response.answer,
      card: response.card,
      sourceActivityIds: response.sourceActivityIds,
    });
    setQuestion("");
    setShowHistory(true);
    setError(null);
  }

  const visibleMessages = showHistory ? coachHistory : coachHistory.slice(-1);

  return (
    <div className="space-y-5">
      <CoachHero score={carbon.score?.value ?? null} twinIdentity={carbonTwin?.identity ?? null} />
      <HowCoachWorksCard />

      <section aria-labelledby="coach-insights-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="coach-insights-heading" className="text-lg font-semibold">
              Quick insights
            </h2>
            <p className="text-sm text-muted-foreground">Built from your saved profile and activity logs.</p>
          </div>
          <Badge>{activities.length > 0 ? "Using activity logs" : profile ? "Using profile" : "Personalization pending"}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <InsightCard
            icon={BarChart3}
            title="Biggest Contributor"
            value={quickInsight.biggestContributor}
            detail={quickInsight.biggestPercent}
          />
          <InsightCard
            icon={Target}
            title="Improvement Opportunity"
            value={simpleActions.actions[0]?.title ?? "Personalized action pending"}
            detail={simpleActions.actions[0] ? categoryLabels[simpleActions.actions[0].category] : "Add profile details or log activity to identify a practical next step."}
          />
          <InsightCard
            icon={TrendingDown}
            title="Potential Annual Reduction"
            value={impact ? `${impact.reductionPercent.toFixed(1)}%` : "Simulation pending"}
            detail={impact ? `${formatCarbon(impact.annualSavingsKg)} saved yearly` : "Provide profile or activity data to estimate possible annual savings."}
          />
        </div>
      </section>

      <RecommendedActions actions={simpleActions.actions} />

      <ChatAdvisor
        error={error}
        messages={visibleMessages}
        question={question}
        showHistory={showHistory}
        totalMessages={coachHistory.length}
        onAsk={askCoach}
        onClear={clearCoachHistory}
        onDelete={deleteCoachMessage}
        onQuestionChange={setQuestion}
        onToggleHistory={() => setShowHistory((current) => !current)}
      />

      <WeeklyPlanSection plan={weeklyPlan} />

      <VisualImpactSection impact={impact} />
    </div>
  );
}

function CoachHero({ score, twinIdentity }: { score: number | null; twinIdentity: string | null }) {
  return (
    <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-card to-card shadow-md dark:border-emerald-900/60 dark:from-emerald-950/30">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-emerald-600 p-3 text-white shadow-sm">
            <Leaf aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl leading-tight">EcoTrack AI Coach</CardTitle>
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Advisor</Badge>
            </div>
            <CardDescription className="mt-1 text-base">Your Personal Sustainability Advisor</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <MetricPill label="Current Carbon Score" value={score === null ? "Not calculated yet" : String(score)} />
          <MetricPill label="Carbon Twin Profile" value={twinIdentity ?? "Not generated yet"} />
        </div>
      </CardContent>
    </Card>
  );
}

function HowCoachWorksCard() {
  const steps = [
    "Complete your profile",
    "Log activities",
    "Ask questions",
    "Receive personalized sustainability guidance",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>How the Coach Works</CardTitle>
        <CardDescription>
          EcoTrack turns your own profile and activity logs into practical sustainability guidance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="How the coach works">
          {steps.map((step, index) => (
            <li key={step} className="flex items-center gap-3 rounded-lg border p-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="text-sm font-medium">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/80 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function InsightCard({
  detail,
  icon: Icon,
  title,
  value,
}: {
  detail: string;
  icon: typeof BarChart3;
  title: string;
  value: string;
}) {
  return (
    <Card className="transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-normal">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <span className="rounded-full bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendedActions({ actions }: { actions: SimpleAction[] }) {
  return (
    <section aria-labelledby="recommended-actions-heading" className="space-y-3">
      <div>
        <h2 id="recommended-actions-heading" className="text-lg font-semibold">
          Recommended Actions
        </h2>
        <p className="text-sm text-muted-foreground">Small steps chosen from your highest emission source.</p>
      </div>
      {actions.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {actions.slice(0, 5).map((action) => (
            <Card key={action.id} className="border-l-4 border-l-emerald-500">
              <CardContent className="space-y-3 p-4">
                <div className="flex gap-3">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-semibold">{action.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Impact: {getImpactLevel(action.estimatedImpactKg)}</Badge>
                  <Badge className="bg-background">Difficulty: {getDifficultyLevel(action)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Recommendations need your footprint signal"
          description="The coach uses your largest emission source to choose practical actions. Complete your profile or log one activity to receive recommendations generated from your own data."
        />
      )}
    </section>
  );
}

function ChatAdvisor({
  error,
  messages,
  onAsk,
  onClear,
  onDelete,
  onQuestionChange,
  onToggleHistory,
  question,
  showHistory,
  totalMessages,
}: {
  error: string | null;
  messages: CoachChatMessage[];
  onAsk: (question: string) => void;
  onClear: () => void;
  onDelete: (id: string) => void;
  onQuestionChange: (question: string) => void;
  onToggleHistory: () => void;
  question: string;
  showHistory: boolean;
  totalMessages: number;
}) {
  return (
    <section aria-labelledby="coach-chat-heading" className="space-y-4">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="h-5 w-5 text-emerald-600" />
                <CardTitle id="coach-chat-heading">Ask your coach</CardTitle>
              </div>
              <CardDescription>Get context-aware decisions, plans, and plain-language explanations.</CardDescription>
            </div>
            <Badge>{totalMessages} saved</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Suggested coach prompts">
            {suggestedPrompts.map((prompt) => (
              <Button
                key={prompt}
                className="h-auto justify-between whitespace-normal rounded-lg py-3 text-left"
                type="button"
                variant="secondary"
                onClick={() => onAsk(prompt)}
              >
                <span>{prompt}</span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </Button>
            ))}
          </div>

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              onAsk(question);
            }}
          >
            <Label htmlFor="coach-question">Ask your coach</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="coach-question"
                value={question}
                onChange={(event) => onQuestionChange(event.target.value)}
                placeholder="Example: I drove less than 1 km"
                aria-describedby={error ? "coach-question-error" : undefined}
                aria-invalid={Boolean(error)}
              />
              <Button className="sm:w-auto" aria-label="Ask coach" type="submit">
                <Send aria-hidden="true" className="h-4 w-4" />
                Ask coach
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive" id="coach-question-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button aria-pressed={showHistory} type="button" variant="secondary" onClick={onToggleHistory}>
              <History aria-hidden="true" className="h-4 w-4" />
              {showHistory ? "Hide history" : "Show history"}
            </Button>
            {totalMessages > 0 ? (
              <Button type="button" variant="ghost" onClick={onClear}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Clear chat
              </Button>
            ) : null}
          </div>

          <div className="space-y-3" aria-live="polite">
            {messages.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Ask about your footprint, a planned habit change, or a possible activity. The coach uses your profile,
                logged activities, or the activity statement you type.
              </div>
            ) : (
              messages.map((message) => (
                <CoachResponseArticle key={message.id} message={message} onDelete={onDelete} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CoachResponseArticle({
  message,
  onDelete,
}: {
  message: CoachChatMessage;
  onDelete: (id: string) => void;
}) {
  const card = message.card ?? fallbackCardFromMessage(message.answer);

  return (
    <article className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageSquare aria-hidden="true" className="h-4 w-4 text-emerald-600" />
            <p>{message.question}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</p>
        </div>
        <Button aria-label="Delete chat message" size="icon" type="button" variant="ghost" onClick={() => onDelete(message.id)}>
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <ResponseSection title="Analysis" value={card.analysis} />
        <ResponseSection title="Reasoning" value={card.reasoning} />
        <ResponseSection title="Recommendation" value={card.recommendation} />
        <ResponseSection title="Expected Impact" value={card.expectedImpact} />
      </div>
    </article>
  );
}

function ResponseSection({ title, value }: { title: keyof CoachResponseCard | string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6">{value}</p>
    </div>
  );
}

function WeeklyPlanSection({ plan }: { plan: CoachActionPlanItem[] }) {
  return (
    <section aria-labelledby="weekly-plan-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays aria-hidden="true" className="h-5 w-5 text-emerald-600" />
        <div>
          <h2 id="weekly-plan-heading" className="text-lg font-semibold">
            Your Weekly Sustainability Plan
          </h2>
          <p className="text-sm text-muted-foreground">A practical schedule generated from your strongest signal.</p>
        </div>
      </div>
      {plan.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {plan.map((item) => (
            <Card key={`${item.day}-${item.task}`} className="transition duration-200 hover:-translate-y-0.5">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{item.day}</p>
                <h3 className="mt-1 font-semibold">{item.task}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Your weekly plan will be built from your data"
          description="The plan turns your strongest emission signal into weekday actions you can actually complete. Complete your profile or log one activity to generate it."
        />
      )}
    </section>
  );
}

function VisualImpactSection({ impact }: { impact: ReturnType<typeof simulateFutureImpact> }) {
  const treesEquivalent = impact ? Math.max(0, impact.annualSavingsKg / 21) : 0;

  return (
    <section aria-labelledby="visual-impact-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <Trees aria-hidden="true" className="h-5 w-5 text-emerald-600" />
        <div>
          <h2 id="visual-impact-heading" className="text-lg font-semibold">
            Visual impact
          </h2>
          <p className="text-sm text-muted-foreground">Current footprint compared with your simulated future habits.</p>
        </div>
      </div>
      {impact ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <ImpactNumberCard title="Current Footprint" value={formatCarbon(impact.currentAnnualKg)} detail="Annual estimate" />
          <div className="flex items-center justify-center">
            <span className="rounded-full border bg-card px-4 py-2 text-sm font-semibold shadow-sm">VS</span>
          </div>
          <ImpactNumberCard title="Future Footprint" value={formatCarbon(impact.futureAnnualKg)} detail="After selected habit changes" />
          <ImpactNumberCard title="Reduction Percentage" value={`${impact.reductionPercent.toFixed(1)}%`} detail="Potential annual reduction" />
          <ImpactNumberCard title="Trees Equivalent" value={treesEquivalent.toFixed(1)} detail="Estimated tree-years of CO2e" />
          <ImpactNumberCard title="Annual Savings" value={formatCarbon(impact.annualSavingsKg)} detail="Calculated from your data" />
        </div>
      ) : (
        <EmptyState
          title="Visual impact needs a current footprint"
          description="This section compares current emissions with possible future habits so changes feel measurable. Complete your profile or log one activity to calculate the comparison."
        />
      )}
    </section>
  );
}

function ImpactNumberCard({ detail, title, value }: { detail: string; title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function buildQuickInsight(
  activities: Activity[],
  profile: UserProfile | null,
  actionCategory: ActivityCategory | null,
  impact: ReturnType<typeof simulateFutureImpact>,
) {
  const carbon = buildCarbonEngineResult(activities);
  const [loggedTop] = [...carbon.categoryBreakdown].sort((a, b) => b.co2eKg - a.co2eKg);

  if (loggedTop) {
    return {
      biggestContributor: categoryLabels[loggedTop.category],
      biggestPercent: `${loggedTop.percentage.toFixed(1)}% of logged emissions`,
    };
  }

  const categories = impact?.categories ?? [];
  const total = categories.reduce((sum, item) => sum + item.currentAnnualKg, 0);
  const [profileTop] = [...categories].sort((a, b) => b.currentAnnualKg - a.currentAnnualKg);

  if (profileTop && total > 0) {
    return {
      biggestContributor: categoryLabels[profileTop.category],
      biggestPercent: `${((profileTop.currentAnnualKg / total) * 100).toFixed(1)}% of profile estimate`,
    };
  }

  return {
    biggestContributor: actionCategory ? categoryLabels[actionCategory] : profile ? "Activity details needed" : "Not enough information",
    biggestPercent: profile
      ? "Log activities to unlock category percentages."
      : "Complete your profile or log one activity to identify your largest source.",
  };
}

function buildPlanFromActions(actions: SimpleAction[], profile: UserProfile | null): CoachActionPlanItem[] {
  if (actions.length === 0) {
    return [];
  }

  const [first, second, third] = actions;
  const profileTasks = [
    profile?.transportation.weeklyDistanceKm ? "Walk one short trip under 2 km" : null,
    profile?.electricity.monthlyKwh ? "Reduce AC by 1 hour" : null,
    profile?.waste.landfillKgPerWeek ? "Sort recycling before disposal" : null,
  ].filter(Boolean) as string[];

  const tasks = [
    first?.title,
    second?.title,
    profileTasks[0],
    third?.title,
    profileTasks[1] ?? profileTasks[2],
  ].filter(Boolean) as string[];

  return tasks.slice(0, 5).map((task, index) => ({
    day: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"][index] ?? "This week",
    task,
    reason: "This plan is generated from your highest profile or activity source.",
  }));
}

function getImpactLevel(estimatedImpactKg: number) {
  if (estimatedImpactKg >= 10) {
    return "High";
  }

  if (estimatedImpactKg >= 3) {
    return "Medium";
  }

  return "Low";
}

function getDifficultyLevel(action: SimpleAction) {
  const easyIds = ["walk", "idle", "daylight", "bottle", "recycle", "leftover"];
  return easyIds.some((id) => action.id.includes(id)) ? "Easy" : "Moderate";
}

function fallbackCardFromMessage(answer: string): CoachResponseCard {
  return {
    analysis: answer,
    reasoning: "This saved answer was created before structured response cards were stored.",
    recommendation: "Ask the coach again to get a full advisor card.",
    expectedImpact: "Recreated from saved chat history.",
  };
}
