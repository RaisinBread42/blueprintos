import { describe, it, expect } from "vitest";
import {
  computeGapScore,
  estimateRevenuePotential,
  generateRecommendation,
  categoriesToGapOpportunities,
  getMockGapOpportunities,
  categorizeGaps,
  totalRevenuePotential,
  MOCK_ECAYTRADE_CATEGORIES,
} from "./gaps";

describe("computeGapScore", () => {
  it("returns 0 when demand is 0", () => {
    expect(computeGapScore(0, 100)).toBe(0);
  });

  it("returns 1 when supply is 0 but demand exists", () => {
    expect(computeGapScore(100, 0)).toBe(1);
  });

  it("returns 0 when supply meets or exceeds demand", () => {
    expect(computeGapScore(100, 100)).toBe(0);
    expect(computeGapScore(100, 200)).toBe(0);
  });

  it("returns higher score when demand exceeds supply", () => {
    const score1 = computeGapScore(200, 100); // 2:1 ratio
    const score2 = computeGapScore(500, 100); // 5:1 ratio
    const score3 = computeGapScore(1000, 100); // 10:1 ratio

    expect(score1).toBeGreaterThan(0);
    expect(score2).toBeGreaterThan(score1);
    expect(score3).toBeGreaterThan(score2);
  });

  it("score approaches 1 as ratio increases", () => {
    const score = computeGapScore(10000, 100); // 100:1 ratio
    expect(score).toBeGreaterThan(0.95);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("estimateRevenuePotential", () => {
  it("returns 0 when supply meets demand", () => {
    expect(estimateRevenuePotential(100, 100, 500)).toBe(0);
    expect(estimateRevenuePotential(100, 200, 500)).toBe(0);
  });

  it("calculates revenue based on unmet demand", () => {
    // 100 unmet demand * 10% conversion * $500 * 5% commission = $250
    const revenue = estimateRevenuePotential(200, 100, 500);
    expect(revenue).toBe(250);
  });

  it("uses default price when not specified", () => {
    const revenue = estimateRevenuePotential(200, 100);
    expect(revenue).toBeGreaterThan(0);
  });
});

describe("generateRecommendation", () => {
  it("returns critical message for high gap score", () => {
    const rec = generateRecommendation("Solar Panels", 0.9);
    expect(rec).toContain("Critical");
    expect(rec).toContain("Solar Panels");
  });

  it("mentions growth for rising trends with high gaps", () => {
    const rec = generateRecommendation("EVs", 0.7, "rising");
    expect(rec).toContain("growing");
  });

  it("returns low-priority message for well-supplied categories", () => {
    const rec = generateRecommendation("Electronics", 0.1);
    expect(rec).toContain("well-supplied");
  });
});

describe("categoriesToGapOpportunities", () => {
  it("converts category data to gap opportunities", () => {
    const categories = [
      {
        category: "Test Category",
        touchpoint_id: "ECAY-TEST",
        search_demand: 500,
        supply_count: 50,
        avg_listing_price: 1000,
      },
    ];

    const gaps = categoriesToGapOpportunities(categories);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].touchpoint_id).toBe("ECAY-TEST");
    expect(gaps[0].category).toBe("Test Category");
    expect(gaps[0].gap_score).toBeGreaterThan(0);
    expect(gaps[0].recommended_action).toBeTruthy();
    expect(gaps[0].revenue_potential).toBeGreaterThan(0);
  });

  it("sorts by gap score descending", () => {
    const categories = [
      {
        category: "Low Gap",
        touchpoint_id: "ECAY-LOW",
        search_demand: 100,
        supply_count: 100,
      },
      {
        category: "High Gap",
        touchpoint_id: "ECAY-HIGH",
        search_demand: 1000,
        supply_count: 10,
      },
    ];

    const gaps = categoriesToGapOpportunities(categories);

    expect(gaps[0].category).toBe("High Gap");
    expect(gaps[1].category).toBe("Low Gap");
  });
});

describe("getMockGapOpportunities", () => {
  it("returns gap opportunities from mock data", () => {
    const gaps = getMockGapOpportunities();

    expect(gaps.length).toBe(MOCK_ECAYTRADE_CATEGORIES.length);
    expect(gaps[0].gap_score).toBeGreaterThanOrEqual(gaps[1].gap_score);
  });

  it("includes all required fields", () => {
    const gaps = getMockGapOpportunities();

    gaps.forEach((gap) => {
      expect(gap.touchpoint_id).toBeTruthy();
      expect(gap.category).toBeTruthy();
      expect(typeof gap.search_demand).toBe("number");
      expect(typeof gap.supply_count).toBe("number");
      expect(typeof gap.gap_score).toBe("number");
      expect(gap.recommended_action).toBeTruthy();
    });
  });
});

describe("categorizeGaps", () => {
  it("categorizes gaps by severity", () => {
    const gaps = getMockGapOpportunities();
    const categorized = categorizeGaps(gaps);

    expect(categorized.critical).toBeDefined();
    expect(categorized.high).toBeDefined();
    expect(categorized.moderate).toBeDefined();
    expect(categorized.low).toBeDefined();

    // All critical gaps should have score >= 0.8
    categorized.critical.forEach((g) => {
      expect(g.gap_score).toBeGreaterThanOrEqual(0.8);
    });

    // All high gaps should have score 0.6-0.8
    categorized.high.forEach((g) => {
      expect(g.gap_score).toBeGreaterThanOrEqual(0.6);
      expect(g.gap_score).toBeLessThan(0.8);
    });
  });

  it("total count equals input count", () => {
    const gaps = getMockGapOpportunities();
    const categorized = categorizeGaps(gaps);
    const total =
      categorized.critical.length +
      categorized.high.length +
      categorized.moderate.length +
      categorized.low.length;

    expect(total).toBe(gaps.length);
  });
});

describe("totalRevenuePotential", () => {
  it("sums revenue potential from all gaps", () => {
    const gaps = getMockGapOpportunities();
    const total = totalRevenuePotential(gaps);

    expect(total).toBeGreaterThan(0);
  });

  it("returns 0 for empty array", () => {
    expect(totalRevenuePotential([])).toBe(0);
  });
});
