"use client";

import Link from "next/link";
import {
  Clock,
  GitBranch,
  TrendingUp,
  AlertTriangle,
  Calendar,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";

const goalCards = [
  {
    title: "Track Time Saved",
    description:
      "See hours saved per station over time. Understand where efficiency gains are happening and correlate with process changes.",
    href: "/dashboard/time-saved",
    icon: Clock,
    color: "emerald",
  },
  {
    title: "Platform Conversions",
    description:
      "Visualize how work flows through each platform with Sankey diagrams. Identify bottlenecks and optimize handoffs.",
    href: "/dashboard/conversions",
    icon: GitBranch,
    color: "blue",
  },
  {
    title: "Ecosystem Lift",
    description:
      "Map cross-platform customer journeys to understand synergies. See which combinations drive the best outcomes.",
    href: "/dashboard/ecosystem",
    icon: TrendingUp,
    color: "violet",
  },
  {
    title: "Gaps for Improvement",
    description:
      "Identify underperforming stations and missing connections. Get actionable recommendations for quick wins.",
    href: "/dashboard/gaps",
    icon: AlertTriangle,
    color: "amber",
  },
  {
    title: "Change Timeline",
    description:
      "Track process changes, team updates, and tool rollouts. Correlate changes with metric improvements over time.",
    href: "/dashboard/timeline",
    icon: Calendar,
    color: "rose",
  },
  {
    title: "Service Overview",
    description:
      "High-level health check across all service lines. Monitor RAG status, variance, and QA scores at a glance.",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "slate",
  },
];

const colorStyles: Record<string, { bg: string; border: string; icon: string; hover: string }> = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20 hover:border-emerald-500/40",
    icon: "text-emerald-400",
    hover: "group-hover:bg-emerald-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20 hover:border-blue-500/40",
    icon: "text-blue-400",
    hover: "group-hover:bg-blue-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20 hover:border-violet-500/40",
    icon: "text-violet-400",
    hover: "group-hover:bg-violet-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20 hover:border-amber-500/40",
    icon: "text-amber-400",
    hover: "group-hover:bg-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20 hover:border-rose-500/40",
    icon: "text-rose-400",
    hover: "group-hover:bg-rose-500/20",
  },
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20 hover:border-slate-500/40",
    icon: "text-slate-400",
    hover: "group-hover:bg-slate-500/20",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white">Blueprintos</h1>
            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            What do you want to achieve?
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Select a goal below to get started. Each view is designed to help you answer specific
            questions about your operations.
          </p>
        </div>

        {/* Goal Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {goalCards.map((card) => {
            const styles = colorStyles[card.color];
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group relative rounded-xl border ${styles.border} bg-slate-900/50 p-6 transition-all hover:bg-slate-900/80`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-lg ${styles.bg} ${styles.hover} p-3 transition-colors`}
                  >
                    <Icon className={`h-6 w-6 ${styles.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      {card.title}
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-sm text-slate-500 text-center">
            Blueprintos — Operational visibility for media teams
          </p>
        </div>
      </footer>
    </main>
  );
}
