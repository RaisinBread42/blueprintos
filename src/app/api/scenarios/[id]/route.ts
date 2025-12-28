import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SCENARIO_DIR = path.join(process.cwd(), "data", "scenarios");

type ScenarioPayload = {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
};

type ScenarioFile = {
  scenarios: Record<string, ScenarioPayload>;
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

function normalizeFileData(raw: unknown): ScenarioFile {
  // Legacy shape: { laborDelta, timeDelta, qualityDelta }
  if (
    raw &&
    typeof raw === "object" &&
    "laborDelta" in raw &&
    "timeDelta" in raw &&
    "qualityDelta" in raw &&
    !("scenarios" in raw)
  ) {
    return { scenarios: { default: raw as ScenarioPayload } };
  }

  // New shape
  if (raw && typeof raw === "object" && "scenarios" in raw) {
    const scenarios = (raw as { scenarios: Record<string, ScenarioPayload> }).scenarios ?? {};
    return { scenarios };
  }

  return { scenarios: {} };
}

async function readFile(id: string): Promise<ScenarioFile> {
  await ensureDir();
  const file = filePath(id);
  const content = await fs.readFile(file, "utf8");
  return normalizeFileData(JSON.parse(content));
}

async function writeFile(id: string, data: ScenarioFile) {
  await ensureDir();
  const file = filePath(id);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    let fileData: ScenarioFile | null = null;
    try {
      fileData = await readFile(params.id);
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code === "ENOENT") {
        return NextResponse.json({
          success: true,
          data: { scenario: defaultPayload(), names: [] },
        });
      }
      throw err;
    }

    const names = Object.keys(fileData.scenarios);
    let scenario: ScenarioPayload;
    if (name) {
      scenario = fileData.scenarios[name] ?? defaultPayload();
    } else if (names.length > 0) {
      scenario = fileData.scenarios[names[0]] ?? defaultPayload();
    } else {
      scenario = defaultPayload();
    }

    return NextResponse.json({
      success: true,
      data: { scenario, names },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Not found";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name") || "default";
    const body = (await req.json().catch(() => ({}))) as Partial<ScenarioPayload>;
    const payload: ScenarioPayload = {
      laborDelta: body.laborDelta ?? 0,
      timeDelta: body.timeDelta ?? 0,
      qualityDelta: body.qualityDelta ?? 0,
    };

    let fileData: ScenarioFile = { scenarios: {} };
    try {
      fileData = await readFile(params.id);
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code !== "ENOENT") throw err;
    }

    fileData.scenarios[name] = payload;
    await writeFile(params.id, fileData);

    return NextResponse.json({
      success: true,
      data: { scenario: payload, names: Object.keys(fileData.scenarios) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save scenario";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");

    let fileData: ScenarioFile = { scenarios: {} };
    try {
      fileData = await readFile(params.id);
    } catch (err) {
      const code = (err as { code?: string } | undefined)?.code;
      if (code !== "ENOENT") throw err;
      return NextResponse.json({ success: true, data: { scenario: defaultPayload(), names: [] } });
    }

    if (name) {
      delete fileData.scenarios[name];
      if (Object.keys(fileData.scenarios).length === 0) {
        await fs.rm(filePath(params.id), { force: true });
        return NextResponse.json({
          success: true,
          data: { scenario: defaultPayload(), names: [] },
        });
      }
      await writeFile(params.id, fileData);
      return NextResponse.json({
        success: true,
        data: { scenario: defaultPayload(), names: Object.keys(fileData.scenarios) },
      });
    }

    await fs.rm(filePath(params.id), { force: true });
    return NextResponse.json({ success: true, data: { scenario: defaultPayload(), names: [] } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete scenario";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

