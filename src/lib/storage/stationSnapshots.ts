import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  StationSnapshot,
  StationMetricRecord,
  StationMetrics,
} from "@/types";

function snapshotsDir() {
  return (
    process.env.BLUEPRINTOS_STATION_SNAPSHOTS_DIR ??
    path.join(process.cwd(), "data", "snapshots", "stations")
  );
}

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function safeSnapshotId(id: string) {
  // Allow A-Z a-z 0-9 _ - W (for weekly format like 2025-W01)
  if (!/^[A-Za-z0-9_\-W]+$/.test(id)) {
    throw new Error("Invalid station snapshot id.");
  }
  return id;
}

function snapshotPath(id: string) {
  const safe = safeSnapshotId(id);
  return path.join(snapshotsDir(), `${safe}.json`);
}

async function ensureDir() {
  await fs.mkdir(snapshotsDir(), { recursive: true });
}

/**
 * Type guard for StationMetrics
 */
function isStationMetrics(obj: unknown): obj is StationMetrics {
  if (!obj || typeof obj !== "object") return false;
  const m = obj as Record<string, unknown>;
  const fp = m.fair_pricing as Record<string, unknown> | undefined;
  const wc = m.world_class as Record<string, unknown> | undefined;
  const pp = m.performance_proof;
  return (
    fp !== undefined &&
    typeof fp === "object" &&
    typeof fp.planned_hrs === "number" &&
    typeof fp.actual_hrs === "number" &&
    typeof fp.labor_variance === "number" &&
    wc !== undefined &&
    typeof wc === "object" &&
    typeof wc.internal_qa_score === "number" &&
    typeof wc.standard_met === "boolean" &&
    pp !== undefined &&
    typeof pp === "object"
  );
}

/**
 * Type guard for StationMetricRecord
 */
function isStationMetricRecord(obj: unknown): obj is StationMetricRecord {
  if (!obj || typeof obj !== "object") return false;
  const r = obj as Record<string, unknown>;
  const validRag = ["red", "amber", "green"];
  return (
    typeof r.station_id === "string" &&
    isStationMetrics(r.metrics) &&
    typeof r.rag_status === "string" &&
    validRag.includes(r.rag_status)
  );
}

/**
 * Type guard for StationSnapshot
 */
export function isStationSnapshot(obj: unknown): obj is StationSnapshot {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  const validPeriodTypes = ["weekly", "monthly"];
  return (
    typeof s.snapshot_id === "string" &&
    typeof s.period === "string" &&
    typeof s.period_type === "string" &&
    validPeriodTypes.includes(s.period_type) &&
    Array.isArray(s.stations) &&
    s.stations.every(isStationMetricRecord) &&
    typeof s.computed_at === "string"
  );
}

/**
 * Normalize a snapshot before saving
 */
export function normalizeStationSnapshot(input: StationSnapshot): StationSnapshot {
  const now = new Date().toISOString();
  return {
    ...input,
    snapshot_id: input.snapshot_id.trim(),
    period: input.period.trim(),
    computed_at: input.computed_at || now,
  };
}

/**
 * List all station snapshot IDs
 */
export async function listStationSnapshotIds(): Promise<string[]> {
  await ensureDir();
  const entries = await fs.readdir(snapshotsDir(), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""))
    .sort()
    .reverse(); // Most recent first
}

/**
 * Read a single station snapshot by ID
 */
export async function readStationSnapshot(id: string): Promise<StationSnapshot | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(snapshotPath(id), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isStationSnapshot(parsed)) return null;
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return null;
    throw err;
  }
}

/**
 * Read all station snapshots
 */
export async function listStationSnapshots(): Promise<StationSnapshot[]> {
  const ids = await listStationSnapshotIds();
  const snapshots: StationSnapshot[] = [];
  for (const id of ids) {
    const snapshot = await readStationSnapshot(id);
    if (snapshot) snapshots.push(snapshot);
  }
  return snapshots;
}

/**
 * Write/update a station snapshot
 */
export async function writeStationSnapshot(
  input: StationSnapshot
): Promise<StationSnapshot> {
  await ensureDir();
  const normalized = normalizeStationSnapshot(input);
  const filePath = snapshotPath(normalized.snapshot_id);
  await fs.writeFile(
    filePath,
    JSON.stringify(normalized, null, 2) + "\n",
    "utf8"
  );
  return normalized;
}

/**
 * Delete a station snapshot by ID
 */
export async function deleteStationSnapshot(id: string): Promise<boolean> {
  await ensureDir();
  try {
    await fs.unlink(snapshotPath(id));
    return true;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return false;
    throw err;
  }
}
