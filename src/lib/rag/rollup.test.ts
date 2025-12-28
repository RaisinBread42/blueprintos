import { describe, it, expect } from "vitest";
import { computeServiceLineRollup } from "./rollup";
import type { ServiceLine } from "@/types";

const baseServiceLine: ServiceLine = {
  service_line_id: "SL-TEST",
  name: "Test Line",
  description: "",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  nodes: [],
  edges: [],
};

const makeStation = (
  id: string,
  {
    planned_hrs,
    actual_hrs,
    labor_variance,
    qa,
    standard_met = true,
    benchmark = 7.5,
    rag_status,
  }: {
    planned_hrs: number;
    actual_hrs: number;
    labor_variance: number;
    qa: number;
    standard_met?: boolean;
    benchmark?: number;
    rag_status?: "red" | "amber" | "green";
  }
) => ({
  station_id: id,
  name: id,
  data_source: "mock" as const,
  metrics: {
    fair_pricing: { planned_hrs, actual_hrs, labor_variance },
    world_class: { internal_qa_score: qa, standard_met, industry_benchmark: benchmark },
    performance_proof: {},
  },
  rag_status,
});

describe("computeServiceLineRollup", () => {
  it("aggregates totals and averages", () => {
    const sl: ServiceLine = {
      ...baseServiceLine,
      nodes: [
        // 10% over (not >10%), stays green
        makeStation("A", { planned_hrs: 10, actual_hrs: 11, labor_variance: 1, qa: 8 }),
        // Under budget
        makeStation("B", { planned_hrs: 20, actual_hrs: 18, labor_variance: -2, qa: 7.5 }),
      ],
    };

    const rollup = computeServiceLineRollup(sl);
    expect(rollup.total_planned_hrs).toBe(30);
    expect(rollup.total_actual_hrs).toBe(29);
    expect(rollup.total_variance_hrs).toBe(-1);
    expect(rollup.variance_pct).toBeCloseTo(-3.33, 2);
    expect(rollup.avg_qa_score).toBeCloseTo(7.75);
    expect(rollup.stations_at_standard).toBe(2);
    expect(rollup.total_stations).toBe(2);
    expect(rollup.overall_rag).toBe("green");
  });

  it("handles worst RAG from stations", () => {
    const sl: ServiceLine = {
      ...baseServiceLine,
      nodes: [
        makeStation("A", { planned_hrs: 10, actual_hrs: 15, labor_variance: 5, qa: 8 }), // red on fair pricing
        makeStation("B", { planned_hrs: 20, actual_hrs: 18, labor_variance: -2, qa: 7.5 }),
      ],
    };

    const rollup = computeServiceLineRollup(sl);
    expect(rollup.overall_rag).toBe("red");
  });

  it("handles explicit rag_status on nodes", () => {
    const sl: ServiceLine = {
      ...baseServiceLine,
      nodes: [
        makeStation("A", { planned_hrs: 10, actual_hrs: 10, labor_variance: 0, qa: 8, rag_status: "amber" }),
        makeStation("B", { planned_hrs: 10, actual_hrs: 10, labor_variance: 0, qa: 8 }),
      ],
    };

    const rollup = computeServiceLineRollup(sl);
    expect(rollup.overall_rag).toBe("amber");
  });

  it("handles zero planned hours for variance pct", () => {
    const sl: ServiceLine = {
      ...baseServiceLine,
      nodes: [
        makeStation("A", { planned_hrs: 0, actual_hrs: 5, labor_variance: 5, qa: 8 }),
      ],
    };
    const rollup = computeServiceLineRollup(sl);
    expect(rollup.variance_pct).toBe(0); // defined as 0 when no planned hrs
  });
});

