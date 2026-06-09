"use client";

import { Trash2 } from "lucide-react";
import { carbonFactors } from "@/features/carbon/carbon-factors";
import { formatCarbon } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useEcoTrack } from "@/state/ecotrack-state";

export function ActivityList() {
  const { activities, removeActivity } = useEcoTrack();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent logs</CardTitle>
        <CardDescription>Activity logs create the history used for scores, charts, and coaching.</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            title="Build your activity history"
            description="Activity history records dated lifestyle choices and their carbon impact. Log one activity to unlock summaries, charts, and coach insights."
          />
        ) : (
          <ul className="space-y-3" aria-label="Logged activities">
            {activities.map((activity) => {
              const factor = carbonFactors.find((item) => item.id === activity.activityType);
              return (
                <li key={activity.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">{factor?.label ?? activity.activityType}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.amount} {activity.unit} on {activity.date}
                    </p>
                    {activity.note ? <p className="mt-1 text-xs text-muted-foreground">{activity.note}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs">{formatCarbon(activity.co2eKg)}</span>
                    <Button
                      aria-label="Remove activity"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => removeActivity(activity.id)}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
