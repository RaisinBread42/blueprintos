import { describe, expect, it, vi } from "vitest";

import { computeLaborVariance, normalizeServiceLine } from "@/lib/blueprint/normalize";
import type { ServiceLine } from "@/types";

describe("blueprint/normalize", () => {
  it("computeLaborVariance returns actual - planned", () => {
    expect(computeLaborVariance({ planned_hrs: 10, actual_hrs: 12 })).toBe(2);
    expect(computeLaborVariance({ planned_hrs: 10, actual_hrs: 8 })).toBe(-2);
  });

  it("normalizeServiceLine recomputes labor_variance and updates updated_at", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-27T12:00:00.000Z"));

    const input: ServiceLine = {
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
            fair_pricing: { planned_hrs: 5, actual_hrs: 9, labor_variance: 0 },
            world_class: { internal_qa_score: 8, standard_met: true },
            performance_proof: {},
          },
        },
      ],
      edges: [],
    };

    const out = normalizeServiceLine(input);
    expect(out.updated_at).toBe("2025-12-27T12:00:00.000Z");
    expect(out.nodes[0]?.metrics.fair_pricing.labor_variance).toBe(4);

    vi.useRealTimers();
  });
});


