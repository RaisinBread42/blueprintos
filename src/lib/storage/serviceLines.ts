import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { ServiceLine } from "@/types";
import { normalizeServiceLine } from "@/lib/blueprint/normalize";
import { isServiceLine } from "@/lib/blueprint/validate";

function serviceLinesDir() {
  return process.env.BLUEPRINTOS_SERVICE_LINES_DIR ?? path.join(process.cwd(), "data", "service-lines");
}

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function safeServiceLineId(id: string) {
  // Keep it conservative: allow A-Z a-z 0-9 _ - only.
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("Invalid service line id.");
  }
  return id;
}

function serviceLinePath(id: string) {
  const safe = safeServiceLineId(id);
  return path.join(serviceLinesDir(), `${safe}.json`);
}

async function ensureDir() {
  await fs.mkdir(serviceLinesDir(), { recursive: true });
}

export async function listServiceLineIds(): Promise<string[]> {
  await ensureDir();
  const entries = await fs.readdir(serviceLinesDir(), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""))
    .sort();
}

export async function readServiceLine(id: string): Promise<ServiceLine | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(serviceLinePath(id), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isServiceLine(parsed)) return null;
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return null;
    throw err;
  }
}

export async function writeServiceLine(input: ServiceLine): Promise<ServiceLine> {
  await ensureDir();
  const normalized = normalizeServiceLine(input);
  const filePath = serviceLinePath(normalized.service_line_id);
  await fs.writeFile(filePath, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  return normalized;
}

export async function deleteServiceLine(id: string): Promise<boolean> {
  await ensureDir();
  try {
    await fs.unlink(serviceLinePath(id));
    return true;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return false;
    throw err;
  }
}


