import { NextResponse } from "next/server";
import type { ApiResponse, StationSnapshot } from "@/types";
import {
  readStationSnapshot,
  deleteStationSnapshot,
} from "@/lib/storage/stationSnapshots";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/snapshots/stations/[id]
 * Get a specific station snapshot
 */
export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const snapshot = await readStationSnapshot(id);
  if (!snapshot) {
    return NextResponse.json(
      { success: false, data: null, error: "Snapshot not found." },
      { status: 404 }
    );
  }
  const res: ApiResponse<StationSnapshot> = { success: true, data: snapshot };
  return NextResponse.json(res);
}

/**
 * DELETE /api/snapshots/stations/[id]
 * Delete a specific station snapshot
 */
export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  const deleted = await deleteStationSnapshot(id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, data: null, error: "Snapshot not found." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: null, message: "Snapshot deleted." });
}
