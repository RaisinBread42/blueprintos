import type { FairPricingMetrics, ServiceLine, Station, StationMetrics } from "@/types";

export function computeLaborVariance(fairPricing: Pick<FairPricingMetrics, "planned_hrs" | "actual_hrs">) {
  return fairPricing.actual_hrs - fairPricing.planned_hrs;
}

export function normalizeStationMetrics(metrics: StationMetrics): StationMetrics {
  const labor_variance = computeLaborVariance(metrics.fair_pricing);
  return {
    ...metrics,
    fair_pricing: {
      ...metrics.fair_pricing,
      labor_variance,
    },
  };
}

export function normalizeStation(station: Station): Station {
  return {
    ...station,
    metrics: normalizeStationMetrics(station.metrics),
  };
}

export function normalizeServiceLine(serviceLine: ServiceLine): ServiceLine {
  const now = new Date().toISOString();
  return {
    ...serviceLine,
    nodes: serviceLine.nodes.map(normalizeStation),
    updated_at: now,
  };
}


