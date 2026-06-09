"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { carbonFactors } from "@/features/carbon/carbon-factors";
import { formatCarbon } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { useEcoTrack } from "@/state/ecotrack-state";

export function CarbonChart() {
  const { activities } = useEcoTrack();
  const activityRows = [...activities]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((activity, index) => {
      const label = carbonFactors.find((factor) => factor.id === activity.activityType)?.label ?? activity.activityType;

      return {
        ...activity,
        label,
        chartLabel: `${index + 1}. ${label}`,
      };
    });

  if (activities.length === 0) {
    return (
      <EmptyState
        title="Visualize emissions from logged activities"
        description="This chart compares activity emissions so you can spot the entries with the largest impact. Log a dated activity to start building the visualization."
      />
    );
  }

  const total = activityRows.reduce((sum, item) => sum + item.co2eKg, 0);

  return (
    <div className="space-y-5">
      <p className="sr-only">
        Carbon chart summary: {activityRows.length} activit{activityRows.length === 1 ? "y" : "ies"} logged with{" "}
        {formatCarbon(total)} total emissions.
      </p>

      <div>
        <h3 className="mb-2 text-sm font-medium">Activity emissions</h3>
        <div className="h-[320px] w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={activityRows}
              layout="vertical"
              margin={{ bottom: 8, left: 12, right: 24, top: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                tickFormatter={(value) => `${value} kg`}
              />
              <YAxis
                dataKey="chartLabel"
                interval={0}
                tickLine={false}
                type="category"
                width={150}
              />
              <Tooltip
                formatter={(value) => formatCarbon(Number(value))}
                labelFormatter={(_, payload) => {
                  const activity = payload?.[0]?.payload as (typeof activityRows)[number] | undefined;
                  return activity ? `${activity.label} on ${activity.date}` : "Activity";
                }}
              />
              <Bar dataKey="co2eKg" fill="#2f8f5b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium">Activity emissions table</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <caption className="sr-only">Emission history by logged activity</caption>
            <thead className="bg-secondary text-secondary-foreground">
              <tr>
                <th className="px-3 py-2 font-medium" scope="col">
                  Date
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Activity
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Category
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Amount
                </th>
                <th className="px-3 py-2 font-medium" scope="col">
                  Emissions
                </th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((activity) => (
                <tr key={activity.id} className="border-t">
                  <td className="px-3 py-2">{activity.date}</td>
                  <td className="px-3 py-2">{activity.label}</td>
                  <td className="px-3 py-2 capitalize">{activity.category}</td>
                  <td className="px-3 py-2">
                    {activity.amount} {activity.unit}
                  </td>
                  <td className="px-3 py-2 font-mono">{formatCarbon(activity.co2eKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
