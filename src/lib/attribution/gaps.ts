/**
 * Gap Analysis Engine
 * Computes demand vs supply gaps for marketplace optimization
 */

import type { GapOpportunity } from "@/types";

/**
 * Raw category data for gap computation
 */
export interface CategoryData {
  category: string;
  touchpoint_id: string;
  search_demand: number;
  supply_count: number;
  trend?: "rising" | "stable" | "falling";
}

/**
 * Compute gap score from demand and supply
 * Score ranges from 0 (oversupplied) to 1 (severely undersupplied)
 */
export function computeGapScore(demand: number, supply: number): number {
  if (demand === 0) return 0;
  if (supply === 0) return 1;

  // Ratio of demand to supply, normalized
  const ratio = demand / supply;

  // Score: 0 when supply >= demand, approaches 1 as demand >> supply
  // Using sigmoid-like curve for smooth scoring
  if (ratio <= 1) return 0;

  // For ratio > 1, scale to 0-1 range
  // ratio of 2 = 0.5, ratio of 5 = 0.8, ratio of 10 = 0.9
  return 1 - (1 / ratio);
}

/**
 * Generate recommended action based on gap analysis
 */
export function generateRecommendation(
  category: string,
  gapScore: number
): string {
  if (gapScore >= 0.8) {
    return `Improve ${category} supply - critical gap detected.`;
  }
  if (gapScore >= 0.6) {
    return `Improve ${category} supply - high demand detected.`;
  }
  if (gapScore >= 0.3) {
    return `Consider improving ${category} supply.`;
  }
  return `${category} supply is adequate.`;
}

/**
 * Convert category data to gap opportunities
 */
export function categoriesToGapOpportunities(
  categories: CategoryData[]
): GapOpportunity[] {
  return categories
    .map((cat) => {
      const gapScore = computeGapScore(cat.search_demand, cat.supply_count);

      return {
        touchpoint_id: cat.touchpoint_id,
        category: cat.category,
        search_demand: cat.search_demand,
        supply_count: cat.supply_count,
        gap_score: Math.round(gapScore * 100) / 100,
        trend: cat.trend ?? "stable",
        recommended_action: generateRecommendation(cat.category, gapScore),
      };
    })
    .sort((a, b) => b.gap_score - a.gap_score);
}

/**
 * Mock eCayTrade category data for demonstration
 */
export const MOCK_ECAYTRADE_CATEGORIES: CategoryData[] = [
  {
    category: "Solar Panels & Equipment",
    touchpoint_id: "ECAY-SOLAR-SEARCH",
    search_demand: 520,
    supply_count: 12,
    trend: "rising",
  },
  {
    category: "Electric Vehicles",
    touchpoint_id: "ECAY-EV-SEARCH",
    search_demand: 340,
    supply_count: 8,
    trend: "rising",
  },
  {
    category: "Boat Rentals",
    touchpoint_id: "ECAY-BOAT-RENTAL-SEARCH",
    search_demand: 890,
    supply_count: 45,
    trend: "stable",
  },
  {
    category: "Commercial Real Estate",
    touchpoint_id: "ECAY-COMMERCIAL-RE-SEARCH",
    search_demand: 210,
    supply_count: 18,
    trend: "stable",
  },
  {
    category: "Used Cars",
    touchpoint_id: "ECAY-USED-CARS-SEARCH",
    search_demand: 2100,
    supply_count: 380,
    trend: "stable",
  },
  {
    category: "Home Services",
    touchpoint_id: "ECAY-HOME-SERVICES-SEARCH",
    search_demand: 780,
    supply_count: 95,
    trend: "rising",
  },
  {
    category: "Vacation Rentals",
    touchpoint_id: "ECAY-VACATION-RENTAL-SEARCH",
    search_demand: 1450,
    supply_count: 120,
    trend: "rising",
  },
  {
    category: "Restaurant Equipment",
    touchpoint_id: "ECAY-RESTAURANT-EQUIP-SEARCH",
    search_demand: 180,
    supply_count: 65,
    trend: "falling",
  },
  {
    category: "Fitness Equipment",
    touchpoint_id: "ECAY-FITNESS-SEARCH",
    search_demand: 320,
    supply_count: 280,
    trend: "stable",
  },
  {
    category: "Electronics",
    touchpoint_id: "ECAY-ELECTRONICS-SEARCH",
    search_demand: 1800,
    supply_count: 1250,
    trend: "stable",
  },
];

/**
 * Get mock gap opportunities for demonstration
 */
export function getMockGapOpportunities(): GapOpportunity[] {
  return categoriesToGapOpportunities(MOCK_ECAYTRADE_CATEGORIES);
}

/**
 * Categorize gaps by severity
 */
export function categorizeGaps(gaps: GapOpportunity[]): {
  critical: GapOpportunity[];
  high: GapOpportunity[];
  moderate: GapOpportunity[];
  low: GapOpportunity[];
} {
  return {
    critical: gaps.filter((g) => g.gap_score >= 0.8),
    high: gaps.filter((g) => g.gap_score >= 0.6 && g.gap_score < 0.8),
    moderate: gaps.filter((g) => g.gap_score >= 0.3 && g.gap_score < 0.6),
    low: gaps.filter((g) => g.gap_score < 0.3),
  };
}

/**
 * Calculate total revenue potential from gaps
 */
export function totalRevenuePotential(gaps: GapOpportunity[]): number {
  return gaps.reduce((sum, g) => sum + (g.revenue_potential ?? 0), 0);
}
