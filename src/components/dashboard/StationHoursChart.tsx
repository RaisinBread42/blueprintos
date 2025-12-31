"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import type { StationSnapshot, ChangelogEvent } from "@/types";

interface StationHoursChartProps {
  snapshots: StationSnapshot[];
  stationId: string;
  events?: ChangelogEvent[];
  height?: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function StationHoursChart({
  snapshots,
  stationId,
  events = [],
  height = 200,
}: StationHoursChartProps) {
  // Transform data for this specific station
  const chartData = snapshots
    .slice()
    .reverse() // Oldest first for chronological order
    .map((snapshot) => {
      const station = snapshot.stations.find((s) => s.station_id === stationId);
      if (!station) return null;

      return {
        period: snapshot.period,
        displayDate: formatDate(snapshot.period),
        planned: station.metrics.fair_pricing.planned_hrs,
        actual: station.metrics.fair_pricing.actual_hrs,
      };
    })
    .filter(Boolean);

  // Filter events that affect this station and are within chart data range
  const relevantEvents = events.filter(
    (evt) =>
      evt.affected_stations.includes(stationId) &&
      chartData.some((d) => d?.period === evt.date)
  );

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="text-sm text-slate-500">
          No data for {stationId.replace(/_/g, " ")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">
          {stationId.replace(/_/g, " ")}
        </span>
        {relevantEvents.length > 0 && (
          <span className="text-[10px] text-rose-400">
            {relevantEvents.length} change{relevantEvents.length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={relevantEvents.length > 0 ? height - 24 : height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id={`planned-${stationId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`actual-${stationId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            axisLine={{ stroke: "#334155" }}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value) => [`${value} hrs`]}
          />
          <Legend
            wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
            iconType="square"
            iconSize={8}
            formatter={(value) => (
              <span className="text-slate-400">{value}</span>
            )}
          />
          {/* Event markers */}
          {relevantEvents.map((evt) => (
            <ReferenceLine
              key={evt.id}
              x={formatDate(evt.date)}
              stroke="#f43f5e"
              strokeDasharray="3 3"
              strokeWidth={2}
              label={{
                value: "●",
                position: "top",
                fill: "#f43f5e",
                fontSize: 12,
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="planned"
            name="Planned"
            stroke="#6366f1"
            strokeWidth={2}
            fill={`url(#planned-${stationId})`}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#10b981"
            strokeWidth={2}
            fill={`url(#actual-${stationId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
      {/* Event notes */}
      {relevantEvents.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {relevantEvents.map((evt) => (
            <div key={evt.id} className="flex items-center gap-1.5 text-[10px] text-rose-400">
              <span>●</span>
              <span className="text-slate-500">{formatDate(evt.date)}:</span>
              <span className="truncate">{evt.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
