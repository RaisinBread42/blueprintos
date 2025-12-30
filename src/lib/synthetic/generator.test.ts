import { describe, it, expect } from "vitest";
import { generateSyntheticMetrics } from "./generator";

describe("generateSyntheticMetrics", () => {
  it("produces fair pricing with non-negative hours and correct variance", () => {
    const m = generateSyntheticMetrics();
    expect(m.fair_pricing.planned_hrs).toBeGreaterThan(0);
    expect(m.fair_pricing.actual_hrs).toBeGreaterThanOrEqual(0);
    expect(m.fair_pricing.labor_variance).toBeCloseTo(
      m.fair_pricing.actual_hrs - m.fair_pricing.planned_hrs,
      1
    );
  });

  it("sets standard_met based on QA vs benchmark when not overridden", () => {
    const m = generateSyntheticMetrics({
      world_class: { internal_qa_score: 7.5, industry_benchmark: 8.0 },
    });
    expect(m.world_class.standard_met).toBe(false);
  });

  it("respects overrides for provided fields", () => {
    const m = generateSyntheticMetrics({
      fair_pricing: { planned_hrs: 10, actual_hrs: 5, labor_variance: -5 },
      world_class: { internal_qa_score: 9, industry_benchmark: 7, standard_met: true },
    });
    expect(m.fair_pricing.planned_hrs).toBe(10);
    expect(m.fair_pricing.labor_variance).toBe(-5);
    expect(m.world_class.standard_met).toBe(true);
  });
});




