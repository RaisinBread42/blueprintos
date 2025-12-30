import { afterEach, describe, expect, it } from "vitest";

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { JourneySnapshot } from "@/types";
import {
  deleteSnapshot,
  isAttributionEdge,
  isGapOpportunity,
  isJourneyInsights,
  isJourneySnapshot,
  listSnapshotIds,
  listSnapshots,
  normalizeSnapshot,
  readSnapshot,
  writeSnapshot,
} from "@/lib/storage/attribution";

async function mkTmpDir() {
  return await fs.mkdtemp(
    path.join(os.tmpdir(), "blueprintos-attribution-test-")
  );
}

const validSnapshot: JourneySnapshot = {
  snapshot_id: "2025-TEST",
  period: "2025-TEST",
  period_type: "monthly",
  entities: ["STINGRAY", "ECAYTRADE"],
  edges: [
    {
      id: "E-001",
      source_touchpoint_id: "TP-A",
      target_touchpoint_id: "TP-B",
      period: "2025-TEST",
      metrics: {
        users_flowed: 100,
        conversion_rate: 0.1,
      },
      attribution_model: "last_touch",
    },
  ],
  computed_at: "2025-12-30T00:00:00Z",
  insights: {
    highest_conversion_path: ["TP-A", "TP-B"],
    biggest_bridge: "TP-A",
    gap_opportunities: [
      {
        touchpoint_id: "TP-B",
        search_demand: 500,
        supply_count: 10,
        gap_score: 0.98,
        recommended_action: "Recruit more suppliers",
      },
    ],
  },
};

describe("storage/attribution", () => {
  let tmpDir: string | null = null;

  afterEach(async () => {
    delete process.env.BLUEPRINTOS_ATTRIBUTION_DIR;
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it("writes, reads, lists, and deletes snapshots", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ATTRIBUTION_DIR = tmpDir;

    const saved = await writeSnapshot(validSnapshot);
    expect(saved.snapshot_id).toBe("2025-TEST");

    const ids = await listSnapshotIds();
    expect(ids).toEqual(["2025-TEST"]);

    const all = await listSnapshots();
    expect(all.length).toBe(1);
    expect(all[0]?.snapshot_id).toBe("2025-TEST");

    const loaded = await readSnapshot("2025-TEST");
    expect(loaded?.snapshot_id).toBe("2025-TEST");
    expect(loaded?.edges.length).toBe(1);

    const deleted = await deleteSnapshot("2025-TEST");
    expect(deleted).toBe(true);
    expect(await readSnapshot("2025-TEST")).toBeNull();
  });

  it("returns null when reading a missing snapshot", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ATTRIBUTION_DIR = tmpDir;
    expect(await readSnapshot("DOES_NOT_EXIST")).toBeNull();
  });

  it("returns false when deleting a non-existent snapshot", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ATTRIBUTION_DIR = tmpDir;
    expect(await deleteSnapshot("DOES_NOT_EXIST")).toBe(false);
  });

  it("supports weekly snapshot IDs with W format", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_ATTRIBUTION_DIR = tmpDir;

    const weeklySnapshot: JourneySnapshot = {
      ...validSnapshot,
      snapshot_id: "2025-W01",
      period: "2025-W01",
      period_type: "weekly",
    };

    const saved = await writeSnapshot(weeklySnapshot);
    expect(saved.snapshot_id).toBe("2025-W01");

    const loaded = await readSnapshot("2025-W01");
    expect(loaded?.period_type).toBe("weekly");
  });
});

