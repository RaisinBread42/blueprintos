import type { ServiceLine, StationMetrics, RAGStatus } from "@/types";
import { computeStationRag, worstRag } from "./compute";

export interface ServiceLineRollup {
  total_planned_hrs: number;
  total_actual_hrs: number;
  total_variance_hrs: number;
  variance_pct: number;
  avg_qa_score: number;
  stations_at_standard: number;
  total_stations: number;
  overall_rag: RAGStatus;
}

/**
 * Compute rollup metrics for a service line.
 */
export function computeServiceLineRollup(
  serviceLine: ServiceLine
): ServiceLineRollup {
  const nodes = serviceLine?.nodes ?? [];

  if (nodes.length === 0) {
    return {
      total_planned_hrs: 0,
      total_actual_hrs: 0,
      total_variance_hrs: 0,
      variance_pct: 0,
      avg_qa_score: 0,
      stations_at_standard: 0,
      total_stations: 0,
      overall_rag: "green",
    };
  }

  const totals = nodes.reduce(
    (acc, node) => {
      const m: StationMetrics = node.metrics;
      acc.total_planned_hrs += m.fair_pricing.planned_hrs;
      acc.total_actual_hrs += m.fair_pricing.actual_hrs;
      acc.total_variance_hrs += m.fair_pricing.labor_variance;
      acc.total_qa += m.world_class.internal_qa_score;
      acc.stations_at_standard += m.world_class.standard_met ? 1 : 0;
      acc.count += 1;
      return acc;
    },
    {
      total_planned_hrs: 0,
      total_actual_hrs: 0,
      total_variance_hrs: 0,
      total_qa: 0,
      stations_at_standard: 0,
      count: 0,
    }
  );

  const variance_pct =
    totals.total_planned_hrs === 0
      ? 0
      : ((totals.total_actual_hrs - totals.total_planned_hrs) /
          totals.total_planned_hrs) *
        100;

  // Overall RAG is the worst station RAG
  const overall_rag = nodes.reduce<RAGStatus>(
    (acc, node) => {
      const nodeRag = computeStationRag(node.metrics, node.rag_status);
      return worstRag(acc, nodeRag);
    },
    "green"
  );

  return {
    total_planned_hrs: totals.total_planned_hrs,
    total_actual_hrs: totals.total_actual_hrs,
    total_variance_hrs: totals.total_variance_hrs,
    variance_pct,
    avg_qa_score: totals.count ? totals.total_qa / totals.count : 0,
    stations_at_standard: totals.stations_at_standard,
    total_stations: totals.count,
    overall_rag,
  };
}

