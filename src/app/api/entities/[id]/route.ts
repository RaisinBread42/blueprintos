import { NextResponse } from "next/server";

import type { ApiResponse, Entity } from "@/types";
import {
  deleteEntity,
  isEntity,
  readEntity,
  writeEntity,
} from "@/lib/storage/entities";

export const runtime = "nodejs";

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const entity = await readEntity(ctx.params.id);
  if (!entity) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Entity not found.",
    };
    return NextResponse.json(res, { status: 404 });
  }

  const res: ApiResponse<Entity> = { success: true, data: entity };
  return NextResponse.json(res);
}

export async function PUT(req: Request, ctx: { params: { id: string } }) {
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

  if (!isEntity(body)) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Body must be a valid Entity.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (body.entity_id !== ctx.params.id) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "entity_id must match the [id] route parameter.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  const saved = await writeEntity(body);
  const res: ApiResponse<Entity> = {
    success: true,
    data: saved,
    message: "Entity updated.",
  };
  return NextResponse.json(res);
}

export async function DELETE(_: Request, ctx: { params: { id: string } }) {
  const existed = await deleteEntity(ctx.params.id);
  if (!existed) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Entity not found.",
    };
    return NextResponse.json(res, { status: 404 });
  }
  const res: ApiResponse<null> = {
    success: true,
    data: null,
    message: "Entity deleted.",
  };
  return NextResponse.json(res);
}
