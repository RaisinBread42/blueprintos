import { NextResponse } from "next/server";

import type { ApiResponse, ServiceLine } from "@/types";
import { isServiceLine } from "@/lib/blueprint/validate";
import { listServiceLineIds, readServiceLine, writeServiceLine } from "@/lib/storage/serviceLines";

export const runtime = "nodejs";

export async function GET() {
  const ids = await listServiceLineIds();
  const data: Pick<ServiceLine, "service_line_id" | "name" | "description" | "created_at" | "updated_at">[] = [];

  for (const id of ids) {
    const sl = await readServiceLine(id);
    if (!sl) continue;
    data.push({
      service_line_id: sl.service_line_id,
      name: sl.name,
      description: sl.description,
      created_at: sl.created_at,
      updated_at: sl.updated_at,
    });
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

  const saved = await writeServiceLine(body);
  const res: ApiResponse<ServiceLine> = { success: true, data: saved, message: "Service line created." };
  return NextResponse.json(res, { status: 201 });
}


