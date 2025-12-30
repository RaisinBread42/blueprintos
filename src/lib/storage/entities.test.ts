import { afterEach, describe, expect, it } from "vitest";

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { Entity } from "@/types";
import {
  deleteEntity,
  isEntity,
  isTouchpoint,
  listEntities,
  listEntityIds,
  normalizeEntity,
  readEntity,
  writeEntity,
} from "@/lib/storage/entities";

async function mkTmpDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "blueprintos-entities-test-"));
}

describe("storage/entities", () => {
  let tmpDir: string | null = null;

  afterEach(async () => {
    delete process.env.BLUEPRINTOS_ENTITIES_DIR;
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it("writes, reads, lists, and deletes entities in a configured directory", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ENTITIES_DIR = tmpDir;

    const entity: Entity = {
      entity_id: "TEST-ENTITY",
      name: "Test Entity",
      type: "radio",
      description: "A test entity",
      touchpoints: [
        {
          touchpoint_id: "TP-001",
          entity_id: "TEST-ENTITY",
          name: "Test Touchpoint",
          category: "audio_ad",
          metrics: { impressions: 1000, unique_users: 500 },
          data_source: "mock",
        },
      ],
      created_at: "2025-12-30T00:00:00Z",
      updated_at: "2025-12-30T00:00:00Z",
    };

    const saved = await writeEntity(entity);
    expect(saved.entity_id).toBe("TEST-ENTITY");
    expect(saved.name).toBe("Test Entity");

    const ids = await listEntityIds();
    expect(ids).toEqual(["TEST-ENTITY"]);

    const all = await listEntities();
    expect(all.length).toBe(1);
    expect(all[0]?.entity_id).toBe("TEST-ENTITY");

    const loaded = await readEntity("TEST-ENTITY");
    expect(loaded?.entity_id).toBe("TEST-ENTITY");
    expect(loaded?.touchpoints.length).toBe(1);

    const deleted = await deleteEntity("TEST-ENTITY");
    expect(deleted).toBe(true);
    expect(await readEntity("TEST-ENTITY")).toBeNull();
  });

  it("returns null when reading a missing entity", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ENTITIES_DIR = tmpDir;
    expect(await readEntity("DOES_NOT_EXIST")).toBeNull();
  });

  it("returns false when deleting a non-existent entity", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ENTITIES_DIR = tmpDir;
    expect(await deleteEntity("DOES_NOT_EXIST")).toBe(false);
  });
});

describe("isEntity", () => {
  it("returns true for valid entities", () => {
    const valid: Entity = {
      entity_id: "TEST",
      name: "Test",
      type: "marketplace",
      touchpoints: [],
      created_at: "2025-12-30T00:00:00Z",
      updated_at: "2025-12-30T00:00:00Z",
    };
    expect(isEntity(valid)).toBe(true);
  });

  it("returns false for missing required fields", () => {
    expect(isEntity(null)).toBe(false);
    expect(isEntity({})).toBe(false);
    expect(isEntity({ entity_id: "TEST" })).toBe(false);
    expect(
      isEntity({
        entity_id: "TEST",
        name: "Test",
        type: "invalid_type", // invalid type
        touchpoints: [],
        created_at: "2025-12-30T00:00:00Z",
        updated_at: "2025-12-30T00:00:00Z",
      })
    ).toBe(false);
  });

  it("validates all entity types", () => {
    const types = ["radio", "marketplace", "news", "rewards", "internal"];
    for (const type of types) {
      const entity = {
        entity_id: "TEST",
        name: "Test",
        type,
        touchpoints: [],
        created_at: "2025-12-30T00:00:00Z",
        updated_at: "2025-12-30T00:00:00Z",
      };
      expect(isEntity(entity)).toBe(true);
    }
  });
});

describe("isTouchpoint", () => {
  it("returns true for valid touchpoints", () => {
    const valid = {
      touchpoint_id: "TP-001",
      entity_id: "TEST",
      name: "Test Touchpoint",
      category: "search",
      metrics: { impressions: 100, unique_users: 50 },
      data_source: "mock",
    };
    expect(isTouchpoint(valid)).toBe(true);
  });

  it("returns false for invalid touchpoints", () => {
    expect(isTouchpoint(null)).toBe(false);
    expect(isTouchpoint({})).toBe(false);
    expect(
      isTouchpoint({
        touchpoint_id: "TP-001",
        // missing required fields
      })
    ).toBe(false);
  });
});

describe("normalizeEntity", () => {
  it("trims whitespace from string fields", () => {
    const input: Entity = {
      entity_id: "  TEST  ",
      name: "  Test Entity  ",
      type: "radio",
      description: "  Description  ",
      touchpoints: [
        {
          touchpoint_id: "  TP-001  ",
          entity_id: "  TEST  ",
          name: "  Touchpoint  ",
          category: "  audio_ad  ",
          metrics: { impressions: 100, unique_users: 50 },
          data_source: "mock",
        },
      ],
      created_at: "2025-12-30T00:00:00Z",
      updated_at: "2025-12-30T00:00:00Z",
    };

    const normalized = normalizeEntity(input);
    expect(normalized.entity_id).toBe("TEST");
    expect(normalized.name).toBe("Test Entity");
    expect(normalized.description).toBe("Description");
    expect(normalized.touchpoints[0]?.touchpoint_id).toBe("TP-001");
    expect(normalized.touchpoints[0]?.entity_id).toBe("TEST");
    expect(normalized.touchpoints[0]?.name).toBe("Touchpoint");
    expect(normalized.touchpoints[0]?.category).toBe("audio_ad");
  });

  it("syncs touchpoint entity_id with parent entity_id", () => {
    const input: Entity = {
      entity_id: "PARENT",
      name: "Parent",
      type: "news",
      touchpoints: [
        {
          touchpoint_id: "TP-001",
          entity_id: "WRONG",
          name: "Touchpoint",
          category: "article_view",
          metrics: { impressions: 100, unique_users: 50 },
          data_source: "mock",
        },
      ],
      created_at: "2025-12-30T00:00:00Z",
      updated_at: "2025-12-30T00:00:00Z",
    };

    const normalized = normalizeEntity(input);
    expect(normalized.touchpoints[0]?.entity_id).toBe("PARENT");
  });

  it("updates updated_at timestamp", () => {
    const oldDate = "2020-01-01T00:00:00Z";
    const input: Entity = {
      entity_id: "TEST",
      name: "Test",
      type: "radio",
      touchpoints: [],
      created_at: oldDate,
      updated_at: oldDate,
    };

    const normalized = normalizeEntity(input);
    expect(normalized.created_at).toBe(oldDate);
    expect(normalized.updated_at).not.toBe(oldDate);
  });
});
