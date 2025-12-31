"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Target,
  PieChart,
} from "lucide-react";
import type { GapOpportunity } from "@/types";
import { GapAnalysis } from "@/components/dashboard/GapAnalysis";
import { getMockGapOpportunities } from "@/lib/attribution/gaps";

export default function GapsPage() {
  const [gapOpportunities, setGapOpportunities] = useState<GapOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load gap opportunities
    const gaps = getMockGapOpportunities();
    setGapOpportunities(gaps);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          <p className="text-sm">Loading gap analysis...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-400" />
              Gaps for Improvement
            </h1>
            <p className="text-slate-400 text-sm">
              Identify underperforming areas and get actionable recommendations
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <div className="space-y-6">
          {/* Demand vs Supply Overview */}
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-amber-400" />
              Demand vs Supply Overview
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              Category gaps identified from eCayTrade search and listing data
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 relative">
                <div className="absolute -top-3 left-4 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  URGENT
                </div>
                <p className="text-red-400 text-xs uppercase tracking-wide mb-2">
                  Critical Gaps
                </p>
                <p className="text-3xl font-bold text-red-400">
                  {gapOpportunities.filter((g) => g.gap_score >= 0.8).length}
                </p>
                <p className="text-red-400/70 text-xs mt-2">
                  Immediate action needed
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <p className="text-amber-400 text-xs uppercase tracking-wide mb-2">
                  High Priority
                </p>
                <p className="text-3xl font-bold text-amber-400">
                  {gapOpportunities.filter((g) => g.gap_score >= 0.6 && g.gap_score < 0.8).length}
                </p>
                <p className="text-amber-400/70 text-xs mt-2">
                  Strong opportunities
                </p>
              </div>
              <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                  Categories
                </p>
                <p className="text-3xl font-bold text-white">
                  {gapOpportunities.length}
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  eCayTrade marketplace
                </p>
              </div>
            </div>
          </div>

          {/* Gap Analysis Component */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              eCayTrade Category Gaps
            </h2>
            <GapAnalysis gaps={gapOpportunities} />
          </div>

          {/* Action CTA */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <h3 className="text-white font-medium mb-2">
              Turn Gaps into Revenue
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Use these insights to create targeted campaigns: Radio ads recruiting
              solar panel sellers, CT articles about EV market opportunities,
              cross-platform bundles for high-gap categories.
            </p>
            <Link
              href="/dashboard/ecosystem"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              <Target className="h-4 w-4" />
              See Multi-Platform Strategy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
