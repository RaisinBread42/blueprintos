import type { StationMetrics, FairPricingMetrics, WorldClassMetrics, PerformanceProofMetrics } from "@/types";

type NumberRange = [number, number];

/** Deep partial for StationMetrics overrides */
type MetricsOverrides = {
  fair_pricing?: Partial<FairPricingMetrics>;
  world_class?: Partial<WorldClassMetrics>;
  performance_proof?: Partial<PerformanceProofMetrics>;
};

const HOURS_PLANNED: NumberRange = [8, 40];
const VARIANCE_PCT: NumberRange = [-20, 25]; // -20% under to +25% over
const QA_SCORE: NumberRange = [6, 9.8];
const QA_BENCHMARK: NumberRange = [7, 8.5];
const ENGAGEMENT_RATE: NumberRange = [0.5, 5]; // percentage points
const CONVERSION_RATE: NumberRange = [0.5, 8]; // percentage points
const ROI: NumberRange = [0.8, 2.2];
const MARKET_RATE_PER_HR: NumberRange = [70, 120];

function randomBetween([min, max]: NumberRange): number {
  return Math.random() * (max - min) + min;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Generate synthetic station metrics with realistic-ish ranges.
 * Accepts optional partial overrides to bias or force values.
 */
export function generateSyntheticMetrics(
  overrides: MetricsOverrides = {}
): StationMetrics {
  const planned_hrs =
    overrides.fair_pricing?.planned_hrs ??
    round1(randomBetween(HOURS_PLANNED));

  const variancePct = randomBetween(VARIANCE_PCT) / 100;
  const actual_hrs_raw = planned_hrs * (1 + variancePct);
  const actual_hrs =
    overrides.fair_pricing?.actual_hrs ?? round1(Math.max(0, actual_hrs_raw));

  const labor_variance =
    overrides.fair_pricing?.labor_variance ??
    round1(actual_hrs - planned_hrs);

  const market_rate =
    overrides.fair_pricing?.market_value !== undefined
      ? undefined
      : randomBetween(MARKET_RATE_PER_HR);
  const market_value =
    overrides.fair_pricing?.market_value ??
    round1(planned_hrs * market_rate!);

  const qa_score =
    overrides.world_class?.internal_qa_score ??
    round1(randomBetween(QA_SCORE));
  const qa_benchmark =
    overrides.world_class?.industry_benchmark ??
    round1(randomBetween(QA_BENCHMARK));
  const standard_met =
    overrides.world_class?.standard_met ??
    qa_score >= qa_benchmark;

  const engagement_rate =
    overrides.performance_proof?.engagement_rate ??
    round1(randomBetween(ENGAGEMENT_RATE)) / 100;
  const conversion_rate =
    overrides.performance_proof?.conversion_rate ??
    round1(randomBetween(CONVERSION_RATE)) / 100;
  const roi =
    overrides.performance_proof?.roi ??
    round1(randomBetween(ROI));

  return {
    fair_pricing: {
      planned_hrs,
      actual_hrs,
      labor_variance,
      market_value,
      ...overrides.fair_pricing,
    },
    world_class: {
      internal_qa_score: qa_score,
      industry_benchmark: qa_benchmark,
      standard_met,
      ...overrides.world_class,
    },
    performance_proof: {
      engagement_rate,
      conversion_rate,
      roi,
      ...overrides.performance_proof,
    },
  };
}




