"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, RefreshCw, Calendar } from "lucide-react";
import { StationHoursChart } from "@/components/dashboard/StationHoursChart";
import { StationQAChart } from "@/components/dashboard/StationQAChart";
import type { StationSnapshot, ChangelogEvent } from "@/types";

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TimeSavedPage() {
  const [allSnapshots, setAllSnapshots] = useState<StationSnapshot[]>([]);
  const [events, setEvents] = useState<ChangelogEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [snapshotsRes, changelogRes] = await Promise.all([
        fetch("/api/snapshots/stations"),
        fetch("/api/changelog"),
      ]);

      const snapshotsJson = await snapshotsRes.json();
      const changelogJson = await changelogRes.json();

      if (snapshotsJson.success) {
        setAllSnapshots(snapshotsJson.data);
        // Set default date range to all available data
        if (snapshotsJson.data.length > 0) {
          const periods = snapshotsJson.data.map((s: StationSnapshot) => s.period).sort();
          setDateRange({
            start: periods[0],
            end: periods[periods.length - 1],
          });
        }
      } else {
        setError(snapshotsJson.error || "Failed to load snapshots");
      }

      if (changelogJson.success) {
        setEvents(changelogJson.data.events || []);
      }
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter snapshots based on date range
  const snapshots = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return allSnapshots;
    return allSnapshots.filter(
      (s) => s.period >= dateRange.start && s.period <= dateRange.end
    );
  }, [allSnapshots, dateRange]);

  // Get available periods for the filter
  const availablePeriods = useMemo(() => {
    return allSnapshots.map((s) => s.period).sort();
  }, [allSnapshots]);

  // Get unique station IDs from latest snapshot
  const stationIds = useMemo(() => {
    if (snapshots.length === 0) return [];
    return snapshots[0].stations.map((s) => s.station_id);
  }, [snapshots]);

  // Get latest snapshot for KPI cards
  const latestSnapshot = snapshots[0];

  // Calculate date range display
  const dateRangeDisplay = useMemo(() => {
    if (snapshots.length === 0) return "No data";
    const sorted = snapshots.map((s) => s.period).sort();
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    if (start === end) return formatDate(start);
    return `${formatDate(start)} to ${formatDate(end)}`;
  }, [snapshots]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Time Saved</h1>
          <p className="text-sm text-slate-400">
            Hours saved across {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-sm text-slate-300 focus:outline-none"
            >
              {availablePeriods.map((period) => (
                <option key={period} value={period} className="bg-slate-800">
                  {formatDateShort(period)}
                </option>
              ))}
            </select>
            <span className="text-slate-500">to</span>
            <select
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-sm text-slate-300 focus:outline-none"
            >
              {availablePeriods.map((period) => (
                <option key={period} value={period} className="bg-slate-800">
                  {formatDateShort(period)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Date Range Display */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="h-3 w-3" />
        <span>Showing: {dateRangeDisplay}</span>
      </div>

      {/* KPI Summary Cards */}
      {latestSnapshot && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {latestSnapshot.stations.map((station) => {
            const variance = station.metrics.fair_pricing.labor_variance;
            const hoursSaved = variance < 0 ? Math.abs(variance) : 0;
            const hoursOver = variance > 0 ? variance : 0;
            const qa = station.metrics.world_class.internal_qa_score;
            return (
              <div
                key={station.station_id}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="text-xs text-slate-500">
                  {station.station_id.replace(/_/g, " ")}
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  {hoursSaved > 0 ? (
                    <>
                      <span className="text-lg font-bold text-emerald-400">
                        {hoursSaved}h
                      </span>
                      <span className="text-xs text-slate-500">saved</span>
                    </>
                  ) : hoursOver > 0 ? (
                    <>
                      <span className="text-lg font-bold text-red-400">
                        +{hoursOver}h
                      </span>
                      <span className="text-xs text-slate-500">over</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-300">
                        0h
                      </span>
                      <span className="text-xs text-slate-500">on target</span>
                    </>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-400">QA: {qa}/10</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Planned vs Actual Hours Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Planned vs Actual Hours</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stationIds.map((stationId) => (
            <StationHoursChart
              key={stationId}
              snapshots={snapshots}
              stationId={stationId}
              events={events}
              height={180}
            />
          ))}
        </div>
      </div>

      {/* QA Scores Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">QA Scores</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stationIds.map((stationId) => (
            <StationQAChart
              key={stationId}
              snapshots={snapshots}
              stationId={stationId}
              events={events}
              height={180}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
