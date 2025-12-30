import { NextResponse } from "next/server";

import type { ApiResponse, JourneySnapshot } from "@/types";
import {
  isJourneySnapshot,
  listSnapshots,
  writeSnapshot,
} from "@/lib/storage/attribution";

export const runtime = "nodejs";

export async function GET() {
  const snapshots = await listSnapshots();
  const res: ApiResponse<JourneySnapshot[]> = { success: true, data: snapshots };
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Invalid JSON body.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (!isJourneySnapshot(body)) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Body must be a valid JourneySnapshot.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  const saved = await writeSnapshot(body);
  const res: ApiResponse<JourneySnapshot> = {
    success: true,
    data: saved,
    message: "Snapshot created.",
  };
  return NextResponse.json(res, { status: 201 });
}
