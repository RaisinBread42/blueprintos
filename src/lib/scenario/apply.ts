import type { ServiceLine, StationMetrics } from "@/types";

export interface ScenarioDeltas {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
}

export interface ScenarioConfig {
  global: ScenarioDeltas;
  byStation?: Record<string, ScenarioDeltas>;
}

export type ScenarioLike = ScenarioDeltas | ScenarioConfig | undefined;

export const defaultScenario: ScenarioDeltas = {
  laborDelta: 0,
  timeDelta: 0,
  qualityDelta: 0,
};

export const defaultScenarioConfig: ScenarioConfig = {
  global: defaultScenario,
  byStation: {},
};

function normalizeScenario(input: ScenarioLike): ScenarioConfig {
  if (!input) return defaultScenarioConfig;
  // Already a config
  if ((input as ScenarioConfig).global) {
    const cfg = input as ScenarioConfig;
    return {
      global: cfg.global ?? defaultScenario,
      byStation: cfg.byStation ?? {},
    };
  }
  // Legacy deltas shape
  const deltas = input as ScenarioDeltas;
  return { global: { ...defaultScenario, ...deltas }, byStation: {} };
}

export function applyScenarioToMetrics(
  metrics: StationMetrics,
  scenario: ScenarioLike,
  stationId?: string
): StationMetrics {
  const cfg = normalizeScenario(scenario);
  const stationOverride = stationId ? cfg.byStation?.[stationId] : undefined;
  const deltas = stationOverride ?? cfg.global ?? defaultScenario;

  const planned = Math.max(0, metrics.fair_pricing.planned_hrs + deltas.timeDelta);
  const actual = Math.max(0, metrics.fair_pricing.actual_hrs + deltas.laborDelta);
  const labor_variance = actual - planned;

  const qa_score = Math.min(10, Math.max(0, metrics.world_class.internal_qa_score + deltas.qualityDelta));
  const benchmark =
    metrics.world_class.industry_benchmark !== undefined
      ? Math.min(10, Math.max(0, metrics.world_class.industry_benchmark + deltas.qualityDelta))
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

export function applyScenarioToServiceLine(serviceLine: ServiceLine, scenario: ScenarioLike): ServiceLine {
  return {
    ...serviceLine,
    nodes: serviceLine.nodes.map((n) => ({
      ...n,
      metrics: applyScenarioToMetrics(n.metrics, scenario, n.station_id),
    })),
  };
}

