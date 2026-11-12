import type { Metadata } from "next";
import { Dumbbell } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Empty } from "@/components/ui/empty";

export const metadata: Metadata = { title: "Workouts" };

export default function Page() {
  return (
    <>
      <Topbar title="Workouts" />
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Empty icon={Dumbbell} title="Coming next">
          Phase 6: routines, set-by-set logging with RIR, rest timer, previous-session reference, PRs. The schema and e1RM/volume math are already in place.
        </Empty>
      </div>
    </>
  );
}
