import { NextResponse } from "next/server";

import type { ApiResponse, JourneySnapshot } from "@/types";
import {
  deleteSnapshot,
  readSnapshot,
} from "@/lib/storage/attribution";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const snapshot = await readSnapshot(ctx.params.id);
  if (!snapshot) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Snapshot not found.",
    };
    return NextResponse.json(res, { status: 404 });
  }

  const res: ApiResponse<JourneySnapshot> = { success: true, data: snapshot };
  return NextResponse.json(res);
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const existed = await deleteSnapshot(ctx.params.id);
  if (!existed) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Snapshot not found.",
    };
    return NextResponse.json(res, { status: 404 });
  }
  const res: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Snapshot deleted.",
  };
  return NextResponse.json(res);
}
