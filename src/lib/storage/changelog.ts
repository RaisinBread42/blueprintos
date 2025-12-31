import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { Changelog, ChangelogEvent, ChangelogEventType } from "@/types";

function changelogDir() {
  return (
    process.env.BLUEPRINTOS_CHANGELOG_DIR ??
    path.join(process.cwd(), "data", "changelog")
  );
}

function changelogPath() {
  return path.join(changelogDir(), "events.json");
}

function errCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

async function ensureDir() {
  await fs.mkdir(changelogDir(), { recursive: true });
}

const validEventTypes: ChangelogEventType[] = [
  "process_change",
  "team_change",
  "tool_change",
  "policy_change",
];

/**
 * Type guard for ChangelogEvent
 */
export function isChangelogEvent(obj: unknown): obj is ChangelogEvent {
  if (!obj || typeof obj !== "object") return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.date === "string" &&
    typeof e.type === "string" &&
    validEventTypes.includes(e.type as ChangelogEventType) &&
    typeof e.title === "string" &&
    (e.description === undefined || typeof e.description === "string") &&
    Array.isArray(e.affected_stations) &&
    e.affected_stations.every((s) => typeof s === "string") &&
    (e.expected_impact === undefined || typeof e.expected_impact === "string")
  );
}

/**
 * Type guard for Changelog
 */
export function isChangelog(obj: unknown): obj is Changelog {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return (
    Array.isArray(c.events) &&
    c.events.every(isChangelogEvent)
  );
}

/**
 * Read the changelog
 */
export async function readChangelog(): Promise<Changelog> {
  await ensureDir();
  try {
    const raw = await fs.readFile(changelogPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!isChangelog(parsed)) {
      return { events: [] };
    }
    return parsed;
  } catch (err: unknown) {
    if (errCode(err) === "ENOENT") {
      return { events: [] };
    }
    throw err;
  }
}

/**
 * Write the entire changelog
 */
export async function writeChangelog(changelog: Changelog): Promise<Changelog> {
  await ensureDir();
  // Sort events by date descending (most recent first)
  const sorted: Changelog = {
    events: [...changelog.events].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  };
  await fs.writeFile(
    changelogPath(),
    JSON.stringify(sorted, null, 2) + "\n",
    "utf8"
  );
  return sorted;
}

/**
 * Add a single event to the changelog
 */
export async function addChangelogEvent(event: ChangelogEvent): Promise<Changelog> {
  const changelog = await readChangelog();
  changelog.events.push(event);
  return writeChangelog(changelog);
}

/**
 * Delete an event by ID
 */
export async function deleteChangelogEvent(id: string): Promise<boolean> {
  const changelog = await readChangelog();
  const originalLength = changelog.events.length;
  changelog.events = changelog.events.filter((e) => e.id !== id);
  if (changelog.events.length === originalLength) {
    return false;
  }
  await writeChangelog(changelog);
  return true;
}
