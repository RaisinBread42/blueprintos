import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type {
  AttributionEdge,
  GapOpportunity,
  JourneyInsights,
  JourneySnapshot,
} from "@/types";

function snapshotsDir() {
  return (
    process.env.BLUEPRINTOS_ATTRIBUTION_DIR ??
    path.join(process.cwd(), "data", "attribution", "snapshots")
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
    throw new Error("Invalid snapshot id.");
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
 * Type guard for AttributionEdge
 */
export function isAttributionEdge(obj: unknown): obj is AttributionEdge {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Record<string, unknown>;
  const validModels = ["first_touch", "last_touch", "linear", "time_decay"];
  return (
    typeof e.id === "string" &&
    typeof e.source_touchpoint_id === "string" &&
    typeof e.target_touchpoint_id === "string" &&
    typeof e.period === "string" &&
    typeof e.metrics === "object" &&
    e.metrics !== null &&
    typeof (e.metrics as Record<string, unknown>).users_flowed === "number" &&
    typeof (e.metrics as Record<string, unknown>).click_through_rate === "number" &&
    typeof e.attribution_model === "string" &&
    validModels.includes(e.attribution_model)
  );
}

/**
 * Type guard for GapOpportunity
 */
export function isGapOpportunity(obj: unknown): obj is GapOpportunity {
  if (!obj || typeof obj !== "object") return false;
  const g = obj as Record<string, unknown>;
  return (
    typeof g.touchpoint_id === "string" &&
    typeof g.search_demand === "number" &&
    typeof g.supply_count === "number" &&
    typeof g.gap_score === "number" &&
    typeof g.recommended_action === "string"
  );
}

/**
 * Type guard for JourneyInsights
 */
export function isJourneyInsights(obj: unknown): obj is JourneyInsights {
  if (!obj || typeof obj !== "object") return false;
  const i = obj as Record<string, unknown>;
  return (
    Array.isArray(i.highest_click_through_path) &&
    i.highest_click_through_path.every((p) => typeof p === "string") &&
    (i.biggest_bridge === undefined || typeof i.biggest_bridge === "string") &&
    Array.isArray(i.gap_opportunities) &&
    i.gap_opportunities.every(isGapOpportunity)
  );
}

/**
 * Type guard for JourneySnapshot
 */
export function isJourneySnapshot(obj: unknown): obj is JourneySnapshot {
  if (!obj || typeof obj !== "object") return false;
  const s = obj as Record<string, unknown>;
  const validPeriodTypes = ["weekly", "monthly", "quarterly"];
  return (
    typeof s.snapshot_id === "string" &&
    typeof s.period === "string" &&
    typeof s.period_type === "string" &&
    validPeriodTypes.includes(s.period_type) &&
    Array.isArray(s.entities) &&
    s.entities.every((e) => typeof e === "string") &&
    Array.isArray(s.edges) &&
    s.edges.every(isAttributionEdge) &&
    typeof s.computed_at === "string" &&
    isJourneyInsights(s.insights)
  );
}

/**
 * Normalize a snapshot before saving
 */
export function normalizeSnapshot(input: JourneySnapshot): JourneySnapshot {
  const now = new Date().toISOString();
  return {
    ...input,
    snapshot_id: input.snapshot_id.trim(),
    period: input.period.trim(),
    entities: input.entities.map((e) => e.trim()),
    edges: input.edges.map((edge) => ({
      ...edge,
      id: edge.id.trim(),
      source_touchpoint_id: edge.source_touchpoint_id.trim(),
      target_touchpoint_id: edge.target_touchpoint_id.trim(),
      period: edge.period.trim(),
    })),
    computed_at: input.computed_at || now,
  };
}

/**
 * List all snapshot IDs
 */
export async function listSnapshotIds(): Promise<string[]> {
  await ensureDir();
  const entries = await fs.readdir(snapshotsDir(), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""))
    .sort()
    .reverse(); // Most recent first
}

/**
 * Read a single snapshot by ID
 */
export async function readSnapshot(id: string): Promise<JourneySnapshot | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(snapshotPath(id), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isJourneySnapshot(parsed)) return null;
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return null;
    throw err;
  }
}

/**
 * Read all snapshots
 */
export async function listSnapshots(): Promise<JourneySnapshot[]> {
  const ids = await listSnapshotIds();
  const snapshots: JourneySnapshot[] = [];
  for (const id of ids) {
    const snapshot = await readSnapshot(id);
    if (snapshot) snapshots.push(snapshot);
  }
  return snapshots;
}

/**
 * Write/update a snapshot
 */
export async function writeSnapshot(
  input: JourneySnapshot
): Promise<JourneySnapshot> {
  await ensureDir();
  const normalized = normalizeSnapshot(input);
  const filePath = snapshotPath(normalized.snapshot_id);
  await fs.writeFile(
    filePath,
    JSON.stringify(normalized, null, 2) + "\n",
    "utf8"
  );
  return normalized;
}

/**
 * Delete a snapshot by ID
 */
export async function deleteSnapshot(id: string): Promise<boolean> {
  await ensureDir();
  try {
    await fs.unlink(snapshotPath(id));
    return true;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return false;
    throw err;
  }
}
