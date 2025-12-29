import type { ServiceLine, StationMetrics } from "@/types";

export interface ScenarioDeltas {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
}

export const defaultScenario: ScenarioDeltas = {
  laborDelta: 0,
  timeDelta: 0,
  qualityDelta: 0,
};

export function applyScenarioToMetrics(metrics: StationMetrics, scenario: ScenarioDeltas): StationMetrics {
  const planned = Math.max(0, metrics.fair_pricing.planned_hrs + scenario.timeDelta);
  const actual = Math.max(0, metrics.fair_pricing.actual_hrs + scenario.laborDelta);
  const labor_variance = actual - planned;

  const qa_score = Math.min(10, Math.max(0, metrics.world_class.internal_qa_score + scenario.qualityDelta));
  const benchmark =
    metrics.world_class.industry_benchmark !== undefined
      ? Math.min(10, Math.max(0, metrics.world_class.industry_benchmark + scenario.qualityDelta))
      : undefined;
  const standard_met = benchmark === undefined ? metrics.world_class.standard_met : qa_score >= benchmark;

  return {
    fair_pricing: {
      ...metrics.fair_pricing,
      planned_hrs: planned,
      actual_hrs: actual,
      labor_variance,
    },
    world_class: {
      ...metrics.world_class,
      internal_qa_score: qa_score,
      industry_benchmark: benchmark,
      standard_met,
    },
    performance_proof: { ...metrics.performance_proof },
  };
}

export function applyScenarioToServiceLine(serviceLine: ServiceLine, scenario: ScenarioDeltas): ServiceLine {
  return {
    ...serviceLine,
    nodes: serviceLine.nodes.map((n) => ({
      ...n,
      metrics: applyScenarioToMetrics(n.metrics, scenario),
    })),
  };
}

