import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const SCENARIO_DIR = path.join(process.cwd(), "data", "scenarios");

type ScenarioPayload = {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
};

type ScenarioConfig = {
  global: ScenarioPayload;
  byStation?: Record<string, ScenarioPayload>;
};

type ScenarioFile = {
  scenarios: Record<string, ScenarioConfig | ScenarioPayload>;
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

function toConfig(value: ScenarioConfig | ScenarioPayload | undefined): ScenarioConfig {
  if (!value) return { global: defaultPayload(), byStation: {} };
  if ((value as ScenarioConfig).global) {
    const cfg = value as ScenarioConfig;
    return {
      global: cfg.global ?? defaultPayload(),
      byStation: cfg.byStation ?? {},
    };
  }
  const legacy = value as ScenarioPayload;
  return { global: { ...defaultPayload(), ...legacy }, byStation: {} };
}

async function readFile(id: string): Promise<ScenarioFile> {
  await ensureDir();
  const file = filePath(id);
  const content = await fs.readFile(file, "utf8");
  const parsed = JSON.parse(content) as Partial<ScenarioFile>;
  if (!parsed.scenarios || typeof parsed.scenarios !== "object") {
    return { scenarios: {} };
  }
  return { scenarios: parsed.scenarios };
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
    let scenario: ScenarioConfig;
    if (name) {
      scenario = toConfig(fileData.scenarios[name]);
    } else {
      scenario = { global: defaultPayload(), byStation: {} };
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
    const body = (await req.json().catch(() => ({}))) as
      | Partial<ScenarioPayload>
      | { global?: Partial<ScenarioPayload>; byStation?: Record<string, Partial<ScenarioPayload>> };

    // Accept both legacy and new shape
    const isLegacy = (b: typeof body): b is Partial<ScenarioPayload> =>
      "laborDelta" in b || "timeDelta" in b || "qualityDelta" in b;

    const payload: ScenarioConfig = isLegacy(body)
      ? {
          global: {
            laborDelta: body.laborDelta ?? 0,
            timeDelta: body.timeDelta ?? 0,
            qualityDelta: body.qualityDelta ?? 0,
          },
          byStation: {},
        }
      : {
          global: {
            laborDelta: body.global?.laborDelta ?? 0,
            timeDelta: body.global?.timeDelta ?? 0,
            qualityDelta: body.global?.qualityDelta ?? 0,
          },
          byStation: Object.fromEntries(
            Object.entries(body.byStation ?? {}).map(([k, v]) => [
              k,
              {
                laborDelta: v.laborDelta ?? 0,
                timeDelta: v.timeDelta ?? 0,
                qualityDelta: v.qualityDelta ?? 0,
              },
            ])
          ),
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

