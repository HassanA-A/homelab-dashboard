import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Empty } from "@/components/ui/empty";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return (
    <>
      <Topbar title="Analytics" />
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <Empty icon={BarChart3} title="Coming next">
          Phase 7: 7d–all-time filters, intake vs. weight trend, volume by muscle group, CSV export.
        </Empty>
      </div>
    </>
  );
}
