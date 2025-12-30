import { NextResponse } from "next/server";

import type { ApiResponse, Station } from "@/types";
import { listStationIds, readStation } from "@/lib/storage/stations";

export const runtime = "nodejs";

export async function GET() {
  const ids = await listStationIds();
  const stations: Station[] = [];

  for (const id of ids) {
    const st = await readStation(id);
    if (st) stations.push(st);
  }

  const res: ApiResponse<Station[]> = { success: true, data: stations };
  return NextResponse.json(res);
}




