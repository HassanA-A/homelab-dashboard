"use client";

import { useActionState } from "react";
import { saveProfile, type ProfileState } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import type { Profile } from "@/types/db";

const ZONES = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Karachi", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney", "UTC"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const zones = ZONES.includes(profile.timezone) ? ZONES : [profile.timezone, ...ZONES];
  return (
    <form action={action} className="space-y-4">
      <Field label="Display name">
        <Input name="display_name" defaultValue={profile.display_name ?? ""} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Weight unit">
          <Select name="weight_unit" defaultValue={profile.weight_unit}>
            <option value="lb">Pounds (lb)</option>
            <option value="kg">Kilograms (kg)</option>
          </Select>
        </Field>
        <Field label="Height (cm)">
          <Input name="height_cm" type="number" inputMode="decimal" defaultValue={profile.height_cm ?? ""} />
        </Field>
      </div>
      <Field label="Timezone (decides which day an entry belongs to)">
        <Select name="timezone" defaultValue={profile.timezone}>
          {zones.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </Select>
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.ok && <p className="text-sm text-accent">Saved.</p>}
      <Button disabled={pending}>{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
