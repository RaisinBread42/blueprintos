import { NextResponse } from "next/server";

import type { ApiResponse, Station } from "@/types";
import { readStation, writeStation } from "@/lib/storage/stations";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const st = await readStation(ctx.params.id);
  if (!st) {
    const res: ApiResponse<null> = { success: false, data: null, error: "Station not found." };
    return NextResponse.json(res, { status: 404 });
  }
  const res: ApiResponse<Station> = { success: true, data: st };
  return NextResponse.json(res);
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res: ApiResponse<null> = { success: false, data: null, error: "Invalid JSON body." };
    return NextResponse.json(res, { status: 400 });
  }

  const station = body as Station;
  if (station.station_id !== ctx.params.id) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "station_id must match the [id] route parameter.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  const saved = await writeStation(station);
  const res: ApiResponse<Station> = { success: true, data: saved, message: "Station updated." };
  return NextResponse.json(res);
}

