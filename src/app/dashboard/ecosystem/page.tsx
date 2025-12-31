"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  TrendingUp,
  Target,
  Zap,
  Gift,
  BarChart3,
  Lightbulb,
  X,
} from "lucide-react";
import type { JourneySnapshot } from "@/types";
import { AttributionSankey } from "@/components/dashboard/AttributionSankey";

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

export default function EcosystemPage() {
  const [idealSnapshot, setIdealSnapshot] = useState<JourneySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setIdealSnapshot(ideal ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load snapshots");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <p className="text-sm">Loading ecosystem data...</p>
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
              <TrendingUp className="h-6 w-6 text-violet-400" />
              Ecosystem Lift
            </h1>
            <p className="text-slate-400 text-sm">
              Map cross-platform customer journeys to understand synergies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRecommendations(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-violet-500/50 px-3 py-2 text-sm text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
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

        <div className="space-y-6">
          {/* Vision Banner */}
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-violet-200 font-medium text-sm">
                  The Ecosystem Advantage
                </p>
                <p className="text-violet-200/70 text-sm mt-1">
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
            <div className="rounded-xl border border-violet-500/30 bg-slate-900/60 p-6 shadow-lg">
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
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-6 py-3 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              Start Building Synergy Tracking
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4 z-10">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-violet-400" />
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
                    <code className="text-xs text-violet-400">{rec.example}</code>
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
