"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { StationSnapshot } from "@/types";

interface MonthlySavingsChartProps {
  snapshots: StationSnapshot[];
  hourlyRate?: number;
  height?: number;
  title?: string;
  showCost?: boolean; // Toggle between hours and cost display
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

interface SavingsData {
  station_id: string;
  station_name: string;
  hours_saved: number;
  cost_saved: number;
}

export function MonthlySavingsChart({
  snapshots,
  hourlyRate = 50,
  height = 300,
  title,
  showCost = false,
}: MonthlySavingsChartProps) {
  // Aggregate savings across all snapshots by station
  const savingsData = useMemo(() => {
    const stationMap = new Map<string, SavingsData>();

    snapshots.forEach((snapshot) => {
      snapshot.stations.forEach((station) => {
        const variance = station.metrics.fair_pricing.labor_variance;
        // Negative variance = hours saved
        const hoursSaved = variance < 0 ? Math.abs(variance) : 0;

        const existing = stationMap.get(station.station_id);
        if (existing) {
          existing.hours_saved += hoursSaved;
          existing.cost_saved = existing.hours_saved * hourlyRate;
        } else {
          stationMap.set(station.station_id, {
            station_id: station.station_id,
            station_name: station.station_id.replace(/_/g, " "),
            hours_saved: hoursSaved,
            cost_saved: hoursSaved * hourlyRate,
          });
        }
      });
    });

    return Array.from(stationMap.values()).sort((a, b) => b.hours_saved - a.hours_saved);
  }, [snapshots, hourlyRate]);

  // Calculate totals
  const totals = useMemo(() => {
    return savingsData.reduce(
      (acc, s) => ({
        hours: acc.hours + s.hours_saved,
        cost: acc.cost + s.cost_saved,
      }),
      { hours: 0, cost: 0 }
    );
  }, [savingsData]);

  const dataKey = showCost ? "cost_saved" : "hours_saved";
  const formatValue = (v: number) =>
    showCost ? `$${v.toLocaleString()}` : `${v} hrs`;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-slate-500">
              {showCost ? "Cost savings" : "Hours saved"} across {snapshots.length} week(s)
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">
              {showCost ? `$${totals.cost.toLocaleString()}` : `${totals.hours} hrs`}
            </div>
            <div className="text-xs text-slate-500">Total Saved</div>
          </div>
        </div>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={savingsData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              tickFormatter={(v) => (showCost ? `$${v}` : `${v}`)}
            />
            <YAxis
              type="category"
              dataKey="station_name"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              width={75}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #334155",
                borderRadius: "0.5rem",
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value) => [formatValue((value as number) ?? 0), showCost ? "Cost Saved" : "Hours Saved"]}
            />
            <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
              {savingsData.map((entry) => (
                <Cell key={entry.station_id} fill={getStationColor(entry.station_id)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
        {savingsData.map((s) => (
          <span key={s.station_id} className="inline-flex items-center gap-1 text-slate-400">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getStationColor(s.station_id) }}
            />
            {s.station_name}
          </span>
        ))}
      </div>
    </div>
  );
}
