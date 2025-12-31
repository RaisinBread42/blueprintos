"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { StationSnapshot } from "@/types";

type MetricType = "variance" | "qa_score" | "hours_saved";

interface WeeklyTrendChartProps {
  snapshots: StationSnapshot[];
  metric: MetricType;
  stationIds?: string[]; // If not provided, shows all stations
  height?: number;
  title?: string;
}

// Station colors for consistent display
const STATION_COLORS: Record<string, string> = {
  SALES_MKTG: "#3b82f6", // blue
  CONTENT_CREATIVE: "#10b981", // emerald
  MEDIA_BUY: "#f59e0b", // amber
  ACCOUNT_MGMT: "#8b5cf6", // violet
  OPS_PM: "#ec4899", // pink
};

function getStationColor(stationId: string): string {
  return STATION_COLORS[stationId] || "#64748b";
}

function getMetricValue(
  snapshot: StationSnapshot,
  stationId: string,
  metric: MetricType
): number | null {
  const station = snapshot.stations.find((s) => s.station_id === stationId);
  if (!station) return null;

  switch (metric) {
    case "variance":
      return station.metrics.fair_pricing.labor_variance;
    case "qa_score":
      return station.metrics.world_class.internal_qa_score;
    case "hours_saved":
      // Negative variance = hours saved
      return -station.metrics.fair_pricing.labor_variance;
    default:
      return null;
  }
}

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; domain?: [number, number] }> = {
  variance: { label: "Labor Variance", unit: "hrs" },
  qa_score: { label: "QA Score", unit: "", domain: [0, 10] },
  hours_saved: { label: "Hours Saved", unit: "hrs" },
};

export function WeeklyTrendChart({
  snapshots,
  metric,
  stationIds,
  height = 300,
  title,
}: WeeklyTrendChartProps) {
  // Sort snapshots chronologically
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => a.period.localeCompare(b.period)),
    [snapshots]
  );

  // Get all unique station IDs from snapshots
  const allStationIds = useMemo(() => {
    const ids = new Set<string>();
    sortedSnapshots.forEach((s) => s.stations.forEach((st) => ids.add(st.station_id)));
    return Array.from(ids);
  }, [sortedSnapshots]);

  const displayStationIds = stationIds || allStationIds;

  // Transform data for chart
  const chartData = useMemo(() => {
    return sortedSnapshots.map((snapshot) => {
      const point: Record<string, string | number | null> = {
        period: snapshot.period.replace("2024-", "").replace("2025-", ""),
      };
      displayStationIds.forEach((stationId) => {
        point[stationId] = getMetricValue(snapshot, stationId, metric);
      });
      return point;
    });
  }, [sortedSnapshots, displayStationIds, metric]);

  const config = METRIC_CONFIG[metric];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-500">{config.label} over time</p>
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="period"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              domain={config.domain}
              tickFormatter={(v) => `${v}${config.unit ? config.unit : ""}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value, name) => [
                `${value ?? 0}${config.unit}`,
                String(name ?? "").replace(/_/g, " "),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => <span className="text-slate-400">{value.replace(/_/g, " ")}</span>}
            />
            {metric === "variance" && (
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
            )}
            {metric === "qa_score" && (
              <ReferenceLine y={8} stroke="#6366f1" strokeDasharray="3 3" label={{ value: "Benchmark", fill: "#6366f1", fontSize: 10 }} />
            )}
            {displayStationIds.map((stationId) => (
              <Line
                key={stationId}
                type="monotone"
                dataKey={stationId}
                stroke={getStationColor(stationId)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
