import { Activity, BarChart3, Dumbbell, LayoutDashboard, Salad, Scale, Settings } from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/nutrition", label: "Nutrition", icon: Salad },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/body", label: "Weight & Body", short: "Body", icon: Scale },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const BrandIcon = Activity;
