import { describe, expect, it } from "vitest";

import type { AttributionEdge, JourneySnapshot } from "@/types";
import {
  aggregateEdges,
  averageClickThroughRate,
  computeClickThroughRate,
  computeGapScore,
  computeLift,
  computeSnapshotInsights,
  createAttributionEdge,
  createGapOpportunity,
  findBiggestBridge,
  findHighestConversionPath,
} from "@/lib/attribution/compute";

describe("computeClickThroughRate", () => {
  it("computes correct conversion rate", () => {
    expect(computeClickThroughRate(100, 1000)).toBe(0.1);
    expect(computeClickThroughRate(50, 200)).toBe(0.25);
    expect(computeClickThroughRate(1, 3)).toBe(0.33);
  });

  it("returns 0 for zero impressions", () => {
    expect(computeClickThroughRate(100, 0)).toBe(0);
    expect(computeClickThroughRate(0, 0)).toBe(0);
  });

  it("handles negative impressions", () => {
    expect(computeClickThroughRate(100, -10)).toBe(0);
  });
});

describe("computeLift", () => {
  it("computes correct lift", () => {
    expect(computeLift(0.15, 0.10)).toBe(0.05);
    expect(computeLift(0.20, 0.10)).toBe(0.1);
  });

  it("returns current rate for zero baseline", () => {
    expect(computeLift(0.15, 0)).toBe(1);
    expect(computeLift(0, 0)).toBe(0);
  });

  it("handles negative lift", () => {
    expect(computeLift(0.05, 0.10)).toBe(-0.05);
  });
});

describe("createAttributionEdge", () => {
  it("creates edge with computed metrics", () => {
    const edge = createAttributionEdge({
      id: "E-001",
      sourceTouchpointId: "TP-A",
      targetTouchpointId: "TP-B",
      period: "2025-01",
      usersFlowed: 100,
      sourceImpressions: 1000,
    });

    expect(edge.id).toBe("E-001");
    expect(edge.source_touchpoint_id).toBe("TP-A");
    expect(edge.target_touchpoint_id).toBe("TP-B");
    expect(edge.metrics.users_flowed).toBe(100);
    expect(edge.metrics.click_through_rate).toBe(0.1);
    expect(edge.metrics.lift_vs_baseline).toBeUndefined();
    expect(edge.attribution_model).toBe("last_touch");
  });

  it("includes lift when baseline provided", () => {
    const edge = createAttributionEdge({
      id: "E-001",
      sourceTouchpointId: "TP-A",
      targetTouchpointId: "TP-B",
      period: "2025-01",
      usersFlowed: 150,
      sourceImpressions: 1000,
      baselineClickThroughRate: 0.10,
    });

    expect(edge.metrics.click_through_rate).toBe(0.15);
    expect(edge.metrics.lift_vs_baseline).toBe(0.05);
  });

  it("respects custom attribution model", () => {
    const edge = createAttributionEdge({
      id: "E-001",
      sourceTouchpointId: "TP-A",
      targetTouchpointId: "TP-B",
      period: "2025-01",
      usersFlowed: 100,
      sourceImpressions: 1000,
      attributionModel: "linear",
    });

    expect(edge.attribution_model).toBe("linear");
  });
});

describe("computeGapScore", () => {
  it("returns high score for large demand/supply gap", () => {
    // 500 demand, 10 supply, ideal supply = 50
    // gap = (50 - 10) / 50 = 0.8
    expect(computeGapScore(500, 10)).toBe(0.8);
  });

  it("returns 0 when supply meets demand", () => {
    // 100 demand, 100 supply, ideal = 10
    // supply > ideal, so gap = 0
    expect(computeGapScore(100, 100)).toBe(0);
  });

  it("returns 1 for zero supply", () => {
    expect(computeGapScore(500, 0)).toBe(1);
  });

  it("returns 0 for zero demand", () => {
    expect(computeGapScore(0, 10)).toBe(0);
  });
});

describe("createGapOpportunity", () => {
  it("creates gap opportunity with computed score", () => {
    const gap = createGapOpportunity({
      touchpointId: "TP-A",
      searchDemand: 500,
      supplyCount: 10,
      recommendedAction: "Recruit more suppliers",
    });

    expect(gap.touchpoint_id).toBe("TP-A");
    expect(gap.search_demand).toBe(500);
    expect(gap.supply_count).toBe(10);
    expect(gap.gap_score).toBe(0.8);
    expect(gap.recommended_action).toBe("Recruit more suppliers");
  });
});

