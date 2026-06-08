"use client";

import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buildSimpleActions } from "@/features/actions/actions-engine";
import { formatCarbon } from "@/lib/format";
import { useEcoTrack } from "@/state/ecotrack-state";

export function SimpleActionsPanel() {
  const { activities, profile } = useEcoTrack();
  const result = buildSimpleActions(profile, activities);

  if (result.actions.length === 0) {
    return (
      <EmptyState
        title="No actions yet"
        description="Save a profile or add activity logs to generate practical actions from your own data."
      />
    );
  }

  return (
    <section className="space-y-4" aria-label="Simple emission reduction actions">
      {result.highestSource ? (
        <p className="text-sm text-muted-foreground">
          Actions are based on your highest source:{" "}
          <span className="font-medium capitalize text-foreground">{result.highestSource.category}</span>.
        </p>
      ) : null}

      <ol className="grid gap-3 sm:grid-cols-2">
        {result.actions.map((action) => (
          <li key={action.id} className="rounded-md border p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{action.title}</h3>
                  <Badge className="capitalize">{action.category}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{action.reason}</p>
                <p className="mt-3 font-mono text-xs">
                  Estimated small-action impact: {formatCarbon(action.estimatedImpactKg)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
