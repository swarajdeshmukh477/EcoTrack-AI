"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ActivityCategory, ActivityInput, ActivityUnit } from "@/features/activities/activity.types";
import { activityCategories } from "@/features/activities/activity.types";
import { activityInputSchema } from "@/features/activities/activity.schema";
import { getFactorsByCategory } from "@/features/carbon/carbon-factors";
import { todayIsoDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEcoTrack } from "@/state/ecotrack-state";

type FormState = {
  category: ActivityCategory;
  activityType: string;
  amount: string;
  unit: ActivityUnit;
  date: string;
  note: string;
};

const initialCategory = "transport";
const initialFactor = getFactorsByCategory(initialCategory)[0];

const initialFormState: FormState = {
  category: initialCategory,
  activityType: initialFactor.id,
  amount: "",
  unit: initialFactor.unit,
  date: todayIsoDate(),
  note: "",
};

export function ActivityForm() {
  const { addActivity } = useEcoTrack();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState<string | null>(null);
  const factors = useMemo(() => getFactorsByCategory(form.category), [form.category]);

  function updateCategory(category: ActivityCategory) {
    const [firstFactor] = getFactorsByCategory(category);
    setForm((current) => ({
      ...current,
      category,
      activityType: firstFactor.id,
      unit: firstFactor.unit,
    }));
  }

  function updateActivityType(activityType: string) {
    const factor = factors.find((item) => item.id === activityType);
    if (!factor) {
      return;
    }

    setForm((current) => ({
      ...current,
      activityType,
      unit: factor.unit,
    }));
  }

  function submitActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const candidate: ActivityInput = {
      category: form.category,
      activityType: form.activityType,
      amount: Number(form.amount),
      unit: form.unit,
      date: form.date,
      note: form.note.trim() || undefined,
    };
    const result = activityInputSchema.safeParse(candidate);

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check the activity details.");
      return;
    }

    addActivity(result.data);
    setForm({
      ...initialFormState,
      date: todayIsoDate(),
    });
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle id="activity-form-title">Add activity</CardTitle>
        <CardDescription>Choose a real activity and amount to calculate its carbon impact.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          aria-describedby={error ? "activity-form-error" : undefined}
          aria-labelledby="activity-form-title"
          className="space-y-4"
          onSubmit={submitActivity}
        >
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              value={form.category}
              onChange={(event) => updateCategory(event.target.value as ActivityCategory)}
            >
              {activityCategories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel(category)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="activity-type">Activity type</Label>
            <select
              id="activity-type"
              className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              value={form.activityType}
              onChange={(event) => updateActivityType(event.target.value)}
            >
              {factors.map((factor) => (
                <option key={factor.id} value={factor.id}>
                  {factor.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-[1fr_86px] gap-3">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                aria-invalid={Boolean(error)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} readOnly />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              maxLength={140}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="Optional"
            />
          </div>

          {error ? (
            <p className="text-sm text-destructive" id="activity-form-error" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="w-full" type="submit">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add activity
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function categoryLabel(category: ActivityCategory) {
  const labels: Record<ActivityCategory, string> = {
    transport: "Transport",
    food: "Food",
    home: "Home energy",
    shopping: "Shopping",
    waste: "Waste",
  };

  return labels[category];
}
