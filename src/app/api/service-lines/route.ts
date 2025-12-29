import { NextResponse } from "next/server";

import type { ApiResponse, ServiceLine } from "@/types";
import { isServiceLine } from "@/lib/blueprint/validate";
import { listServiceLineIds, readServiceLine, writeServiceLine } from "@/lib/storage/serviceLines";
import { readStation, writeStation } from "@/lib/storage/stations";

export const runtime = "nodejs";

export async function GET() {
  const ids = await listServiceLineIds();
  const data: ServiceLine[] = [];

  for (const id of ids) {
    const sl = await readServiceLine(id);
    if (!sl) continue;

    const hydratedNodes = await Promise.all(
      sl.nodes.map(async (node) => {
        const station = await readStation(node.station_id);
        if (station) {
          return {
            ...node,
            name: node.name ?? station.name,
            department: node.department ?? station.department,
            data_source: station.data_source,
            rag_status: station.rag_status,
            metrics: station.metrics,
          };
        }
        return node;
      })
    );

    data.push({ ...sl, nodes: hydratedNodes });
  }

  const res: ApiResponse<typeof data> = { success: true, data };
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res: ApiResponse<null> = { success: false, data: null, error: "Invalid JSON body." };
    return NextResponse.json(res, { status: 400 });
  }

  if (!isServiceLine(body)) {
    const res: ApiResponse<null> = { success: false, data: null, error: "Body must be a ServiceLine (Standard Gauge)." };
    return NextResponse.json(res, { status: 400 });
  }

  // Persist stations globally (no per-line overrides) and hydrate nodes from catalog
  const hydratedNodes = [];
  for (const node of body.nodes) {
    const savedStation = await writeStation({
      station_id: node.station_id,
      name: node.name,
      department: node.department,
      data_source: node.data_source,
      metrics: node.metrics,
      rag_status: node.rag_status,
      position: node.position,
    });
    hydratedNodes.push({
      ...node,
      name: node.name ?? savedStation.name,
      department: node.department ?? savedStation.department,
      data_source: savedStation.data_source,
      rag_status: savedStation.rag_status,
      metrics: savedStation.metrics,
    });
  }

  const saved = await writeServiceLine({ ...body, nodes: hydratedNodes });
  const res: ApiResponse<ServiceLine> = { success: true, data: saved, message: "Service line created." };
  return NextResponse.json(res, { status: 201 });
}