describe("isAttributionEdge", () => {
  it("returns true for valid edges", () => {
    const valid = {
      id: "E-001",
      source_touchpoint_id: "TP-A",
      target_touchpoint_id: "TP-B",
      period: "2025-01",
      metrics: { users_flowed: 100, conversion_rate: 0.1 },
      attribution_model: "last_touch",
    };
    expect(isAttributionEdge(valid)).toBe(true);
  });

  it("returns false for invalid edges", () => {
    expect(isAttributionEdge(null)).toBe(false);
    expect(isAttributionEdge({})).toBe(false);
    expect(
      isAttributionEdge({
        id: "E-001",
        source_touchpoint_id: "TP-A",
        // missing fields
      })
    ).toBe(false);
    expect(
      isAttributionEdge({
        id: "E-001",
        source_touchpoint_id: "TP-A",
        target_touchpoint_id: "TP-B",
        period: "2025-01",
        metrics: { users_flowed: 100, conversion_rate: 0.1 },
        attribution_model: "invalid_model",
      })
    ).toBe(false);
  });

  it("validates all attribution models", () => {
    const models = ["first_touch", "last_touch", "linear", "time_decay"];
    for (const model of models) {
      const edge = {
        id: "E-001",
        source_touchpoint_id: "TP-A",
        target_touchpoint_id: "TP-B",
        period: "2025-01",
        metrics: { users_flowed: 100, conversion_rate: 0.1 },
        attribution_model: model,
      };
      expect(isAttributionEdge(edge)).toBe(true);
    }
  });
});

describe("isGapOpportunity", () => {
  it("returns true for valid gap opportunities", () => {
    const valid = {
      touchpoint_id: "TP-A",
      search_demand: 500,
      supply_count: 10,
      gap_score: 0.98,
      recommended_action: "Do something",
    };
    expect(isGapOpportunity(valid)).toBe(true);
  });

  it("returns false for invalid gap opportunities", () => {
    expect(isGapOpportunity(null)).toBe(false);
    expect(isGapOpportunity({})).toBe(false);
  });
});

describe("isJourneyInsights", () => {
  it("returns true for valid insights", () => {
    const valid = {
      highest_conversion_path: ["TP-A", "TP-B"],
      biggest_bridge: "TP-A",
      gap_opportunities: [],
    };
    expect(isJourneyInsights(valid)).toBe(true);
  });

  it("allows undefined biggest_bridge", () => {
    const valid = {
      highest_conversion_path: [],
      gap_opportunities: [],
    };
    expect(isJourneyInsights(valid)).toBe(true);
  });
});

describe("isJourneySnapshot", () => {
  it("returns true for valid snapshots", () => {
    expect(isJourneySnapshot(validSnapshot)).toBe(true);
  });

  it("returns false for missing required fields", () => {
    expect(isJourneySnapshot(null)).toBe(false);
    expect(isJourneySnapshot({})).toBe(false);
  });

  it("validates period types", () => {
    const types = ["weekly", "monthly", "quarterly"];
    for (const type of types) {
      const snapshot = { ...validSnapshot, period_type: type };
      expect(isJourneySnapshot(snapshot)).toBe(true);
    }
    expect(
      isJourneySnapshot({ ...validSnapshot, period_type: "invalid" })
    ).toBe(false);
  });
});

describe("normalizeSnapshot", () => {
  it("trims whitespace from string fields", () => {
    const input: JourneySnapshot = {
      ...validSnapshot,
      snapshot_id: "  2025-TEST  ",
      period: "  2025-TEST  ",
      entities: ["  STINGRAY  ", "  ECAYTRADE  "],
    };

    const normalized = normalizeSnapshot(input);
    expect(normalized.snapshot_id).toBe("2025-TEST");
    expect(normalized.period).toBe("2025-TEST");
    expect(normalized.entities).toEqual(["STINGRAY", "ECAYTRADE"]);
  });

  it("trims edge fields", () => {
    const input: JourneySnapshot = {
      ...validSnapshot,
      edges: [
        {
          ...validSnapshot.edges[0],
          id: "  E-001  ",
          source_touchpoint_id: "  TP-A  ",
          target_touchpoint_id: "  TP-B  ",
        },
      ],
    };

    const normalized = normalizeSnapshot(input);
    expect(normalized.edges[0]?.id).toBe("E-001");
    expect(normalized.edges[0]?.source_touchpoint_id).toBe("TP-A");
    expect(normalized.edges[0]?.target_touchpoint_id).toBe("TP-B");
  });
});
