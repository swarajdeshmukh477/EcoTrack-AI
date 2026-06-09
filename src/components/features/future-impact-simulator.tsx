"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator } from "lucide-react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { simulateFutureImpact } from "@/features/simulator/future-impact-engine";
import {
  defaultHabitAdjustments,
  habitAdjustmentsSchema,
  type HabitAdjustmentValues,
} from "@/features/simulator/simulator.schema";
import { formatCarbon } from "@/lib/format";
import { useEcoTrack } from "@/state/ecotrack-state";

export function FutureImpactSimulator() {
  const { activities, profile } = useEcoTrack();
  const { register, watch } = useForm<HabitAdjustmentValues>({
    resolver: zodResolver(habitAdjustmentsSchema),
    defaultValues: defaultHabitAdjustments,
    mode: "onChange",
  });
  const adjustments = habitAdjustmentsSchema.safeParse(watch());
  const result = adjustments.success ? simulateFutureImpact(profile, activities, adjustments.data) : null;

  if (!result) {
    return (
      <EmptyState
        title="Simulate future emissions from your own habits"
        description="This tool compares your current footprint with possible lifestyle changes before you try them in real life. Complete your profile or log one activity to start the comparison."
      />
    );
  }

  return (
    <section className="space-y-5" aria-label="Future impact simulator">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Current emissions" value={formatCarbon(result.currentAnnualKg)} />
        <Metric label="Future emissions" value={formatCarbon(result.futureAnnualKg)} />
        <Metric label="Reduction" value={`${result.reductionPercent.toFixed(1)}%`} />
        <Metric label="Annual savings" value={formatCarbon(result.annualSavingsKg)} />
      </div>

      <div className="rounded-md border p-4" aria-labelledby="before-after-heading">
        <h3 id="before-after-heading" className="text-sm font-semibold">
          Before vs after visualization
        </h3>
        <div className="mt-4 grid gap-4">
          <ComparisonBar label="Current footprint" value={result.currentAnnualKg} max={result.currentAnnualKg} />
          <ComparisonBar label="Future footprint" value={result.futureAnnualKg} max={result.currentAnnualKg} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <form className="grid gap-4 rounded-md border p-4" aria-label="Habit changes">
          <SliderField
            id="transportReductionPercent"
            label="Transport reduction"
            register={register}
            suffix="%"
            value={adjustments.success ? adjustments.data.transportReductionPercent : 0}
          />
          <SliderField
            id="electricityReductionPercent"
            label="Electricity reduction"
            register={register}
            suffix="%"
            value={adjustments.success ? adjustments.data.electricityReductionPercent : 0}
          />
          <NumberField
            id="meatMealsReducedPerWeek"
            label="Meat meals to reduce weekly"
            register={register}
          />
          <SliderField
            id="shoppingReductionPercent"
            label="Shopping reduction"
            register={register}
            suffix="%"
            value={adjustments.success ? adjustments.data.shoppingReductionPercent : 0}
          />
          <SliderField
            id="wasteDiversionPercent"
            label="Waste diverted from landfill"
            register={register}
            suffix="%"
            value={adjustments.success ? adjustments.data.wasteDiversionPercent : 0}
          />
        </form>

        <div className="rounded-md border p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calculator aria-hidden="true" className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Category savings</h3>
          </div>
          <ul className="space-y-3" aria-label="Future impact by category">
            {result.categories.map((category) => (
              <li key={category.category} className="grid gap-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize">{category.category}</span>
                  <span className="font-mono">{formatCarbon(category.annualSavingsKg)} saved</span>
                </div>
                <div className="h-2 rounded-full bg-secondary" aria-hidden="true">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${category.currentAnnualKg > 0 ? Math.min(100, (category.annualSavingsKg / category.currentAnnualKg) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Current {formatCarbon(category.currentAnnualKg)} to future {formatCarbon(category.futureAnnualKg)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold">{value}</p>
    </div>
  );
}

function ComparisonBar({ label, max, value }: { label: string; max: number; value: number }) {
  const width = max > 0 ? Math.max(4, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{label}</span>
        <span className="font-mono">{formatCarbon(value)}</span>
      </div>
      <div className="h-4 rounded-full bg-secondary" aria-hidden="true">
        <div className="h-4 rounded-full bg-primary transition-all" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

type FieldId = keyof HabitAdjustmentValues;

function SliderField({
  id,
  label,
  register,
  suffix,
  value,
}: {
  id: FieldId;
  label: string;
  register: UseFormRegister<HabitAdjustmentValues>;
  suffix: string;
  value: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid grid-cols-[1fr_76px] items-center gap-3">
        <Input
          id={id}
          max="100"
          min="0"
          step="1"
          type="range"
          aria-valuetext={`${value}${suffix}`}
          {...register(id, { valueAsNumber: true })}
        />
        <output className="font-mono text-sm" htmlFor={id}>
          {value}
          {suffix}
        </output>
      </div>
    </div>
  );
}

function NumberField({
  id,
  label,
  register,
}: {
  id: FieldId;
  label: string;
  register: UseFormRegister<HabitAdjustmentValues>;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} min="0" step="1" type="number" {...register(id, { valueAsNumber: true })} />
    </div>
  );
}
