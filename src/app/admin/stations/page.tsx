import Link from "next/link";

import type { Station } from "@/types";
import { listStationIds, readStation } from "@/lib/storage/stations";
import { listServiceLineIds, readServiceLine } from "@/lib/storage/serviceLines";

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

  serviceLines.forEach((sl) => {
    sl.nodes.forEach((node) => {
      refCounts.set(node.station_id, (refCounts.get(node.station_id) ?? 0) + 1);
      if (!stationMap.has(node.station_id) || node.missing) {
        missingRefs.push({ service_line_id: sl.service_line_id, station_id: node.station_id });
      }
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
            Catalog
          </div>
          <div className="divide-y divide-slate-800">
            {stations.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No stations in catalog.</div>
            )}
            {stations.map((st) => {
              const refs = refCounts.get(st.station_id) ?? 0;
              return (
                <div key={st.station_id} className="px-4 py-3 text-sm flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white">{st.name}</div>
                    <div className="text-xs text-slate-400">
                      {st.station_id} · {st.department ?? "No dept"} · {st.data_source}
                    </div>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="rounded-full bg-slate-800 px-2 py-1">Refs: {refs}</span>
                  </div>
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

