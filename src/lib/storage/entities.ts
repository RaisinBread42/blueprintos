import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { Entity, Touchpoint } from "@/types";

function entitiesDir() {
  return (
    process.env.BLUEPRINTOS_ENTITIES_DIR ??
    path.join(process.cwd(), "data", "entities")
  );
}

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function safeEntityId(id: string) {
  // Keep it conservative: allow A-Z a-z 0-9 _ - only.
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("Invalid entity id.");
  }
  return id;
}

function entityPath(id: string) {
  const safe = safeEntityId(id);
  return path.join(entitiesDir(), `${safe}.json`);
}

async function ensureDir() {
  await fs.mkdir(entitiesDir(), { recursive: true });
}

/**
 * Type guard for Touchpoint
 */
export function isTouchpoint(obj: unknown): obj is Touchpoint {
  if (!obj || typeof obj !== "object") return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.touchpoint_id === "string" &&
    typeof t.entity_id === "string" &&
    typeof t.name === "string" &&
    typeof t.category === "string" &&
    typeof t.metrics === "object" &&
    t.metrics !== null &&
    typeof (t.metrics as Record<string, unknown>).impressions === "number" &&
    typeof (t.metrics as Record<string, unknown>).unique_users === "number" &&
    typeof t.data_source === "string"
  );
}

/**
 * Type guard for Entity
 */
export function isEntity(obj: unknown): obj is Entity {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Record<string, unknown>;
  const validTypes = ["radio", "marketplace", "news", "rewards", "internal"];
  return (
    typeof e.entity_id === "string" &&
    typeof e.name === "string" &&
    typeof e.type === "string" &&
    validTypes.includes(e.type) &&
    Array.isArray(e.touchpoints) &&
    e.touchpoints.every(isTouchpoint) &&
    typeof e.created_at === "string" &&
    typeof e.updated_at === "string"
  );
}

/**
 * Normalize an entity before saving (ensure timestamps, etc.)
 */
export function normalizeEntity(input: Entity): Entity {
  const now = new Date().toISOString();
  return {
    ...input,
    entity_id: input.entity_id.trim(),
    name: input.name.trim(),
    description: input.description?.trim(),
    touchpoints: input.touchpoints.map((t) => ({
      ...t,
      touchpoint_id: t.touchpoint_id.trim(),
      entity_id: input.entity_id.trim(),
      name: t.name.trim(),
      category: t.category.trim(),
    })),
    created_at: input.created_at || now,
    updated_at: now,
  };
}

/**
 * List all entity IDs in the data directory
 */
export async function listEntityIds(): Promise<string[]> {
  await ensureDir();
  const entries = await fs.readdir(entitiesDir(), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""))
    .sort();
}

/**
 * Read a single entity by ID
 */
export async function readEntity(id: string): Promise<Entity | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(entityPath(id), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isEntity(parsed)) return null;
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return null;
    throw err;
  }
}

/**
 * Read all entities
 */
export async function listEntities(): Promise<Entity[]> {
  const ids = await listEntityIds();
  const entities: Entity[] = [];
  for (const id of ids) {
    const entity = await readEntity(id);
    if (entity) entities.push(entity);
  }
  return entities;
}

/**
 * Write/update an entity
 */
export async function writeEntity(input: Entity): Promise<Entity> {
  await ensureDir();
  const normalized = normalizeEntity(input);
  const filePath = entityPath(normalized.entity_id);
  await fs.writeFile(
    filePath,
    JSON.stringify(normalized, null, 2) + "\n",
    "utf8"
  );
  return normalized;
}

/**
 * Delete an entity by ID
 */
export async function deleteEntity(id: string): Promise<boolean> {
  await ensureDir();
  try {
    await fs.unlink(entityPath(id));
    return true;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return false;
    throw err;
  }
}
