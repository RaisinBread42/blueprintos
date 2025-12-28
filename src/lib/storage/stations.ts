import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { Station } from "@/types";

function stationsDir() {
  return process.env.BLUEPRINTOS_STATIONS_DIR ?? path.join(process.cwd(), "data", "stations");
}

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function safeStationId(id: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error("Invalid station id.");
  }
  return id;
}

function stationPath(id: string) {
  const safe = safeStationId(id);
  return path.join(stationsDir(), `${safe}.json`);
}

async function ensureDir() {
  await fs.mkdir(stationsDir(), { recursive: true });
}

export async function listStationIds(): Promise<string[]> {
  await ensureDir();
  const entries = await fs.readdir(stationsDir(), { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name.replace(/\.json$/, ""))
    .sort();
}

export async function readStation(id: string): Promise<Station | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(stationPath(id), "utf8");
    const parsed: Station = JSON.parse(raw);
    // Very light validation: ensure station_id matches
    if (parsed.station_id !== id) return null;
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") return null;
    throw err;
  }
}

export async function writeStation(station: Station): Promise<Station> {
  await ensureDir();
  const filePath = stationPath(station.station_id);
  await fs.writeFile(filePath, JSON.stringify(station, null, 2) + "\n", "utf8");
  return station;
}