describe("findHighestConversionPath", () => {
  it("finds path with highest conversion rates", () => {
    const edges: AttributionEdge[] = [
      {
        id: "E-001",
        source_touchpoint_id: "A",
        target_touchpoint_id: "B",
        period: "2025",
        metrics: { users_flowed: 100, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
      {
        id: "E-002",
        source_touchpoint_id: "A",
        target_touchpoint_id: "C",
        period: "2025",
        metrics: { users_flowed: 50, click_through_rate: 0.2 },
        attribution_model: "last_touch",
      },
      {
        id: "E-003",
        source_touchpoint_id: "B",
        target_touchpoint_id: "D",
        period: "2025",
        metrics: { users_flowed: 40, click_through_rate: 0.8 },
        attribution_model: "last_touch",
      },
    ];

    const path = findHighestConversionPath(edges);
    expect(path).toEqual(["A", "B", "D"]);
  });

  it("returns empty array for no edges", () => {
    expect(findHighestConversionPath([])).toEqual([]);
  });
});

describe("findBiggestBridge", () => {
  it("finds intermediate node with most connections", () => {
    const edges: AttributionEdge[] = [
      {
        id: "E-001",
        source_touchpoint_id: "A",
        target_touchpoint_id: "B",
        period: "2025",
        metrics: { users_flowed: 100, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
      {
        id: "E-002",
        source_touchpoint_id: "C",
        target_touchpoint_id: "B",
        period: "2025",
        metrics: { users_flowed: 50, click_through_rate: 0.2 },
        attribution_model: "last_touch",
      },
      {
        id: "E-003",
        source_touchpoint_id: "B",
        target_touchpoint_id: "D",
        period: "2025",
        metrics: { users_flowed: 40, click_through_rate: 0.8 },
        attribution_model: "last_touch",
      },
    ];

    const bridge = findBiggestBridge(edges);
    expect(bridge).toBe("B");
  });

  it("returns undefined for no edges", () => {
    expect(findBiggestBridge([])).toBeUndefined();
  });

  it("returns undefined when no intermediate nodes", () => {
    const edges: AttributionEdge[] = [
      {
        id: "E-001",
        source_touchpoint_id: "A",
        target_touchpoint_id: "B",
        period: "2025",
        metrics: { users_flowed: 100, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
    ];

    // A is only source, B is only target - no intermediates
    expect(findBiggestBridge(edges)).toBeUndefined();
  });
});

describe("computeSnapshotInsights", () => {
  it("computes all insights", () => {
    const edges: AttributionEdge[] = [
      {
        id: "E-001",
        source_touchpoint_id: "A",
        target_touchpoint_id: "B",
        period: "2025",
        metrics: { users_flowed: 100, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
      {
        id: "E-002",
        source_touchpoint_id: "B",
        target_touchpoint_id: "C",
        period: "2025",
        metrics: { users_flowed: 50, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
    ];

    const gaps = [
      {
        touchpoint_id: "B",
        search_demand: 500,
        supply_count: 10,
        gap_score: 0.8,
        recommended_action: "Recruit",
      },
    ];

    const insights = computeSnapshotInsights(edges, gaps);

    expect(insights.highest_click_through_path).toEqual(["A", "B", "C"]);
    expect(insights.biggest_bridge).toBe("B");
    expect(insights.gap_opportunities).toEqual(gaps);
  });
});

describe("aggregateEdges", () => {
  it("aggregates edges from multiple snapshots", () => {
    const snapshots: JourneySnapshot[] = [
      {
        snapshot_id: "2025-01",
        period: "2025-01",
        period_type: "monthly",
        entities: ["A", "B"],
        edges: [
          {
            id: "E-001",
            source_touchpoint_id: "A",
            target_touchpoint_id: "B",
            period: "2025-01",
            metrics: { users_flowed: 100, click_through_rate: 0.1 },
            attribution_model: "last_touch",
          },
        ],
        computed_at: "2025-02-01",
        insights: {
          highest_click_through_path: [],
          gap_opportunities: [],
        },
      },
      {
        snapshot_id: "2025-02",
        period: "2025-02",
        period_type: "monthly",
        entities: ["A", "B"],
        edges: [
          {
            id: "E-001",
            source_touchpoint_id: "A",
            target_touchpoint_id: "B",
            period: "2025-02",
            metrics: { users_flowed: 150, click_through_rate: 0.15 },
            attribution_model: "last_touch",
          },
        ],
        computed_at: "2025-03-01",
        insights: {
          highest_click_through_path: [],
          gap_opportunities: [],
        },
      },
    ];

    const aggregated = aggregateEdges(snapshots);
    const metrics = aggregated.get("A→B");

    expect(metrics?.length).toBe(2);
    expect(metrics?.[0].click_through_rate).toBe(0.1);
    expect(metrics?.[1].click_through_rate).toBe(0.15);
  });
});

describe("averageClickThroughRate", () => {
  it("computes average conversion rate", () => {
    const metrics = [
      { users_flowed: 100, click_through_rate: 0.1 },
      { users_flowed: 150, click_through_rate: 0.15 },
      { users_flowed: 120, click_through_rate: 0.12 },
    ];

    // (0.1 + 0.15 + 0.12) / 3 = 0.1233...
    expect(averageClickThroughRate(metrics)).toBe(0.12);
  });

  it("returns 0 for empty array", () => {
    expect(averageClickThroughRate([])).toBe(0);
  });
});
