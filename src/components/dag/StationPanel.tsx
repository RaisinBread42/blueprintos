"use client";

import { X, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StationNodeData } from "@/lib/dag/transforms";

interface StationPanelProps {
  station: StationNodeData;
  onClose: () => void;
  onUpdate: (updates: Partial<StationNodeData>) => void;
}

/**
 * Side panel for viewing and editing station details.
 */
export function StationPanel({ station, onClose, onUpdate }: StationPanelProps) {
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
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-emerald-500" />
          <h2 className="text-lg font-semibold text-white">Edit Station</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Editable Station Info */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Station Info
          </h3>
          <div className="space-y-4">
            {/* Station ID (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Station ID</Label>
              <div className="text-sm text-slate-300 font-mono bg-slate-900 px-3 py-2 rounded-md border border-slate-800">
                {station.station_id}
              </div>
            </div>

            {/* Name (editable) */}
            <div className="space-y-1.5">
              <Label htmlFor="station-name" className="text-slate-400 text-xs">
                Name
              </Label>
              <Input
                id="station-name"
                value={station.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                className="bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Department (editable) */}
            <div className="space-y-1.5">
              <Label htmlFor="station-dept" className="text-slate-400 text-xs">
                Department
              </Label>
              <Input
                id="station-dept"
                value={station.department || ""}
                onChange={(e) => onUpdate({ department: e.target.value || undefined })}
                placeholder="e.g., Creative, Operations"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Data Source (editable) */}
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Data Source</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdate({ data_source: "mock" })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    station.data_source === "mock"
                      ? "bg-slate-700 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Mock
                </button>
                <button
                  onClick={() => onUpdate({ data_source: "api" })}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    station.data_source === "api"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  API
                </button>
              </div>
            </div>

            {/* Status (read-only, computed) */}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-slate-500">Computed Status</span>
              <span className={`text-sm px-2 py-0.5 rounded-full ${rag.bg} ${rag.color}`}>
                {rag.label}
              </span>
            </div>
          </div>
        </section>

        {/* Fair Pricing Metrics (read-only for now) */}
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

        {/* World Class Metrics (read-only for now) */}
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

        {/* Performance Proof Metrics (read-only for now) */}
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

      {/* Footer */}
      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-xs text-slate-500 text-center">
          Changes update the canvas in real-time
        </p>
      </div>
    </div>
  );
}
