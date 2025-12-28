import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SCENARIO_DIR = path.join(process.cwd(), "data", "scenarios");

type ScenarioPayload = {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
};

async function ensureDir() {
  await fs.mkdir(SCENARIO_DIR, { recursive: true });
}

function filePath(id: string) {
  return path.join(SCENARIO_DIR, `${id}.json`);
}

function defaultPayload(): ScenarioPayload {
  return { laborDelta: 0, timeDelta: 0, qualityDelta: 0 };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDir();
    const file = filePath(params.id);
    const content = await fs.readFile(file, "utf8");
    const json = JSON.parse(content) as ScenarioPayload;
    return NextResponse.json({ success: true, data: json });
  } catch (err) {
    // If missing, return default payload with success to avoid 404 noise client-side
    type NodeErr = { code?: string };
    const code = (err as NodeErr | undefined)?.code;
    if (code === "ENOENT") {
      return NextResponse.json({ success: true, data: defaultPayload() });
    }
    const message = err instanceof Error ? err.message : "Not found";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as Partial<ScenarioPayload>;
    const payload: ScenarioPayload = {
      laborDelta: body.laborDelta ?? 0,
      timeDelta: body.timeDelta ?? 0,
      qualityDelta: body.qualityDelta ?? 0,
    };
    await ensureDir();
    const file = filePath(params.id);
    await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
    return NextResponse.json({ success: true, data: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save scenario";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await ensureDir();
    const file = filePath(params.id);
    await fs.rm(file, { force: true });
    return NextResponse.json({ success: true, data: defaultPayload() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete scenario";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

