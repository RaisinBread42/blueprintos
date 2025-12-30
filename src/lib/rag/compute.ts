/**
 * RAG (Red-Amber-Green) Computation Module
 *
 * Computes RAG status for stations based on Fair Pricing and World Class metrics.
 *
 * Thresholds:
 * - Fair Pricing: variance_pct = (actual_hrs - planned_hrs) / planned_hrs * 100
 *   - Red:   variance_pct > 20%
 *   - Amber: variance_pct > 10%
 *   - Green: otherwise
 *
 * - World Class: qa_gap = internal_qa_score - industry_benchmark
 *   - Red:   standard_met = false OR qa_gap < -1
 *   - Amber: qa_gap < 0
 *   - Green: otherwise
 *
 * Final RAG = worst of (Fair Pricing RAG, World Class RAG)
 */

import type { RAGStatus, StationMetrics, FairPricingMetrics, WorldClassMetrics } from "@/types";

/**
 * RAG threshold configuration (can be made configurable later)
 */
export const RAG_THRESHOLDS = {
  fairPricing: {
    redVariancePct: 20,    // > 20% over budget = red
    amberVariancePct: 10,  // > 10% over budget = amber
  },
  worldClass: {
    redQaGap: -1,          // QA score more than 1 below benchmark = red
    amberQaGap: 0,         // QA score below benchmark = amber
  },
} as const;

/**
 * Compute variance percentage from fair pricing metrics.
 * Returns the percentage over/under budget.
 * Positive = over budget, Negative = under budget.
 */
export function computeVariancePct(fairPricing: FairPricingMetrics): number {
  const { planned_hrs, actual_hrs } = fairPricing;
  if (planned_hrs === 0) {
    // Avoid division by zero - if no planned hours, any actual is 100% over
    return actual_hrs > 0 ? 100 : 0;
  }
  return ((actual_hrs - planned_hrs) / planned_hrs) * 100;
}

/**
 * Compute QA gap from world class metrics.
 * Returns the difference between QA score and benchmark.
 * Positive = above benchmark, Negative = below benchmark.
 */
export function computeQaGap(worldClass: WorldClassMetrics): number {
  const { internal_qa_score, industry_benchmark } = worldClass;
  // If no benchmark defined, assume score is meeting it
  if (industry_benchmark === undefined) {
    return 0;
  }
  return internal_qa_score - industry_benchmark;
}

/**
 * Compute RAG status for Fair Pricing metrics.
 */
export function computeFairPricingRag(fairPricing: FairPricingMetrics): RAGStatus {
  const variancePct = computeVariancePct(fairPricing);
  
  if (variancePct > RAG_THRESHOLDS.fairPricing.redVariancePct) {
    return "red";
  }
  if (variancePct > RAG_THRESHOLDS.fairPricing.amberVariancePct) {
    return "amber";
  }
  return "green";
}

/**
 * Compute RAG status for World Class metrics.
 */
export function computeWorldClassRag(worldClass: WorldClassMetrics): RAGStatus {
  // If standard not met, always red
  if (!worldClass.standard_met) {
    return "red";
  }
  
  const qaGap = computeQaGap(worldClass);
  
  if (qaGap < RAG_THRESHOLDS.worldClass.redQaGap) {
    return "red";
  }
  if (qaGap < RAG_THRESHOLDS.worldClass.amberQaGap) {
    return "amber";
  }
  return "green";
}

/**
 * Get the worst RAG status from multiple statuses.
 * Order: red > amber > green
 */
export function worstRag(...statuses: RAGStatus[]): RAGStatus {
  if (statuses.includes("red")) return "red";
  if (statuses.includes("amber")) return "amber";
  return "green";
}

/**
 * Compute overall RAG status for a station based on its metrics.
 * Returns the worst of Fair Pricing and World Class RAG.
 *
 * If the station has an explicit rag_status set, that takes precedence.
 */
export function computeStationRag(
  metrics: StationMetrics,
  explicitRag?: RAGStatus
): RAGStatus {
  // Explicit RAG takes precedence
  if (explicitRag) {
    return explicitRag;
  }

  const fairPricingRag = computeFairPricingRag(metrics.fair_pricing);
  const worldClassRag = computeWorldClassRag(metrics.world_class);

  return worstRag(fairPricingRag, worldClassRag);
}

/**
 * RAG status display information
 */
export const RAG_DISPLAY = {
  green: {
    label: "Healthy",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bgSolid: "bg-emerald-500",
  },
  amber: {
    label: "Warning",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    bgSolid: "bg-amber-500",
  },
  red: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    bgSolid: "bg-red-500",
  },
} as const;

/**
 * Get display properties for a RAG status
 */
export function getRagDisplay(status: RAGStatus) {
  return RAG_DISPLAY[status];
}





