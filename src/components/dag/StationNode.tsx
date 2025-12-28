"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type { StationNodeData } from "@/lib/dag/transforms";
import { computeStationRag, getRagDisplay } from "@/lib/rag/compute";

/**
 * Custom node component for stations in the service line DAG.
 * Displays station name, department, data source, and RAG status.
 */
function StationNodeComponent({ data, selected }: NodeProps<StationNodeData>) {
  // Calculate RAG status using the formal computation
  const computedRag = computeStationRag(data.metrics, data.rag_status);
  const ragDisplay = getRagDisplay(computedRag);

  return (
    <div
      className={`
        group relative min-w-[180px] rounded-lg border-2 bg-slate-900 shadow-xl
        transition-all duration-200
        ${selected 
          ? "border-emerald-500 shadow-emerald-500/20" 
          : "border-slate-700 hover:border-slate-600"
        }
      `}
    >
      {/* Input handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-slate-700 !bg-slate-500 group-hover:!border-emerald-500 group-hover:!bg-emerald-500"
      />

      {/* Header with RAG indicator */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
        <div className={`h-2.5 w-2.5 rounded-full ${ragDisplay.bgSolid}`} />
        <span className="font-semibold text-white text-sm truncate flex-1">
          {data.name}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 space-y-1.5">
        {/* Department badge */}
        {data.department && (
          <div className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {data.department}
          </div>
        )}

        {/* Metrics summary */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <div className="text-slate-500">Hours</div>
          <div className="text-slate-300 text-right">
            {data.metrics.fair_pricing.actual_hrs}/{data.metrics.fair_pricing.planned_hrs}
          </div>
          <div className="text-slate-500">Variance</div>
          <div className={`text-right ${
            data.metrics.fair_pricing.labor_variance > 0 
              ? "text-red-400" 
              : data.metrics.fair_pricing.labor_variance < 0 
                ? "text-emerald-400" 
                : "text-slate-300"
          }`}>
            {data.metrics.fair_pricing.labor_variance > 0 ? "+" : ""}
            {data.metrics.fair_pricing.labor_variance}h
          </div>
          <div className="text-slate-500">QA Score</div>
          <div className="text-slate-300 text-right">
            {data.metrics.world_class.internal_qa_score.toFixed(1)}
          </div>
        </div>

        {/* Data source indicator */}
        <div className="flex items-center justify-end gap-1 pt-1">
          <div className={`h-1.5 w-1.5 rounded-full ${
            data.data_source === "api" ? "bg-blue-500" : "bg-slate-600"
          }`} />
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            {data.data_source}
          </span>
        </div>
      </div>

      {/* Output handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-slate-700 !bg-slate-500 group-hover:!border-emerald-500 group-hover:!bg-emerald-500"
      />
    </div>
  );
}

export const StationNode = memo(StationNodeComponent);

