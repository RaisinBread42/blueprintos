import { describe, expect, it } from "vitest";

import { isServiceLine } from "@/lib/blueprint/validate";

describe("blueprint/validate", () => {
  it("accepts a minimal valid ServiceLine shape", () => {
    const value: unknown = {
      service_line_id: "SL_TEST",
      name: "Test",
      created_at: "2025-12-27T00:00:00.000Z",
      updated_at: "2025-12-27T00:00:00.000Z",
      nodes: [
        {
          station_id: "S1",
          name: "Station 1",
          data_source: "mock",
          metrics: {
            fair_pricing: { planned_hrs: 1, actual_hrs: 2, labor_variance: 1 },
            world_class: { internal_qa_score: 8, standard_met: true },
            performance_proof: {},
          },
        },
      ],
      edges: [
        {
          id: "S1->S1",
          source_station_id: "S1",
          target_station_id: "S1",
          weight: { cost: 1, time: 1 },
        },
      ],
    };

    expect(isServiceLine(value)).toBe(true);
  });

  it("rejects missing required fields", () => {
    const value: unknown = { name: "Missing ID" };
    expect(isServiceLine(value)).toBe(false);
  });
});


