import { afterEach, describe, expect, it } from "vitest";

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import type { ServiceLine } from "@/types";
import { deleteServiceLine, listServiceLineIds, readServiceLine, writeServiceLine } from "@/lib/storage/serviceLines";

async function mkTmpDir() {
  return await fs.mkdtemp(path.join(os.tmpdir(), "blueprintos-test-"));
}

describe("storage/serviceLines", () => {
  let tmpDir: string | null = null;

  afterEach(async () => {
    delete process.env.BLUEPRINTOS_SERVICE_LINES_DIR;
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
      tmpDir = null;
    }
  });

  it("writes, reads, lists, and deletes service lines in a configured directory", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_SERVICE_LINES_DIR = tmpDir;

    const sl: ServiceLine = {
      service_line_id: "SL_TEST",
      name: "Test",
      description: "Test service line",
      created_at: "2025-12-27T00:00:00.000Z",
      updated_at: "2025-12-27T00:00:00.000Z",
      nodes: [
        {
          station_id: "S1",
          name: "Station 1",
          data_source: "mock",
          metrics: {
            fair_pricing: { planned_hrs: 1, actual_hrs: 2, labor_variance: 999 },
            world_class: { internal_qa_score: 8, standard_met: true },
            performance_proof: {},
          },
        },
      ],
      edges: [],
    };

    const saved = await writeServiceLine(sl);
    // labor_variance should be normalized (actual - planned)
    expect(saved.nodes[0]?.metrics.fair_pricing.labor_variance).toBe(1);

    const ids = await listServiceLineIds();
    expect(ids).toEqual(["SL_TEST"]);

    const loaded = await readServiceLine("SL_TEST");
    expect(loaded?.service_line_id).toBe("SL_TEST");

    const deleted = await deleteServiceLine("SL_TEST");
    expect(deleted).toBe(true);
    expect(await readServiceLine("SL_TEST")).toBeNull();
  });

  it("returns null when reading a missing service line", async () => {
    tmpDir = await mkTmpDir();
    process.env.BLUEPRINTOS_SERVICE_LINES_DIR = tmpDir;
    expect(await readServiceLine("DOES_NOT_EXIST")).toBeNull();
  });
});


