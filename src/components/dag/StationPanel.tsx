"use client";

import { useState } from "react";
import { X, Pencil, Trash2, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { StationNodeData } from "@/lib/dag/transforms";
import type { StationMetrics, PerformanceProofMetrics } from "@/types";
import { computeStationRag, getRagDisplay } from "@/lib/rag/compute";

interface StationPanelProps {
  station: StationNodeData;
  onClose: () => void;
  onUpdate: (updates: Partial<StationNodeData>) => void;
  onDelete: () => void;
}

/**
 * Side panel for viewing and editing station details including all metrics.
 */
export function StationPanel({ station, onClose, onUpdate, onDelete }: StationPanelProps) {
  const { fair_pricing, world_class, performance_proof } = station.metrics;
  
  // State for new performance proof field
  const [newPerfKey, setNewPerfKey] = useState("");

  // Helper to update nested metrics
  const updateMetrics = (updates: Partial<StationMetrics>) => {
    onUpdate({
      metrics: {
        ...station.metrics,
        ...updates,
      },
    });
  };

  // Update fair pricing fields
  const updateFairPricing = (field: string, value: number | undefined) => {
    const newFairPricing = { ...fair_pricing, [field]: value };
    // Auto-compute labor_variance when hours change
    if (field === "planned_hrs" || field === "actual_hrs") {
      const planned = field === "planned_hrs" ? (value ?? 0) : fair_pricing.planned_hrs;
      const actual = field === "actual_hrs" ? (value ?? 0) : fair_pricing.actual_hrs;
      newFairPricing.labor_variance = actual - planned;
    }
    updateMetrics({ fair_pricing: newFairPricing });
  };

  // Update world class fields
  const updateWorldClass = (field: string, value: number | boolean | undefined) => {
    updateMetrics({
      world_class: { ...world_class, [field]: value },
    });
  };

  // Update performance proof fields
  const updatePerformanceProof = (key: string, value: string | number | undefined, isDelete = false) => {
    const newPerformanceProof: PerformanceProofMetrics = { ...performance_proof };
    if (isDelete || value === undefined) {
      delete newPerformanceProof[key];
    } else {
      newPerformanceProof[key] = value;
    }
    updateMetrics({ performance_proof: newPerformanceProof });
  };

  // Remove a performance proof field
  const removePerformanceProofField = (key: string) => {
    updatePerformanceProof(key, undefined, true);
  };

  // Add new performance proof field
  const addPerformanceProofField = () => {
    const snakeKey = newPerfKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (snakeKey && !performance_proof[snakeKey]) {
      // Add with empty string as placeholder - user will fill in
      const newPerformanceProof: PerformanceProofMetrics = { ...performance_proof, [snakeKey]: "" };
      updateMetrics({ performance_proof: newPerformanceProof });
      setNewPerfKey("");
    }
  };

  // Compute RAG status using the formal computation
  const computedRag = computeStationRag(station.metrics, station.rag_status);
  const rag = getRagDisplay(computedRag);

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
        {/* Station Info */}
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

        {/* Fair Pricing Metrics (EDITABLE) */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Fair Pricing
          </h3>
          <div className="space-y-3">
            {/* Planned Hours */}
            <div className="space-y-1.5">
              <Label htmlFor="planned-hrs" className="text-slate-400 text-xs">
                Planned Hours
              </Label>
              <Input
                id="planned-hrs"
                type="number"
                min={0}
                step={0.5}
                value={fair_pricing.planned_hrs}
                onChange={(e) => updateFairPricing("planned_hrs", parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Actual Hours */}
            <div className="space-y-1.5">
              <Label htmlFor="actual-hrs" className="text-slate-400 text-xs">
                Actual Hours
              </Label>
              <Input
                id="actual-hrs"
                type="number"
                min={0}
                step={0.5}
                value={fair_pricing.actual_hrs}
                onChange={(e) => updateFairPricing("actual_hrs", parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Labor Variance (computed, read-only) */}
            <div className="flex justify-between items-center py-2 px-3 bg-slate-900/50 rounded-md border border-slate-800">
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
                <span className="text-xs text-slate-500 ml-1">(auto)</span>
              </span>
            </div>

            {/* Market Value */}
            <div className="space-y-1.5">
              <Label htmlFor="market-value" className="text-slate-400 text-xs">
                Market Value ($)
              </Label>
              <Input
                id="market-value"
                type="number"
                min={0}
                step={100}
                value={fair_pricing.market_value ?? ""}
                onChange={(e) => updateFairPricing("market_value", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 3000"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </section>

        {/* World Class Metrics (EDITABLE) */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            World Class
          </h3>
          <div className="space-y-3">
            {/* QA Score */}
            <div className="space-y-1.5">
              <Label htmlFor="qa-score" className="text-slate-400 text-xs">
                Internal QA Score (0-10)
              </Label>
              <Input
                id="qa-score"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={world_class.internal_qa_score}
                onChange={(e) => updateWorldClass("internal_qa_score", parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Industry Benchmark */}
            <div className="space-y-1.5">
              <Label htmlFor="benchmark" className="text-slate-400 text-xs">
                Industry Benchmark
              </Label>
              <Input
                id="benchmark"
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={world_class.industry_benchmark ?? ""}
                onChange={(e) => updateWorldClass("industry_benchmark", e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="e.g., 7.5"
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
              />
            </div>

            {/* Standard Met Toggle */}
            <div className="space-y-1.5">
              <Label className="text-slate-400 text-xs">Standard Met</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateWorldClass("standard_met", true)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    world_class.standard_met
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateWorldClass("standard_met", false)}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    !world_class.standard_met
                      ? "bg-red-600 text-white"
                      : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Proof Metrics (EDITABLE with dynamic fields) */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Performance Proof
          </h3>
          <div className="space-y-3">
            {Object.entries(performance_proof).map(([key, value]) => {
              if (value === undefined) return null;
              const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`perf-${key}`} className="text-slate-400 text-xs">
                      {label}
                    </Label>
                    <button
                      onClick={() => removePerformanceProofField(key)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Remove field"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                  <Input
                    id={`perf-${key}`}
                    value={value}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Try to parse as number if it looks like one
                      const numVal = parseFloat(val);
                      const newValue = !isNaN(numVal) && val.trim() !== "" ? numVal : val;
                      updatePerformanceProof(key, newValue, false);
                    }}
                    className="bg-slate-900 border-slate-700 text-white focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                </div>
              );
            })}

            {/* Add new field */}
            <div className="pt-2 border-t border-slate-800">
              <Label className="text-slate-400 text-xs mb-1.5 block">Add New Metric</Label>
              <div className="flex gap-2">
                <Input
                  value={newPerfKey}
                  onChange={(e) => setNewPerfKey(e.target.value)}
                  placeholder="e.g., conversion_rate"
                  className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                  onKeyDown={(e) => e.key === "Enter" && addPerformanceProofField()}
                />
                <Button
                  onClick={addPerformanceProofField}
                  variant="outline"
                  size="icon"
                  className="border-slate-700 text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                  disabled={!newPerfKey.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with delete */}
      <div className="border-t border-slate-800 px-4 py-3 space-y-3">
        <Button
          onClick={onDelete}
          variant="ghost"
          className="w-full border border-slate-700/50 text-slate-400 bg-transparent hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Station
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Or press Delete/Backspace with station selected
        </p>
      </div>
    </div>
  );
}
