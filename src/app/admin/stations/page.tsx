import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";

import type { Station } from "@/types";
import { listStationIds, readStation } from "@/lib/storage/stations";
import { listServiceLineIds, readServiceLine } from "@/lib/storage/serviceLines";
import { applyScenarioToMetrics, defaultScenarioConfig, type ScenarioConfig } from "@/lib/scenario/apply";

interface MissingRef {
  service_line_id: string;
  station_id: string;
}

interface StationStats {
  station: Station;
  refs: { service_line_id: string; planned: number; actual: number }[];
  totalPlanned: number;
  totalActual: number;
  totalContribution: number;
  contributionPct: number;
  health: "green" | "amber" | "red";
  flags: string[];
  min: number;
  max: number;
  avg: number;
  varianceRatio: number;
}

function getHealth(contributionPct: number): "green" | "amber" | "red" {
  if (contributionPct > 15) return "red";
  if (contributionPct > 5) return "amber";
  return "green";
}

function getHealthColor(health: "green" | "amber" | "red"): string {
  switch (health) {
    case "red": return "bg-red-500";
    case "amber": return "bg-amber-500";
    case "green": return "bg-emerald-500";
  }
}

export default async function StationsAdminPage() {
  const stationIds = await listStationIds();
  const stations: Station[] = (
    await Promise.all(stationIds.map(async (id) => readStation(id)))
  ).filter(Boolean) as Station[];

  const stationMap = new Map(stations.map((s) => [s.station_id, s]));

  const serviceLineIds = await listServiceLineIds();
  const serviceLines = (
    await Promise.all(serviceLineIds.map(async (id) => readServiceLine(id)))
  ).filter((sl): sl is NonNullable<typeof sl> => Boolean(sl));

  const missingRefs: MissingRef[] = [];
  const scenarioMap = new Map<string, ScenarioConfig>();

  // Load scenarios for each service line (default to zero overlay)
  const scenarioDir = path.join(process.cwd(), "data", "scenarios");
  async function readScenarioConfig(id: string): Promise<ScenarioConfig> {
    try {
      const file = path.join(scenarioDir, `${id}.json`);
      const raw = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(raw) as { scenarios?: Record<string, ScenarioConfig | { laborDelta: number; timeDelta: number; qualityDelta: number }> };
      if (!parsed.scenarios) return defaultScenarioConfig;
      const names = Object.keys(parsed.scenarios);
      const pick =
        parsed.scenarios["default"] ??
        (names.length > 0 ? parsed.scenarios[names[0]] : undefined);
      if (!pick) return defaultScenarioConfig;
      if ((pick as ScenarioConfig).global) {
        const cfg = pick as ScenarioConfig;
        return {
          global: {
            laborDelta: cfg.global?.laborDelta ?? 0,
            timeDelta: cfg.global?.timeDelta ?? 0,
            qualityDelta: cfg.global?.qualityDelta ?? 0,
          },
          byStation: Object.fromEntries(
            Object.entries(cfg.byStation ?? {}).map(([k, v]) => [
              k,
              {
                laborDelta: v.laborDelta ?? 0,
                timeDelta: v.timeDelta ?? 0,
                qualityDelta: v.qualityDelta ?? 0,
              },
            ])
          ),
        };
      }
      const legacy = pick as { laborDelta?: number; timeDelta?: number; qualityDelta?: number };
      return {
        global: {
          laborDelta: legacy.laborDelta ?? 0,
          timeDelta: legacy.timeDelta ?? 0,
          qualityDelta: legacy.qualityDelta ?? 0,
        },
        byStation: {},
      };
    } catch {
      return defaultScenarioConfig;
    }
  }

  for (const sl of serviceLines) {
    scenarioMap.set(sl.service_line_id, await readScenarioConfig(sl.service_line_id));
  }

  const stationUsage = new Map<
    string,
    {
      base: Station | undefined;
      refs: { service_line_id: string; planned: number; actual: number }[];
    }
  >();

  serviceLines.forEach((sl) => {
    const sc = scenarioMap.get(sl.service_line_id) ?? defaultScenarioConfig;
    sl.nodes.forEach((node) => {
      if (!stationMap.has(node.station_id) || node.missing) {
        missingRefs.push({ service_line_id: sl.service_line_id, station_id: node.station_id });
      }
      const base = stationMap.get(node.station_id);
      const metrics = base ? applyScenarioToMetrics(base.metrics, sc, node.station_id) : node.metrics;
      const planned = metrics.fair_pricing.planned_hrs;
      const actual = metrics.fair_pricing.actual_hrs;
      if (!stationUsage.has(node.station_id)) {
        stationUsage.set(node.station_id, { base, refs: [] });
      }
      stationUsage.get(node.station_id)?.refs.push({
        service_line_id: sl.service_line_id,
        planned,
        actual,
      });
    });
  });

  // Compute per-station stats
  const stationStats: StationStats[] = stations.map((st) => {
    const usage = stationUsage.get(st.station_id);
    const refs = usage?.refs ?? [];
    const actuals = refs.map((r) => r.actual);
    const planneds = refs.map((r) => r.planned);

    const totalActual = actuals.reduce((a, b) => a + b, 0);
    const totalPlanned = planneds.reduce((a, b) => a + b, 0);
    const totalContribution = totalActual - totalPlanned;
    const contributionPct = totalPlanned > 0 ? (totalContribution / totalPlanned) * 100 : 0;

    const min = actuals.length ? Math.min(...actuals) : 0;
    const max = actuals.length ? Math.max(...actuals) : 0;
    const avg = actuals.length ? totalActual / actuals.length : 0;
    const varianceRatio = avg > 0 ? (max - min) / avg : 0;

    const flags: string[] = [];
    if (refs.length === 1) flags.push("single-use");
    if (contributionPct > 20) flags.push("over-20");
    if (varianceRatio > 0.5) flags.push("high-variance");

    return {
      station: st,
      refs,
      totalPlanned,
      totalActual,
      totalContribution,
      contributionPct,
      health: getHealth(contributionPct),
      flags,
      min,
      max,
      avg,
      varianceRatio,
    };
  });

  // Sort by worst offenders (highest contribution % first)
  stationStats.sort((a, b) => b.contributionPct - a.contributionPct);

  // Aggregate stats
  const grandTotalPlanned = stationStats.reduce((sum, s) => sum + s.totalPlanned, 0);
  const grandTotalActual = stationStats.reduce((sum, s) => sum + s.totalActual, 0);
  const grandNetContribution = grandTotalActual - grandTotalPlanned;
  const stationsOverBudget = stationStats.filter((s) => s.totalContribution > 0).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Station Allocation Overview</h1>
            <p className="text-sm text-slate-400">
              Monitor hour allocation and usage per station. Spot anomalies before they become problems.
            </p>
          </div>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            ← Back to Editor
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400" title="Sum of planned hours across all station usages">
              Total Planned
            </div>
            <div className="text-2xl font-semibold text-white">{grandTotalPlanned.toFixed(0)} hrs</div>
            <div className="text-xs text-slate-500 mt-1">Baseline budget</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400" title="Sum of actual hours across all station usages">
              Total Actual
            </div>
            <div className="text-2xl font-semibold text-white">{grandTotalActual.toFixed(0)} hrs</div>
            <div className="text-xs text-slate-500 mt-1">Hours spent</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400" title="Total actual minus total planned">
              Net Contribution
            </div>
            <div className={`text-2xl font-semibold ${grandNetContribution === 0 ? "text-white" : grandNetContribution > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {grandNetContribution >= 0 ? "+" : ""}{grandNetContribution.toFixed(0)} hrs
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {grandNetContribution > 0 ? "Over budget" : grandNetContribution < 0 ? "Under budget" : "On target"}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400" title="Stations where actual exceeds planned hours">
              Over Budget
            </div>
            <div className={`text-2xl font-semibold ${stationsOverBudget > 0 ? "text-amber-400" : "text-emerald-400"}`}>
              {stationsOverBudget} / {stations.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Stations needing review</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 bg-slate-900/50 rounded-lg px-4 py-3 border border-slate-800">
          <span className="font-medium text-slate-300">Health indicators:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Green: ≤5% over
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Amber: 5-15% over
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Red: &gt;15% over
          </span>
          <span className="border-l border-slate-700 pl-4 ml-2">
            Sorted by worst contribution first
          </span>
        </div>

        {/* Station Breakdown */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Station Usage Breakdown</div>
              <div className="text-xs text-slate-500">Stations sorted by highest over-budget contribution</div>
            </div>
            <div className="text-xs text-slate-400">{stations.length} stations</div>
          </div>
          <div className="divide-y divide-slate-800">
            {stationStats.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No stations in catalog.</div>
            )}
            {stationStats.map((stat) => {
              const { station: st, refs, totalPlanned, totalActual, totalContribution, contributionPct, health, flags, min, max, avg, varianceRatio } = stat;
              return (
                <div key={`usage-${st.station_id}`} className="px-4 py-4 text-sm space-y-3">
                  {/* Station Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Health Indicator */}
                      <div
                        className={`w-3 h-3 rounded-full ${getHealthColor(health)} shrink-0`}
                        title={`${contributionPct.toFixed(1)}% over planned`}
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {st.name}
                          {/* Flags */}
                          {flags.includes("single-use") && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300"
                              title="Only used by one service line - potential fragility"
                            >
                              Single use
                            </span>
                          )}
                          {flags.includes("over-20") && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/50 text-red-300"
                              title="More than 20% over planned hours - needs attention"
                            >
                              &gt;20% over
                            </span>
                          )}
                          {flags.includes("high-variance") && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300"
                              title="Large difference between min and max usage - inconsistent allocation"
                            >
                              High variance
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {st.station_id} · {st.department ?? "No dept"}
                        </div>
                      </div>
                    </div>

                    {/* Station Totals */}
                    <div className="text-xs text-right space-y-1 shrink-0">
                      <div className="text-slate-300">
                        <span title="Total planned hours across all service lines">Planned: {totalPlanned.toFixed(1)}</span>
                        {" · "}
                        <span title="Total actual hours across all service lines">Actual: {totalActual.toFixed(1)}</span>
                        {" · "}
                        <span
                          className={`font-medium ${totalContribution === 0 ? "text-white" : totalContribution > 0 ? "text-amber-400" : "text-emerald-400"}`}
                          title="Net contribution (actual - planned)"
                        >
                          {totalContribution >= 0 ? "+" : ""}{totalContribution.toFixed(1)} hrs ({contributionPct >= 0 ? "+" : ""}{contributionPct.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="text-slate-500">
                        <span title="Usage statistics across service lines">
                          {refs.length} service line{refs.length !== 1 ? "s" : ""}
                          {refs.length > 1 && ` · Min: ${min.toFixed(1)} / Avg: ${avg.toFixed(1)} / Max: ${max.toFixed(1)}`}
                          {varianceRatio > 0.3 && refs.length > 1 && (
                            <span className="text-amber-400" title="Variance ratio: (max-min)/avg - high values indicate inconsistent usage"> · VR: {varianceRatio.toFixed(2)}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Usage Table */}
                  {refs.length === 0 ? (
                    <div className="text-xs text-slate-500">No service lines reference this station.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left table-fixed">
                        <thead className="text-slate-400">
                          <tr>
                            <th className="py-1 pr-4 w-48">Service line</th>
                            <th className="py-1 pr-4 w-24">Planned hrs</th>
                            <th className="py-1 pr-4 w-24">Actual hrs</th>
                            <th className="py-1 pr-4 w-28">Contribution</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-200">
                          {refs.map((r) => {
                            const pct = r.planned > 0 ? (r.actual / r.planned) * 100 : 100;
                            const pctOver = pct - 100;
                            const pctHealth = pctOver > 15 ? "red" : pctOver > 5 ? "amber" : "green";
                            const pctColor = pctHealth === "red" ? "text-red-400" : pctHealth === "amber" ? "text-amber-400" : "text-emerald-400";
                            return (
                              <tr key={`${st.station_id}-${r.service_line_id}`}>
                                <td className="py-1 pr-4 w-48 truncate">{r.service_line_id}</td>
                                <td className="py-1 pr-4 w-24">{r.planned.toFixed(1)}</td>
                                <td className="py-1 pr-4 w-24">{r.actual.toFixed(1)}</td>
                                <td className="py-1 pr-4 w-28">
                                  <span className={pct === 100 ? "text-white" : pctColor}>
                                    {pct.toFixed(0)}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing References */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3">
            <div className="text-sm font-semibold text-white">Missing References</div>
            <div className="text-xs text-slate-500">Stations referenced by service lines but not found in catalog</div>
          </div>
          {missingRefs.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">None detected — all references are valid.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {missingRefs.map((m, idx) => (
                <div key={`${m.service_line_id}-${m.station_id}-${idx}`} className="px-4 py-3 text-sm">
                  <div className="text-white">{m.station_id}</div>
                  <div className="text-xs text-slate-400">Referenced by {m.service_line_id}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer disclaimer */}
        <div className="text-xs text-slate-500 text-center">
          Data reflects current catalog state with scenario overlays applied. Contribution = Actual ÷ Planned × 100%.
        </div>
      </div>
    </main>
  );
}
