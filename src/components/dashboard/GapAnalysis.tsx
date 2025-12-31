"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Target,
  DollarSign,
  Package,
  Search,
} from "lucide-react";
import type { GapOpportunity } from "@/types";
import { categorizeGaps, totalRevenuePotential } from "@/lib/attribution/gaps";

interface GapAnalysisProps {
  gaps: GapOpportunity[];
  showRevenue?: boolean;
}

function TrendIcon({ trend }: { trend?: "rising" | "stable" | "falling" }) {
  if (trend === "rising") {
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (trend === "falling") {
    return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  }
  return <Minus className="h-3.5 w-3.5 text-slate-500" />;
}

function GapScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-slate-500/20 text-slate-400";
  let label = "Low";

  if (score >= 0.8) {
    colorClass = "bg-red-500/20 text-red-400";
    label = "Critical";
  } else if (score >= 0.6) {
    colorClass = "bg-amber-500/20 text-amber-400";
    label = "High";
  } else if (score >= 0.3) {
    colorClass = "bg-blue-500/20 text-blue-400";
    label = "Moderate";
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${colorClass}`}>
      {label} ({(score * 100).toFixed(0)}%)
    </span>
  );
}

function GapCard({ gap }: { gap: GapOpportunity }) {
  const demandSupplyRatio =
    gap.supply_count > 0
      ? (gap.search_demand / gap.supply_count).toFixed(1)
      : "∞";

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white">{gap.category}</h4>
          <TrendIcon trend={gap.trend} />
        </div>
        <GapScoreBadge score={gap.gap_score} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Search className="h-3 w-3" />
            <span className="text-xs">Demand</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {gap.search_demand.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Package className="h-3 w-3" />
            <span className="text-xs">Supply</span>
          </div>
          <p className="text-lg font-semibold text-white">
            {gap.supply_count.toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
            <Target className="h-3 w-3" />
            <span className="text-xs">Ratio</span>
          </div>
          <p className="text-lg font-semibold text-emerald-400">
            {demandSupplyRatio}:1
          </p>
        </div>
      </div>

      {gap.revenue_potential && gap.revenue_potential > 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
          <DollarSign className="h-3 w-3" />
          <span>
            Est. monthly potential: ${gap.revenue_potential.toLocaleString()}
          </span>
        </div>
      )}

      <p className="text-xs text-slate-400">{gap.recommended_action}</p>
    </div>
  );
}

export function GapAnalysis({ gaps, showRevenue = true }: GapAnalysisProps) {
  const categorized = useMemo(() => categorizeGaps(gaps), [gaps]);
  const totalPotential = useMemo(() => totalRevenuePotential(gaps), [gaps]);

  const criticalCount = categorized.critical.length;
  const highCount = categorized.high.length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-xs text-red-400/70">Critical Gaps</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-center">
          <p className="text-2xl font-bold text-amber-400">{highCount}</p>
          <p className="text-xs text-amber-400/70">High Priority</p>
        </div>
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">
            {categorized.moderate.length}
          </p>
          <p className="text-xs text-blue-400/70">Moderate</p>
        </div>
        {showRevenue && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              ${(totalPotential / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-emerald-400/70">Monthly Potential</p>
          </div>
        )}
      </div>

      {/* Critical Gaps */}
      {criticalCount > 0 && (
        <div>
          <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Critical Gaps - Immediate Action Required
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {categorized.critical.map((gap) => (
              <GapCard key={gap.touchpoint_id} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* High Priority Gaps */}
      {highCount > 0 && (
        <div>
          <h3 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            High Priority Opportunities
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {categorized.high.map((gap) => (
              <GapCard key={gap.touchpoint_id} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Moderate Gaps (collapsible or limited) */}
      {categorized.moderate.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-blue-400 mb-2">
            Moderate Gaps ({categorized.moderate.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categorized.moderate.slice(0, 6).map((gap) => (
              <GapCard key={gap.touchpoint_id} gap={gap} />
            ))}
          </div>
        </div>
      )}

      {/* Well Supplied (summary only) */}
      {categorized.low.length > 0 && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
          <p className="text-sm text-slate-400">
            <span className="text-emerald-400 font-medium">
              {categorized.low.length} categories
            </span>{" "}
            are well-supplied:{" "}
            {categorized.low.map((g) => g.category).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
