"use client";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buildCarbonTwin } from "@/features/twin/carbon-twin-engine";
import { useEcoTrack } from "@/state/ecotrack-state";

export function CarbonTwinPanel() {
  const { activities, profile } = useEcoTrack();
  const twin = buildCarbonTwin(profile, activities);

  if (!twin) {
    return (
      <EmptyState
        title="No carbon twin yet"
        description="Save a profile or add activity logs to generate your carbon twin from real data."
      />
    );
  }

  return (
    <section className="space-y-4" aria-label="Carbon twin profile">
      <div className="rounded-md border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{twin.identity}</h3>
          <Badge className="capitalize">{twin.dominantCategory}</Badge>
          <Badge>{twin.dataSource === "activity_logs" ? "From logs" : "From profile"}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{twin.profile}</p>
      </div>

      <TwinList title="Strengths" items={twin.strengths} fallback="Add more data to identify strengths." />
      <TwinList title="Weaknesses" items={twin.weaknesses} fallback="Add more data to identify weaknesses." />
      <TwinList
        title="Improvement opportunities"
        items={twin.opportunities}
        fallback="Add more data to identify opportunities."
      />
    </section>
  );
}

function TwinList({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <section className="rounded-md border p-4" aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <h3 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="text-sm font-semibold">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{fallback}</p>
      ) : (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
