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
import { computeStationRag } from "@/lib/rag/compute";

interface VarianceChartProps {
  serviceLine: ServiceLine;
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

export function VarianceChart({ serviceLine }: VarianceChartProps) {
  const data = serviceLine.nodes.map((node) => {
    const rag = computeStationRag(node.metrics, node.rag_status);
    return {
      name: node.name,
      variance: node.metrics.fair_pricing.labor_variance,
      rag,
      fill: ragColor(rag),
    };
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Variance by Station</h3>
          <p className="text-xs text-slate-500">Labor variance (hours) colored by RAG</p>
        </div>
        <span className="text-xs text-slate-500">{serviceLine.name}</span>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 16 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1f2937", color: "#e2e8f0" }}
              labelStyle={{ color: "#e2e8f0" }}
            />
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

