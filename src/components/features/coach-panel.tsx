"use client";

import { useState } from "react";
import { History, MessageSquare, Send, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { answerCoachQuestion, buildStructuredCoachInsight } from "@/features/coach/coach-engine";
import { coachQuestionSchema } from "@/features/coach/coach.schema";
import { formatCarbon } from "@/lib/format";
import { useEcoTrack } from "@/state/ecotrack-state";

type CoachMode = "structured" | "conversation";

const exampleQuestions = [
  "Why is my footprint high?",
  "What should I improve first?",
  "Explain my score simply.",
  "Generate a weekly plan.",
];

export function CoachPanel() {
  const { activities, addCoachMessage, clearCoachHistory, coachHistory, deleteCoachMessage } = useEcoTrack();
  const [mode, setMode] = useState<CoachMode>("structured");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const insight = buildStructuredCoachInsight(activities);

  function askCoach(value: string) {
    const parsed = coachQuestionSchema.safeParse({ question: value });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a question.");
      return;
    }

    const response = answerCoachQuestion(activities, parsed.data.question);

    if (!response) {
      setError("Add activity logs before asking the coach.");
      return;
    }

    addCoachMessage({
      question: parsed.data.question,
      answer: response.answer,
      sourceActivityIds: response.sourceActivityIds,
    });
    setQuestion("");
    setShowHistory(true);
    setError(null);
  }

  const visibleMessages = showHistory ? coachHistory : coachHistory.slice(-1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-md border p-1" role="tablist" aria-label="Coach mode">
        <button
          aria-selected={mode === "structured"}
          className="rounded px-3 py-2 text-sm aria-selected:bg-primary aria-selected:text-primary-foreground"
          role="tab"
          type="button"
          onClick={() => setMode("structured")}
        >
          Structured
        </button>
        <button
          aria-selected={mode === "conversation"}
          className="rounded px-3 py-2 text-sm aria-selected:bg-primary aria-selected:text-primary-foreground"
          role="tab"
          type="button"
          onClick={() => setMode("conversation")}
        >
          Conversational
        </button>
      </div>

      {mode === "structured" ? (
        insight ? (
          <StructuredCoachView insight={insight} />
        ) : (
          <EmptyState
            title="Coach is waiting for real data"
            description="Structured insights appear after you add activity logs. It will not generate placeholder advice."
          />
        )
      ) : (
        <section aria-label="Conversational sustainability coach" className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {exampleQuestions.map((example) => (
              <Button
                key={example}
                className="h-auto justify-start whitespace-normal text-left"
                type="button"
                variant="secondary"
                onClick={() => askCoach(example)}
              >
                <MessageSquare aria-hidden="true" className="h-4 w-4" />
                {example}
              </Button>
            ))}
          </div>

          {!insight ? (
            <p className="rounded-md border p-3 text-sm text-muted-foreground">
              You can ask about a possible activity, such as “I drove less than 1 km.” For footprint advice,
              add activity logs first.
            </p>
          ) : null}

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              askCoach(question);
            }}
          >
            <Label htmlFor="coach-question">Ask about your footprint</Label>
            <div className="flex gap-2">
              <Input
                id="coach-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: What should I improve first?"
                aria-describedby={error ? "coach-question-error" : undefined}
                aria-invalid={Boolean(error)}
              />
              <Button aria-label="Ask coach" size="icon" type="submit">
                <Send aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
            {error ? (
              <p className="text-sm text-destructive" id="coach-question-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button
              aria-pressed={showHistory}
              type="button"
              variant="secondary"
              onClick={() => setShowHistory((current) => !current)}
            >
              <History aria-hidden="true" className="h-4 w-4" />
              {showHistory ? "Hide history" : "Show history"}
            </Button>
            {coachHistory.length > 0 ? (
              <Button type="button" variant="ghost" onClick={clearCoachHistory}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Clear chat
              </Button>
            ) : null}
          </div>

          <div className="space-y-3" aria-live="polite">
            {visibleMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Answers will cite your activity data when logs exist. Activity statements are explained without
                adding them to your footprint automatically.
              </p>
            ) : (
              visibleMessages.map((message) => (
                <article key={message.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{message.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      aria-label="Delete chat message"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => deleteCoachMessage(message.id)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{message.answer}</p>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function StructuredCoachView({ insight }: { insight: NonNullable<ReturnType<typeof buildStructuredCoachInsight>> }) {
  return (
    <section className="space-y-4" aria-label="Structured sustainability coach">
      <div className="rounded-md border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Highest emission source</h3>
          <Badge className="capitalize">{insight.highestSource.category}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{insight.reason}</p>
      </div>

      <div className="rounded-md border p-4">
        <h3 className="text-sm font-semibold">Score explanation</h3>
        <p className="mt-2 text-sm text-muted-foreground">{insight.scoreExplanation}</p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Improvements</h3>
        <ul className="space-y-3" aria-label="Data-driven sustainability improvements">
          {insight.improvements.map((action) => (
            <li key={action.id} className="rounded-md border p-4">
              <p className="text-sm font-medium">{action.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{action.detail}</p>
              <p className="mt-3 font-mono text-xs">Estimated impact: {formatCarbon(action.estimatedImpactKg)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Weekly action plan</h3>
        <ol className="space-y-2" aria-label="Weekly sustainability action plan">
          {insight.weeklyPlan.map((item) => (
            <li key={item.day} className="rounded-md border p-3 text-sm">
              <span className="font-medium">{item.day}: </span>
              <span>{item.task}</span>
              <p className="mt-1 text-muted-foreground">{item.reason}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
