"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ServiceLine } from "@/types";
import { computeStationRag, getRagDisplay } from "@/lib/rag/compute";

interface VarianceChartProps {
  serviceLine: ServiceLine;
  height?: number;
  title?: string;
}

const ragColor = (rag: string) => {
  switch (rag) {
    case "red":
      return "#ef4444";
    case "amber":
      return "#f59e0b";
    case "green":
    default:
      return "#10b981";
  }
};

export function VarianceChart({ serviceLine, height = 256, title = "Variance by Station" }: VarianceChartProps) {
  const data = serviceLine.nodes.map((node) => {
    const rag = computeStationRag(node.metrics, node.rag_status);
    return {
      name: node.name,
      variance: node.metrics.fair_pricing.labor_variance,
      rag,
      fill: ragColor(rag),
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const entry = payload[0].payload;
    const rag = getRagDisplay(entry.rag);
    return (
      <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 shadow-lg text-slate-200 text-sm">
        <div className="font-semibold text-white">{label}</div>
        <div className="text-slate-300">
          Variance: <span className={entry.variance > 0 ? "text-amber-300" : "text-emerald-300"}>
            {entry.variance > 0 ? "+" : ""}
            {entry.variance}h
          </span>
        </div>
        <div className="inline-flex items-center gap-1 text-xs mt-1 px-1.5 py-0.5 rounded-full bg-slate-800">
          <span className={`h-2 w-2 rounded-full ${rag.bgSolid}`} />
          <span className={rag.color}>{rag.label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-500">Labor variance (hours) colored by RAG</p>
        </div>
        <span className="text-xs text-slate-500">{serviceLine.name}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 16 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="variance" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

