import { NextResponse } from "next/server";
import type { ApiResponse, StationSnapshot } from "@/types";
import {
  isStationSnapshot,
  listStationSnapshots,
  writeStationSnapshot,
} from "@/lib/storage/stationSnapshots";

export const runtime = "nodejs";

/**
 * GET /api/snapshots/stations
 * List all station snapshots (most recent first)
 */
export async function GET() {
  const snapshots = await listStationSnapshots();
  const res: ApiResponse<StationSnapshot[]> = { success: true, data: snapshots };
  return NextResponse.json(res);
}

/**
 * POST /api/snapshots/stations
 * Create a new station snapshot
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (!isStationSnapshot(body)) {
    return NextResponse.json(
      { success: false, data: null, error: "Body must be a valid StationSnapshot." },
      { status: 400 }
    );
  }

  const saved = await writeStationSnapshot(body);
  const res: ApiResponse<StationSnapshot> = {
    success: true,
    data: saved,
    message: "Station snapshot created.",
  };
  return NextResponse.json(res, { status: 201 });
}
