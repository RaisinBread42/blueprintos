"use client";

import { X } from "lucide-react";
import type { StationNodeData } from "@/lib/dag/transforms";

interface StationPanelProps {
  station: StationNodeData;
  onClose: () => void;
}

/**
 * Side panel showing details of the selected station.
 * Read-only in Iteration 2; editing comes in Iteration 3.
 */
export function StationPanel({ station, onClose }: StationPanelProps) {
  const { fair_pricing, world_class, performance_proof } = station.metrics;

  // Compute RAG status
  const computedRag = (() => {
    if (station.rag_status) return station.rag_status;
    if (fair_pricing.labor_variance > 5 || !world_class.standard_met) return "red";
    if (fair_pricing.labor_variance > 2) return "amber";
    return "green";
  })();

  const ragLabels = {
    green: { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    amber: { label: "Warning", color: "text-amber-400", bg: "bg-amber-500/10" },
    red: { label: "Critical", color: "text-red-400", bg: "bg-red-500/10" },
  };

  const rag = ragLabels[computedRag];

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-lg font-semibold text-white truncate">{station.name}</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Station Info */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Station Info
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">ID</span>
              <span className="text-sm text-slate-200 font-mono">{station.station_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Department</span>
              <span className="text-sm text-slate-200">{station.department || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Data Source</span>
              <span className={`text-sm ${station.data_source === "api" ? "text-blue-400" : "text-slate-400"}`}>
                {station.data_source.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Status</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${rag.bg} ${rag.color}`}>
                {rag.label}
              </span>
            </div>
          </div>
        </section>

        {/* Fair Pricing Metrics */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Fair Pricing
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Planned Hours</span>
              <span className="text-sm text-slate-200">{fair_pricing.planned_hrs}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Actual Hours</span>
              <span className="text-sm text-slate-200">{fair_pricing.actual_hrs}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Labor Variance</span>
              <span className={`text-sm font-medium ${
                fair_pricing.labor_variance > 0 
                  ? "text-red-400" 
                  : fair_pricing.labor_variance < 0 
                    ? "text-emerald-400" 
                    : "text-slate-200"
              }`}>
                {fair_pricing.labor_variance > 0 ? "+" : ""}
                {fair_pricing.labor_variance}h
              </span>
            </div>
            {fair_pricing.market_value && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Market Value</span>
                <span className="text-sm text-slate-200">${fair_pricing.market_value.toLocaleString()}</span>
              </div>
            )}
          </div>
        </section>

        {/* World Class Metrics */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            World Class
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">QA Score</span>
              <span className="text-sm text-slate-200">{world_class.internal_qa_score.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Standard Met</span>
              <span className={`text-sm ${world_class.standard_met ? "text-emerald-400" : "text-red-400"}`}>
                {world_class.standard_met ? "Yes" : "No"}
              </span>
            </div>
            {world_class.industry_benchmark && (
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Benchmark</span>
                <span className="text-sm text-slate-200">{world_class.industry_benchmark}</span>
              </div>
            )}
          </div>
        </section>

        {/* Performance Proof Metrics */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Performance Proof
          </h3>
          <div className="space-y-2">
            {Object.entries(performance_proof).map(([key, value]) => {
              if (value === undefined) return null;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
              const displayValue = typeof value === "number" 
                ? value < 1 ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)
                : value;
              return (
                <div key={key} className="flex justify-between">
                  <span className="text-sm text-slate-400">{label}</span>
                  <span className="text-sm text-slate-200">{displayValue}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer hint */}
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-500 text-center">
          Click another station to switch, or click canvas to deselect
        </p>
      </div>
    </div>
  );
}

