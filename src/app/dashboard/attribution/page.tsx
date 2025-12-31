"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
  Eye,
  X,
  Zap,
  Gift,
  BarChart3,
  ArrowUpRight,
  PieChart,
} from "lucide-react";
import type { JourneySnapshot, GapOpportunity } from "@/types";
import { AttributionSankey } from "@/components/dashboard/AttributionSankey";
import { GapAnalysis } from "@/components/dashboard/GapAnalysis";
import { getMockGapOpportunities } from "@/lib/attribution/gaps";

type ViewTab = "current" | "ideal" | "gaps";

// Synergy-focused recommendations
const TRACKING_RECOMMENDATIONS = [
  {
    id: "utm",
    title: "UTM Parameters",
    description:
      "Add UTM tracking codes to all radio call-to-actions and digital links to measure cross-platform referrals.",
    example: "ecaytrade.ky?utm_source=x107&utm_medium=radio&utm_campaign=solar",
    effort: "Low",
    impact: "High",
    synergy: "Proves radio → marketplace conversion",
  },
  {
    id: "qr",
    title: "QR Codes in Print",
    description:
      "Unique QR codes in Caymanian Times print editions linking to eCayTrade with tracking.",
    example: "Print ad QR → ecaytrade.ky/deals?ref=ct-print-jan",
    effort: "Low",
    impact: "Medium",
    synergy: "Connects print readers to digital marketplace",
  },
  {
    id: "promo",
    title: "Channel-Specific Promo Codes",
    description:
      "Unique promo codes per channel (KISSFM10, CTREADER) to track which media drove the sale.",
    example: "Use code KISSFM10 for 10% off",
    effort: "Medium",
    impact: "High",
    synergy: "Attributes sales directly to media channel",
  },
  {
    id: "rewards",
    title: "Cross-Platform Rewards Program",
    description:
      "Unified loyalty program across all platforms. Earn points listening to radio, reading CT, shopping eCayTrade.",
    example: "Stingray Rewards - One account, all platforms",
    effort: "High",
    impact: "Very High",
    synergy: "Creates unified user ID + incentivizes multi-platform usage",
  },
  {
    id: "sso",
    title: "Single Sign-On Across Platforms",
    description:
      "One login for CT newsletter, eCayTrade account, and Stingray streaming. Ties all touchpoints to one user.",
    example: "Log in with your Stingray ID",
    effort: "High",
    impact: "Very High",
    synergy: "Complete user journey visibility",
  },
];

// Hypothetical lift data for the ideal state comparison
const SYNERGY_METRICS = {
  singlePlatform: {
    label: "Single Platform Only",
    conversionRate: 0.12,
    avgTouchpoints: 1.0,
    example: "User sees eCayTrade listing only",
  },
  multiPlatform: {
    label: "Multi-Platform Journey",
    conversionRate: 0.34,
    avgTouchpoints: 2.8,
    example: "Radio ad → CT article → eCayTrade purchase",
  },
  lift: 183, // percentage lift
  rewardsBoost: {
    label: "With Rewards Program",
    conversionRate: 0.52,
    avgTouchpoints: 4.2,
    example: "Rewards member engaged across all platforms",
  },
};

