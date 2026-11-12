import type { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/settings/goal-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { signOut } from "@/app/login/actions";
import { getGoalForDate, getSession } from "@/lib/data";
import { fromKg } from "@/lib/units";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { profile, today, supabase, user } = await getSession();
  const [goal, latest] = await Promise.all([
    getGoalForDate(today),
    supabase.from("weight_entries").select("weight_kg").order("measured_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const bwLb = latest.data ? fromKg(Number(latest.data.weight_kg), "lb") : null;

  return (
    <>
      <Topbar title="Settings" />
      <div className="mx-auto grid max-w-4xl gap-4 p-4 sm:p-6">
        <Card>
          <CardHeader title="Nutrition targets" subtitle="Changes apply from today; history keeps the old targets." />
          <GoalForm goal={goal} today={today} bodyweightLb={bwLb} />
        </Card>
        <Card>
          <CardHeader title="Profile" subtitle={user.email} />
          <ProfileForm profile={profile} />
        </Card>
        <form action={signOut}>
          <Button variant="secondary">Sign out</Button>
        </form>
      </div>
    </>
  );
}
