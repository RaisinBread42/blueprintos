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
  avg_listing_price?: number;
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
 * Estimate revenue potential based on gap and average price
 */
export function estimateRevenuePotential(
  demand: number,
  supply: number,
  avgPrice: number = 500
): number {
  const unmetDemand = Math.max(0, demand - supply);
  // Assume 10% conversion rate and 5% commission
  const potentialSales = unmetDemand * 0.1;
  const commission = potentialSales * avgPrice * 0.05;
  return Math.round(commission);
}

/**
 * Generate recommended action based on gap analysis
 */
export function generateRecommendation(
  category: string,
  gapScore: number,
  trend: "rising" | "stable" | "falling" = "stable"
): string {
  if (gapScore >= 0.8) {
    return `Critical gap in ${category}. Launch targeted seller recruitment campaign immediately.`;
  }
  if (gapScore >= 0.6) {
    if (trend === "rising") {
      return `High demand for ${category} and growing. Prioritize seller onboarding + radio ads.`;
    }
    return `Significant opportunity in ${category}. Run cross-platform bundle campaign.`;
  }
  if (gapScore >= 0.4) {
    return `Moderate gap in ${category}. Consider CT article series + eCayTrade promotion.`;
  }
  if (gapScore >= 0.2) {
    return `Minor gap in ${category}. Monitor trends and maintain current supply.`;
  }
  return `${category} well-supplied. Focus retention and quality over recruitment.`;
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
      const revenuePotential = estimateRevenuePotential(
        cat.search_demand,
        cat.supply_count,
        cat.avg_listing_price
      );

      return {
        touchpoint_id: cat.touchpoint_id,
        category: cat.category,
        search_demand: cat.search_demand,
        supply_count: cat.supply_count,
        gap_score: Math.round(gapScore * 100) / 100,
        trend: cat.trend ?? "stable",
        revenue_potential: revenuePotential,
        recommended_action: generateRecommendation(
          cat.category,
          gapScore,
          cat.trend
        ),
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
    avg_listing_price: 2500,
    trend: "rising",
  },
  {
    category: "Electric Vehicles",
    touchpoint_id: "ECAY-EV-SEARCH",
    search_demand: 340,
    supply_count: 8,
    avg_listing_price: 35000,
    trend: "rising",
  },
  {
    category: "Boat Rentals",
    touchpoint_id: "ECAY-BOAT-RENTAL-SEARCH",
    search_demand: 890,
    supply_count: 45,
    avg_listing_price: 500,
    trend: "stable",
  },
  {
    category: "Commercial Real Estate",
    touchpoint_id: "ECAY-COMMERCIAL-RE-SEARCH",
    search_demand: 210,
    supply_count: 18,
    avg_listing_price: 850000,
    trend: "stable",
  },
  {
    category: "Used Cars",
    touchpoint_id: "ECAY-USED-CARS-SEARCH",
    search_demand: 2100,
    supply_count: 380,
    avg_listing_price: 18000,
    trend: "stable",
  },
  {
    category: "Home Services",
    touchpoint_id: "ECAY-HOME-SERVICES-SEARCH",
    search_demand: 780,
    supply_count: 95,
    avg_listing_price: 200,
    trend: "rising",
  },
  {
    category: "Vacation Rentals",
    touchpoint_id: "ECAY-VACATION-RENTAL-SEARCH",
    search_demand: 1450,
    supply_count: 120,
    avg_listing_price: 350,
    trend: "rising",
  },
  {
    category: "Restaurant Equipment",
    touchpoint_id: "ECAY-RESTAURANT-EQUIP-SEARCH",
    search_demand: 180,
    supply_count: 65,
    avg_listing_price: 1200,
    trend: "falling",
  },
  {
    category: "Fitness Equipment",
    touchpoint_id: "ECAY-FITNESS-SEARCH",
    search_demand: 320,
    supply_count: 280,
    avg_listing_price: 400,
    trend: "stable",
  },
  {
    category: "Electronics",
    touchpoint_id: "ECAY-ELECTRONICS-SEARCH",
    search_demand: 1800,
    supply_count: 1250,
    avg_listing_price: 300,
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
