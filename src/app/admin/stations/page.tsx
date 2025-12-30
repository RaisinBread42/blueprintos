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

  const refCounts = new Map<string, number>();
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
      refCounts.set(node.station_id, (refCounts.get(node.station_id) ?? 0) + 1);
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Station Catalog Health</h1>
            <p className="text-sm text-slate-400">
              Shared station definitions with references across service lines.
            </p>
          </div>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            ← Back to Editor
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">Stations in catalog</div>
            <div className="text-2xl font-semibold text-white">{stations.length}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">Service lines</div>
            <div className="text-2xl font-semibold text-white">{serviceLines.length}</div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="text-sm text-slate-400">Missing references</div>
            <div className="text-2xl font-semibold text-white">{missingRefs.length}</div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
            Station Usage Breakdown
          </div>
          <div className="divide-y divide-slate-800">
            {stations.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No stations in catalog.</div>
            )}
            {stations.map((st) => {
              const usage = stationUsage.get(st.station_id);
              const refs = usage?.refs ?? [];
              const actuals = refs.map((r) => r.actual);
              const totalActual = actuals.reduce((a, b) => a + b, 0);
              const min = actuals.length ? Math.min(...actuals) : 0;
              const max = actuals.length ? Math.max(...actuals) : 0;
              const avg = actuals.length ? totalActual / actuals.length : 0;
              return (
                <div key={`usage-${st.station_id}`} className="px-4 py-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{st.name}</div>
                      <div className="text-xs text-slate-400">
                        {st.station_id} · {st.department ?? "No dept"}
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 text-right">
                      <div>Refs: {refs.length} · Total: {totalActual.toFixed(1)} hrs</div>
                      <div>
                        Min/Avg/Max: {min.toFixed(1)} / {avg.toFixed(1)} / {max.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {refs.length === 0 ? (
                    <div className="text-xs text-slate-500">No service lines reference this station.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-slate-400">
                          <tr>
                            <th className="py-1 pr-4">Service line</th>
                            <th className="py-1 pr-4">Planned hrs</th>
                            <th className="py-1 pr-4">Actual hrs</th>
                            <th className="py-1 pr-4">% of Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-200">
                          {refs.map((r) => {
                            const pct = totalActual > 0 ? (r.actual / totalActual) * 100 : 0;
                            return (
                              <tr key={`${st.station_id}-${r.service_line_id}`}>
                                <td className="py-1 pr-4">{r.service_line_id}</td>
                                <td className="py-1 pr-4">{r.planned.toFixed(1)}</td>
                                <td className="py-1 pr-4">{r.actual.toFixed(1)}</td>
                                <td className="py-1 pr-4">
                                  <span className="inline-flex items-center gap-1">
                                    {pct.toFixed(1)}%
                                    <span
                                      className="inline-block h-1.5 rounded-full bg-emerald-500"
                                      style={{ width: `${Math.min(pct, 100) * 0.4}px` }}
                                    />
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

        <div className="rounded-lg border border-slate-800 bg-slate-900/70">
          <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
            Missing references
          </div>
          {missingRefs.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">None detected.</div>
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
      </div>
    </main>
  );
}

