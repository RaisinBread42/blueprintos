"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  GitBranch,
  AlertTriangle,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import type { JourneySnapshot } from "@/types";
import { AttributionSankey } from "@/components/dashboard/AttributionSankey";

export default function ConversionsPage() {
  const [snapshots, setSnapshots] = useState<JourneySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/attribution/snapshots");
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load snapshots");
        }

        const allSnapshots: JourneySnapshot[] = json.data;
        const real = allSnapshots.filter((s) => s.snapshot_id !== "ideal-scenario");

        setSnapshots(real);

        if (real.length > 0) {
          setSelectedPeriod(real[0].snapshot_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load snapshots");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selectedSnapshot = useMemo(() => {
    return snapshots.find((s) => s.snapshot_id === selectedPeriod) ?? null;
  }, [snapshots, selectedPeriod]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          <p className="text-sm">Loading conversion data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
          <p className="font-medium">Error</p>
          <p className="text-sm opacity-80">{error}</p>
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
              <GitBranch className="h-6 w-6 text-blue-400" />
              Platform Conversions
            </h1>
            <p className="text-slate-400 text-sm">
              Visualize how work flows through each platform with Sankey diagrams
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

        {/* Period Selector */}
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-400">Period</span>
            <select
              value={selectedPeriod ?? ""}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-44 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 text-sm"
            >
              {snapshots.map((s) => (
                <option key={s.snapshot_id} value={s.snapshot_id}>
                  {s.period} ({s.period_type})
                </option>
              ))}
            </select>
          </div>
          {selectedSnapshot && (
            <span className="text-slate-500 text-xs">
              {selectedSnapshot.edges.length} tracked flows (within-platform only)
            </span>
          )}
        </div>

        {selectedSnapshot ? (
          <div className="space-y-6">
            {/* Current Tracking Metrics */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-400" />
                Current Tracking Metrics
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Within-platform tracking data from your existing analytics
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    Total Actions
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {selectedSnapshot.edges
                      .reduce((sum, e) => sum + e.metrics.users_flowed, 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    User flows tracked this period
                  </p>
                </div>
                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
                  <p className="text-blue-400 text-xs uppercase tracking-wide mb-2">
                    Avg Click-Through
                  </p>
                  <p className="text-3xl font-bold text-blue-400">
                    {selectedSnapshot.edges.length > 0
                      ? (
                          (selectedSnapshot.edges.reduce(
                            (sum, e) => sum + e.metrics.click_through_rate,
                            0
                          ) /
                            selectedSnapshot.edges.length) *
                          100
                        ).toFixed(1)
                      : "0"}
                    %
                  </p>
                  <p className="text-blue-400/70 text-xs mt-2">
                    Average conversion rate
                  </p>
                </div>
                <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 relative">
                  <div className="absolute -top-3 left-4 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                    MISSING
                  </div>
                  <p className="text-amber-400 text-xs uppercase tracking-wide mb-2">
                    Cross-Platform
                  </p>
                  <p className="text-3xl font-bold text-amber-400">0%</p>
                  <p className="text-amber-400/70 text-xs mt-2">
                    Not yet enabled
                  </p>
                </div>
              </div>
            </div>

            {/* Current Limitation Banner */}
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-amber-200 font-medium text-sm">
                    Cross-Platform Synergy Not Yet Measurable
                  </p>
                  <p className="text-amber-200/70 text-sm mt-1">
                    Currently tracking within-platform flows only. We cannot yet prove that
                    multi-platform campaigns outperform single-platform campaigns.
                  </p>
                  <Link
                    href="/dashboard/ecosystem"
                    className="text-amber-400 text-sm mt-2 hover:underline inline-flex items-center gap-1"
                  >
                    See the opportunity <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sankey Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-4">
                Within-Platform User Flows
              </h2>
              <AttributionSankey edges={selectedSnapshot.edges} height={350} />
            </div>

            {/* Gap Opportunities */}
            {selectedSnapshot.insights.gap_opportunities.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
                <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  Tracking Blind Spots
                </h3>
                <div className="space-y-3">
                  {selectedSnapshot.insights.gap_opportunities.map((gap) => (
                    <div
                      key={gap.touchpoint_id}
                      className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white">
                          {gap.touchpoint_id.replace(/-/g, " ")}
                        </span>
                        <span className="text-xs font-medium text-amber-400">
                          {(gap.gap_score * 100).toFixed(0)}% blind
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {gap.recommended_action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-400">No tracking data available.</p>
        )}
      </div>
    </main>
  );
}
