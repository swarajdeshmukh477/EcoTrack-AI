"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pencil } from "lucide-react";
import { useForm, type FieldError, type FieldErrors, type Path, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { dietTypes, transportModes } from "@/features/profile/profile.types";
import { emptyProfileFormValues, profileSchema, type ProfileFormValues } from "@/features/profile/profile.schema";
import { useEcoTrack } from "@/state/ecotrack-state";

export function ProfileOnboarding() {
  const { profile, saveProfile } = useEcoTrack();
  const [isEditing, setIsEditing] = useState(profile === null);
  const defaultValues = useMemo(() => profile ?? emptyProfileFormValues, [profile]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  function submitProfile(values: ProfileFormValues) {
    saveProfile(values);
    setIsEditing(false);
    reset(values);
  }

  if (!isEditing && profile) {
    return <ProfileSummary onEdit={() => setIsEditing(true)} profile={profile} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile ? "Update profile" : "Start with your profile"}</CardTitle>
        <CardDescription>
          Save your usual habits for personalization. This does not add emissions to your activity history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(submitProfile)}>
          <ProfileSection title="Transportation">
            <SelectField
              id="transportation.primaryMode"
              label="Primary transportation mode"
              options={transportModes.map((mode) => ({ label: transportModeLabel(mode), value: mode }))}
              register={register}
            />
            <NumberField
              id="transportation.weeklyDistanceKm"
              label="Weekly travel distance"
              suffix="km"
              register={register}
              error={errors.transportation?.weeklyDistanceKm}
            />
            <NumberField
              id="transportation.sharedTripsPerWeek"
              label="Shared or public transport trips per week"
              register={register}
              error={errors.transportation?.sharedTripsPerWeek}
            />
          </ProfileSection>

          <ProfileSection title="Electricity">
            <NumberField
              id="electricity.monthlyKwh"
              label="Monthly electricity use"
              suffix="kWh"
              register={register}
              error={errors.electricity?.monthlyKwh}
            />
            <NumberField
              id="electricity.renewablePercent"
              label="Renewable electricity share"
              suffix="%"
              register={register}
              error={errors.electricity?.renewablePercent}
            />
          </ProfileSection>

          <ProfileSection title="Food">
            <SelectField
              id="food.dietType"
              label="Typical diet"
              options={dietTypes.map((diet) => ({ label: dietTypeLabel(diet), value: diet }))}
              register={register}
            />
            <NumberField
              id="food.meatMealsPerWeek"
              label="Meat meals per week"
              register={register}
              error={errors.food?.meatMealsPerWeek}
            />
          </ProfileSection>

          <ProfileSection title="Shopping">
            <NumberField
              id="shopping.clothingItemsPerMonth"
              label="Clothing purchases per month"
              register={register}
              error={errors.shopping?.clothingItemsPerMonth}
            />
            <NumberField
              id="shopping.electronicsItemsPerYear"
              label="Electronics items per year"
              register={register}
              error={errors.shopping?.electronicsItemsPerYear}
            />
          </ProfileSection>

          <ProfileSection title="Waste">
            <NumberField
              id="waste.landfillKgPerWeek"
              label="Landfill waste per week"
              suffix="kg"
              register={register}
              error={errors.waste?.landfillKgPerWeek}
            />
            <NumberField
              id="waste.recyclingKgPerWeek"
              label="Recycling per week"
              suffix="kg"
              register={register}
              error={errors.waste?.recyclingKgPerWeek}
            />
          </ProfileSection>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isSubmitting} type="submit">
              <Check aria-hidden="true" className="h-4 w-4" />
              Save profile
            </Button>
            {profile ? (
              <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type ProfileSectionProps = {
  title: string;
  children: React.ReactNode;
};

function ProfileSection({ title, children }: ProfileSectionProps) {
  return (
    <fieldset className="rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      <div className="grid gap-4 pt-2 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

type NumberFieldProps = {
  id: Path<ProfileFormValues>;
  label: string;
  suffix?: string;
  register: UseFormRegister<ProfileFormValues>;
  error?: FieldError;
};

function NumberField({ id, label, suffix, register, error }: NumberFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          min="0"
          step="0.01"
          type="number"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          {...register(id, { valueAsNumber: true })}
        />
        {suffix ? <span className="w-10 text-sm text-muted-foreground">{suffix}</span> : null}
      </div>
      {error ? (
        <p className="text-sm text-destructive" id={errorId} role="alert">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}

type SelectFieldProps = {
  id: Path<ProfileFormValues>;
  label: string;
  options: Array<{ label: string; value: string }>;
  register: UseFormRegister<ProfileFormValues>;
};

function SelectField({ id, label, options, register }: SelectFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        className="h-10 rounded-md border bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        {...register(id)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProfileSummary({
  profile,
  onEdit,
}: {
  profile: ProfileFormValues;
  onEdit: () => void;
}) {
  const items = [
    ["Transportation", `${transportModeLabel(profile.transportation.primaryMode)}, ${profile.transportation.weeklyDistanceKm} km/week, ${profile.transportation.sharedTripsPerWeek} shared trips/week`],
    ["Electricity", `${profile.electricity.monthlyKwh} kWh/month AC and appliances, ${profile.electricity.renewablePercent}% renewable`],
    ["Food", `${dietTypeLabel(profile.food.dietType)}, ${profile.food.meatMealsPerWeek} meat meals/week`],
    ["Shopping", `${profile.shopping.clothingItemsPerMonth} clothing/month, ${profile.shopping.electronicsItemsPerYear} electronics/year`],
    ["Waste", `${profile.waste.landfillKgPerWeek} kg landfill/week, ${profile.waste.recyclingKgPerWeek} kg recycled/week`],
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <div className="mb-2">
            <Badge>Profile saved</Badge>
          </div>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Used to personalize recommendations and simulations.</CardDescription>
        </div>
        <Button aria-label="Edit profile" size="icon" type="button" variant="ghost" onClick={onEdit}>
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          {items.map(([label, value]) => (
            <div key={label} className="grid gap-1 rounded-md border p-3">
              <dt className="font-medium">{label}</dt>
              <dd className="text-muted-foreground">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function transportModeLabel(mode: (typeof transportModes)[number]) {
  const labels: Record<(typeof transportModes)[number], string> = {
    car: "Car",
    bus: "Bus",
    rail: "Rail",
    bike_walk: "Bike or walk",
    remote: "Mostly remote",
  };

  return labels[mode];
}

function dietTypeLabel(diet: (typeof dietTypes)[number]) {
  const labels: Record<(typeof dietTypes)[number], string> = {
    omnivore: "Mixed / Non-vegetarian",
    pescatarian: "Pescatarian",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
  };

  return labels[diet];
}