export default function AttributionDashboardPage() {
  const [snapshots, setSnapshots] = useState<JourneySnapshot[]>([]);
  const [idealSnapshot, setIdealSnapshot] = useState<JourneySnapshot | null>(null);
  const [gapOpportunities, setGapOpportunities] = useState<GapOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>("current");
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/attribution/snapshots");
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load snapshots");
        }

        const allSnapshots: JourneySnapshot[] = json.data;
        const ideal = allSnapshots.find((s) => s.snapshot_id === "ideal-scenario");
        const real = allSnapshots.filter((s) => s.snapshot_id !== "ideal-scenario");

        setSnapshots(real);
        setIdealSnapshot(ideal ?? null);
        setGapOpportunities(getMockGapOpportunities());

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
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading attribution data...</p>
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
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              Attribution & Synergy Dashboard
            </h1>
            <p className="text-slate-400 text-sm">
              Prove multi-platform ROI and cross-media synergy
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecommendations(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 px-3 py-2 text-sm text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
            >
              <Zap className="h-4 w-4" />
              Enable Synergy Tracking
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("current")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "current"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white"
            }`}
          >
            <Eye className="h-4 w-4" />
            Current State
          </button>
          <button
            onClick={() => setActiveTab("ideal")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "ideal"
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white"
            }`}
          >
            <Target className="h-4 w-4" />
            Ecosystem Vision
          </button>
          <button
            onClick={() => setActiveTab("gaps")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "gaps"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white"
            }`}
          >
            <PieChart className="h-4 w-4" />
            Gap Analysis
          </button>
        </div>

        {/* Current State View */}
        {activeTab === "current" && (
          <>
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
                    <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                      <p className="text-emerald-400 text-xs uppercase tracking-wide mb-2">
                        Avg Click-Through
                      </p>
                      <p className="text-3xl font-bold text-emerald-400">
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
                      <p className="text-emerald-400/70 text-xs mt-2">
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
                      <button
                        onClick={() => setActiveTab("ideal")}
                        className="text-amber-400 text-sm mt-2 hover:underline inline-flex items-center gap-1"
                      >
                        See the opportunity <ArrowUpRight className="h-3 w-3" />
                      </button>
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
          </>
        )}

        {/* Ecosystem Vision View */}
        {activeTab === "ideal" && (
          <div className="space-y-6">
            {/* Vision Banner */}
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-blue-200 font-medium text-sm">
                    The Ecosystem Advantage
                  </p>
                  <p className="text-blue-200/70 text-sm mt-1">
                    When users engage across Radio + News + Marketplace, conversion rates
                    multiply. This is the synergy story we need to prove and sell.
                  </p>
                </div>
              </div>
            </div>

            {/* Synergy Lift Comparison */}
            <div className="rounded-xl border border-emerald-500/30 bg-slate-900/60 p-6 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                Multi-Platform Synergy Lift
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Projected conversion rates with full cross-platform tracking
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Single Platform */}
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">
                    {SYNERGY_METRICS.singlePlatform.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-300">
                    {(SYNERGY_METRICS.singlePlatform.conversionRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    {SYNERGY_METRICS.singlePlatform.example}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span>Avg {SYNERGY_METRICS.singlePlatform.avgTouchpoints} touchpoint</span>
                  </div>
                </div>

                {/* Multi-Platform */}
                <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 relative">
                  <div className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                    +{SYNERGY_METRICS.lift}% LIFT
                  </div>
                  <p className="text-emerald-400 text-xs uppercase tracking-wide mb-2">
                    {SYNERGY_METRICS.multiPlatform.label}
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {(SYNERGY_METRICS.multiPlatform.conversionRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-emerald-400/70 text-xs mt-2">
                    {SYNERGY_METRICS.multiPlatform.example}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400/70">
                    <span>Avg {SYNERGY_METRICS.multiPlatform.avgTouchpoints} touchpoints</span>
                  </div>
                </div>

                {/* With Rewards */}
                <div className="rounded-lg border border-purple-500/50 bg-purple-500/10 p-4 relative">
                  <div className="absolute -top-3 left-4 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Gift className="h-3 w-3" /> REWARDS
                  </div>
                  <p className="text-purple-400 text-xs uppercase tracking-wide mb-2">
                    {SYNERGY_METRICS.rewardsBoost.label}
                  </p>
                  <p className="text-3xl font-bold text-purple-400">
                    {(SYNERGY_METRICS.rewardsBoost.conversionRate * 100).toFixed(0)}%
                  </p>
                  <p className="text-purple-400/70 text-xs mt-2">
                    {SYNERGY_METRICS.rewardsBoost.example}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-400/70">
                    <span>Avg {SYNERGY_METRICS.rewardsBoost.avgTouchpoints} touchpoints</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ideal State Sankey */}
            {idealSnapshot && (
              <div className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-6 shadow-lg">
                <h2 className="text-lg font-medium text-white mb-4">
                  Cross-Platform User Journey (Goal)
                </h2>
                <AttributionSankey edges={idealSnapshot.edges} height={400} />
              </div>
            )}

            {/* Bundle Value Proposition */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                The Bundle Advantage
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <p className="text-emerald-400 font-medium text-sm">
                    Prove Radio Drives Commerce
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Show advertisers that X107/Kiss FM listeners who then search eCayTrade
                    convert at 3x the rate of organic visitors.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <p className="text-emerald-400 font-medium text-sm">
                    Content + Commerce Synergy
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Caymanian Times readers who click through to eCayTrade spend 2.5x more
                    than direct visitors. Editorial trust converts.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <p className="text-emerald-400 font-medium text-sm">
                    Premium Bundle Pricing
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Data-backed justification for charging premium rates on cross-platform
                    ad packages. The whole is worth more than the parts.
                  </p>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <p className="text-emerald-400 font-medium text-sm">
                    Competitive Moat
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    No competitor can offer radio + news + marketplace reach with proven
                    synergy. This is unique to the Stingray ecosystem.
                  </p>
                </div>
              </div>
            </div>

            {/* Rewards Program Teaser */}
            <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-purple-500/20 p-3">
                  <Gift className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Coming Soon: Stingray Rewards
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    A unified loyalty program that incentivizes cross-platform engagement
                    and provides the tracking backbone for synergy measurement.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3 text-sm">
                    <div className="flex items-center gap-2 text-purple-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      Earn points across all platforms
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      Unified user identity
                    </div>
                    <div className="flex items-center gap-2 text-purple-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      Redeem for deals on eCayTrade
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => setShowRecommendations(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Lightbulb className="h-4 w-4" />
                Start Building Synergy Tracking
              </button>
            </div>
          </div>
        )}

        {/* Gap Analysis View */}
        {activeTab === "gaps" && (
          <div className="space-y-6">
            {/* Demand vs Supply Overview */}
            <div className="rounded-xl border border-purple-500/30 bg-slate-900/60 p-6 shadow-lg">
              <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-400" />
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
              <button
                onClick={() => setActiveTab("ideal")}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Target className="h-4 w-4" />
                See Multi-Platform Strategy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4 z-10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                Enable Cross-Platform Synergy
              </h2>
              <button
                onClick={() => setShowRecommendations(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-400 text-sm mb-6">
                Implement these tracking improvements to measure and prove multi-platform
                synergy. Start with low-effort, high-impact items.
              </p>
              {TRACKING_RECOMMENDATIONS.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-medium">{rec.title}</h3>
                    <div className="flex gap-2 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          rec.effort === "Low"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : rec.effort === "Medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {rec.effort} Effort
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          rec.impact === "Very High"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : rec.impact === "High"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-500/20 text-slate-400"
                        }`}
                      >
                        {rec.impact} Impact
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm">{rec.description}</p>
                  <div className="mt-3 rounded bg-slate-900/50 px-3 py-2">
                    <p className="text-xs text-slate-500 mb-1">Example:</p>
                    <code className="text-xs text-emerald-400">{rec.example}</code>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <p className="text-xs text-amber-400">{rec.synergy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
