import { BottomNav, Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="pb-24 lg:pb-8 lg:pl-60">{children}</main>
      <BottomNav />
    </>
  );
}
