import { describe, it, expect } from "vitest";
import {
  computeGapScore,
  generateRecommendation,
  categoriesToGapOpportunities,
  getMockGapOpportunities,
  categorizeGaps,
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

describe("generateRecommendation", () => {
  it("returns critical message for very high gap score", () => {
    const rec = generateRecommendation("Solar Panels", 0.9);
    expect(rec).toContain("critical");
    expect(rec).toContain("Solar Panels");
    expect(rec).toContain("Improve");
  });

  it("returns high demand message for high gap score", () => {
    const rec = generateRecommendation("EVs", 0.7);
    expect(rec).toContain("high demand");
    expect(rec).toContain("EVs");
  });

  it("returns consider message for moderate gap score", () => {
    const rec = generateRecommendation("Boats", 0.4);
    expect(rec).toContain("Consider");
    expect(rec).toContain("Boats");
  });

  it("returns adequate message for low gap score", () => {
    const rec = generateRecommendation("Electronics", 0.1);
    expect(rec).toContain("adequate");
    expect(rec).toContain("Electronics");
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
      },
    ];

    const gaps = categoriesToGapOpportunities(categories);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].touchpoint_id).toBe("ECAY-TEST");
    expect(gaps[0].category).toBe("Test Category");
    expect(gaps[0].gap_score).toBeGreaterThan(0);
    expect(gaps[0].recommended_action).toBeTruthy();
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

  it("uses stable trend as default", () => {
    const categories = [
      {
        category: "Test",
        touchpoint_id: "ECAY-TEST",
        search_demand: 500,
        supply_count: 50,
      },
    ];

    const gaps = categoriesToGapOpportunities(categories);
    expect(gaps[0].trend).toBe("stable");
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
