"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Calendar, GitBranch, Home, TrendingUp, AlertTriangle } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: Home, exact: true },
  { href: "/dashboard/time-saved", label: "Time Saved", icon: Clock },
  { href: "/dashboard/conversions", label: "Conversions", icon: GitBranch },
  { href: "/dashboard/ecosystem", label: "Ecosystem", icon: TrendingUp },
  { href: "/dashboard/gaps", label: "Gaps", icon: AlertTriangle },
  { href: "/dashboard/timeline", label: "Timeline", icon: Calendar },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-6 py-2">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
