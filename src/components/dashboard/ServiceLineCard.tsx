"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ServiceLine } from "@/types";
import { computeServiceLineRollup } from "@/lib/rag/rollup";
import { getRagDisplay } from "@/lib/rag/compute";

interface ServiceLineCardProps {
  serviceLine: ServiceLine;
}

export function ServiceLineCard({ serviceLine }: ServiceLineCardProps) {
  const rollup = computeServiceLineRollup(serviceLine);
  const rag = getRagDisplay(rollup.overall_rag);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg transition-colors hover:border-emerald-500/50 hover:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{serviceLine.name}</h3>
          <p className="text-xs text-slate-500">{serviceLine.service_line_id}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${rag.bg} ${rag.color}`}>
          <span className={`h-2 w-2 rounded-full ${rag.bgSolid}`} />
          {rag.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-slate-500">Hours</div>
          <div className="text-slate-200 font-medium">
            {Math.round(rollup.total_planned_hrs * 10) / 10}h planned
          </div>
          <div className="text-slate-200">
            {Math.round(rollup.total_actual_hrs * 10) / 10}h actual (
            <span className={rollup.variance_pct > 0 ? "text-amber-300" : "text-emerald-300"}>
              {rollup.variance_pct > 0 ? "+" : ""}
              {Math.round(rollup.variance_pct * 10) / 10}%
            </span>
            )
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-slate-500">Quality</div>
          <div className="text-slate-200">Avg QA: {rollup.avg_qa_score.toFixed(2)}</div>
          <div className="text-slate-200">Standard: {rollup.stations_at_standard}/{rollup.total_stations}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-emerald-400">
        <Link
          href={`/editor?id=${encodeURIComponent(serviceLine.service_line_id)}`}
          className="inline-flex items-center gap-2 hover:text-emerald-300 transition-colors"
        >
          Open Editor
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

