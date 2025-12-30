import { NextResponse } from "next/server";

import type { ApiResponse, Entity } from "@/types";
import {
  isEntity,
  listEntities,
  writeEntity,
} from "@/lib/storage/entities";

export const runtime = "nodejs";

export async function GET() {
  const entities = await listEntities();
  const res: ApiResponse<Entity[]> = { success: true, data: entities };
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

  if (!isEntity(body)) {
    const res: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Body must be a valid Entity.",
    };
    return NextResponse.json(res, { status: 400 });
  }

  const saved = await writeEntity(body);
  const res: ApiResponse<Entity> = {
    success: true,
    data: saved,
    message: "Entity created.",
  };
  return NextResponse.json(res, { status: 201 });
}
