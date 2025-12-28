"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { ServiceLine } from "@/types";
import { computeStationRag, getRagDisplay } from "@/lib/rag/compute";

interface QADistributionChartProps {
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

export function QADistributionChart({
  serviceLine,
  height = 256,
  title = "QA Scores vs Benchmark",
}: QADistributionChartProps) {
  const benchmarks = serviceLine.nodes
    .map((n) => n.metrics.world_class.industry_benchmark)
    .filter((b): b is number => b !== undefined);
  const avgBenchmark = benchmarks.length
    ? benchmarks.reduce((a, b) => a + b, 0) / benchmarks.length
    : 7.5;

  const data = serviceLine.nodes.map((node) => {
    const rag = computeStationRag(node.metrics, node.rag_status);
    return {
      name: node.name,
      qa: node.metrics.world_class.internal_qa_score,
      benchmark: node.metrics.world_class.industry_benchmark ?? avgBenchmark,
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
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          <span>
            QA Score: <span className="text-slate-100">{entry.qa.toFixed(2)}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="inline-flex h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          <span>
            Benchmark: <span className="text-slate-100">{entry.benchmark.toFixed(2)}</span>
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
          <p className="text-xs text-slate-500">QA scores per station with benchmark reference</p>
        </div>
        <span className="text-xs text-slate-500">{serviceLine.name}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 16 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} domain={[0, 10]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="qa"
              stroke="#10b981"
              fillOpacity={0.25}
              fill="#10b981"
              activeDot={{ r: 5 }}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="#6366f1"
              fillOpacity={0.15}
              fill="#6366f1"
              activeDot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
          QA Score
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          Benchmark
        </span>
      </div>
    </div>
  );
}

