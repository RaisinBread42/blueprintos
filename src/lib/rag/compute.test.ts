import { describe, it, expect } from "vitest";
import {
  computeVariancePct,
  computeQaGap,
  computeFairPricingRag,
  computeWorldClassRag,
  computeStationRag,
  worstRag,
  RAG_THRESHOLDS,
} from "./compute";
import type { FairPricingMetrics, WorldClassMetrics, StationMetrics } from "@/types";

describe("computeVariancePct", () => {
  it("returns 0 when actual equals planned", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 10, labor_variance: 0 };
    expect(computeVariancePct(fp)).toBe(0);
  });

  it("returns positive percentage when over budget", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 12, labor_variance: 2 };
    expect(computeVariancePct(fp)).toBe(20); // 20% over
  });

  it("returns negative percentage when under budget", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 8, labor_variance: -2 };
    expect(computeVariancePct(fp)).toBe(-20); // 20% under
  });

  it("handles zero planned hours gracefully", () => {
    const fpWithActual: FairPricingMetrics = { planned_hrs: 0, actual_hrs: 5, labor_variance: 5 };
    expect(computeVariancePct(fpWithActual)).toBe(100);

    const fpNoActual: FairPricingMetrics = { planned_hrs: 0, actual_hrs: 0, labor_variance: 0 };
    expect(computeVariancePct(fpNoActual)).toBe(0);
  });
});

describe("computeQaGap", () => {
  it("returns positive when QA score above benchmark", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 8.5, standard_met: true, industry_benchmark: 7.5 };
    expect(computeQaGap(wc)).toBe(1);
  });

  it("returns negative when QA score below benchmark", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 6.5, standard_met: true, industry_benchmark: 7.5 };
    expect(computeQaGap(wc)).toBe(-1);
  });

  it("returns 0 when no benchmark defined", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 8.5, standard_met: true };
    expect(computeQaGap(wc)).toBe(0);
  });
});

describe("computeFairPricingRag", () => {
  it("returns green when at or under budget", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 10, labor_variance: 0 };
    expect(computeFairPricingRag(fp)).toBe("green");
  });

  it("returns green when slightly over budget (<=10%)", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 11, labor_variance: 1 };
    expect(computeFairPricingRag(fp)).toBe("green");
  });

  it("returns amber when moderately over budget (>10%, <=20%)", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 12, labor_variance: 2 };
    expect(computeFairPricingRag(fp)).toBe("amber");
  });

  it("returns red when significantly over budget (>20%)", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 13, labor_variance: 3 };
    expect(computeFairPricingRag(fp)).toBe("red");
  });

  it("returns green when under budget", () => {
    const fp: FairPricingMetrics = { planned_hrs: 10, actual_hrs: 5, labor_variance: -5 };
    expect(computeFairPricingRag(fp)).toBe("green");
  });
});

describe("computeWorldClassRag", () => {
  it("returns red when standard not met", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 9.0, standard_met: false, industry_benchmark: 7.5 };
    expect(computeWorldClassRag(wc)).toBe("red");
  });

  it("returns green when above benchmark", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 8.0, standard_met: true, industry_benchmark: 7.5 };
    expect(computeWorldClassRag(wc)).toBe("green");
  });

  it("returns amber when slightly below benchmark (<0, >=-1)", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 7.0, standard_met: true, industry_benchmark: 7.5 };
    expect(computeWorldClassRag(wc)).toBe("amber");
  });

  it("returns red when significantly below benchmark (<-1)", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 6.0, standard_met: true, industry_benchmark: 7.5 };
    expect(computeWorldClassRag(wc)).toBe("red");
  });

  it("returns green when no benchmark defined", () => {
    const wc: WorldClassMetrics = { internal_qa_score: 5.0, standard_met: true };
    expect(computeWorldClassRag(wc)).toBe("green");
  });
});

describe("worstRag", () => {
  it("returns red if any status is red", () => {
    expect(worstRag("green", "red", "amber")).toBe("red");
  });

  it("returns amber if worst is amber", () => {
    expect(worstRag("green", "amber", "green")).toBe("amber");
  });

  it("returns green if all are green", () => {
    expect(worstRag("green", "green")).toBe("green");
  });
});

describe("computeStationRag", () => {
  const greenMetrics: StationMetrics = {
    fair_pricing: { planned_hrs: 10, actual_hrs: 10, labor_variance: 0 },
    world_class: { internal_qa_score: 8.0, standard_met: true, industry_benchmark: 7.5 },
    performance_proof: {},
  };

  const amberMetrics: StationMetrics = {
    fair_pricing: { planned_hrs: 10, actual_hrs: 12, labor_variance: 2 }, // 20% over = amber
    world_class: { internal_qa_score: 8.0, standard_met: true, industry_benchmark: 7.5 },
    performance_proof: {},
  };

  const redMetrics: StationMetrics = {
    fair_pricing: { planned_hrs: 10, actual_hrs: 10, labor_variance: 0 },
    world_class: { internal_qa_score: 8.0, standard_met: false, industry_benchmark: 7.5 }, // standard not met
    performance_proof: {},
  };

  it("returns green for healthy station", () => {
    expect(computeStationRag(greenMetrics)).toBe("green");
  });

  it("returns amber for warning station", () => {
    expect(computeStationRag(amberMetrics)).toBe("amber");
  });

  it("returns red for critical station", () => {
    expect(computeStationRag(redMetrics)).toBe("red");
  });

  it("uses explicit RAG when provided", () => {
    expect(computeStationRag(greenMetrics, "red")).toBe("red");
    expect(computeStationRag(redMetrics, "green")).toBe("green");
  });

  it("returns worst of fair pricing and world class", () => {
    const mixedMetrics: StationMetrics = {
      fair_pricing: { planned_hrs: 10, actual_hrs: 15, labor_variance: 5 }, // 50% over = red
      world_class: { internal_qa_score: 7.0, standard_met: true, industry_benchmark: 7.5 }, // amber
      performance_proof: {},
    };
    expect(computeStationRag(mixedMetrics)).toBe("red");
  });
});

describe("RAG_THRESHOLDS", () => {
  it("has expected threshold values", () => {
    expect(RAG_THRESHOLDS.fairPricing.redVariancePct).toBe(20);
    expect(RAG_THRESHOLDS.fairPricing.amberVariancePct).toBe(10);
    expect(RAG_THRESHOLDS.worldClass.redQaGap).toBe(-1);
    expect(RAG_THRESHOLDS.worldClass.amberQaGap).toBe(0);
  });
});



