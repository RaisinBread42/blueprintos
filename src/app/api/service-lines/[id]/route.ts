import { NextResponse } from "next/server";

import type { ApiResponse, ServiceLine } from "@/types";
import { isServiceLine } from "@/lib/blueprint/validate";
import { deleteServiceLine, readServiceLine, writeServiceLine } from "@/lib/storage/serviceLines";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const sl = await readServiceLine(ctx.params.id);
  if (!sl) {
    const res: ApiResponse<null> = { success: false, data: null, error: "Service line not found." };
    return NextResponse.json(res, { status: 404 });
  }
  const res: ApiResponse<ServiceLine> = { success: true, data: sl };
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

  if (!isServiceLine(body)) {
    const res: ApiResponse<null> = { success: false, data: null, error: "Body must be a ServiceLine (Standard Gauge)." };
    return NextResponse.json(res, { status: 400 });
  }

  if (body.service_line_id !== ctx.params.id) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "service_line_id must match the [id] route parameter.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  const saved = await writeServiceLine(body);
  const res: ApiResponse<ServiceLine> = { success: true, data: saved, message: "Service line updated." };
  return NextResponse.json(res);
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const existed = await deleteServiceLine(ctx.params.id);
  if (!existed) {
    const res: ApiResponse<null> = { success: false, data: null, error: "Service line not found." };
    return NextResponse.json(res, { status: 404 });
  }
  const res: ApiResponse<null> = { success: true, data: null, message: "Service line deleted." };
  return NextResponse.json(res);
}


