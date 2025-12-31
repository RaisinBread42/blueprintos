import { NextResponse } from "next/server";
import type { ApiResponse, Changelog } from "@/types";
import {
  isChangelogEvent,
  readChangelog,
  addChangelogEvent,
  deleteChangelogEvent,
} from "@/lib/storage/changelog";

export const runtime = "nodejs";

/**
 * GET /api/changelog
 * Get all changelog events
 */
export async function GET() {
  const changelog = await readChangelog();
  const res: ApiResponse<Changelog> = { success: true, data: changelog };
  return NextResponse.json(res);
}

/**
 * POST /api/changelog
 * Add a new changelog event
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

  if (!isChangelogEvent(body)) {
    return NextResponse.json(
      { success: false, data: null, error: "Body must be a valid ChangelogEvent." },
      { status: 400 }
    );
  }

  const changelog = await addChangelogEvent(body);
  const res: ApiResponse<Changelog> = {
    success: true,
    data: changelog,
    message: "Event added.",
  };
  return NextResponse.json(res, { status: 201 });
}

/**
 * DELETE /api/changelog
 * Delete a changelog event by ID (pass id in query string)
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { success: false, data: null, error: "Missing id query parameter." },
      { status: 400 }
    );
  }

  const deleted = await deleteChangelogEvent(id);
  if (!deleted) {
    return NextResponse.json(
      { success: false, data: null, error: "Event not found." },
      { status: 404 }
    );
  }
  return NextResponse.json({ success: true, data: null, message: "Event deleted." });
}
