import { describe, it, expect } from "vitest";
import type { AttributionEdge } from "@/types";
import {
  toSankeyData,
  getEntityFromTouchpoint,
  getColorForTouchpoint,
  filterEdgesByEntities,
  getEntitiesFromEdges,
  aggregateToEntityLevel,
  entityFlowsToSankeyData,
  filterEdgesByEntityPair,
  ENTITY_COLORS,
} from "./sankey";

describe("getEntityFromTouchpoint", () => {
  it("identifies Stingray touchpoints", () => {
    expect(getEntityFromTouchpoint("X107-SOLAR-AD")).toBe("STINGRAY");
    expect(getEntityFromTouchpoint("KISS-DRIVE-TIME")).toBe("STINGRAY");
    expect(getEntityFromTouchpoint("STINGRAY-REWARDS-PROMO")).toBe("STINGRAY");
  });

  it("identifies eCayTrade touchpoints", () => {
    expect(getEntityFromTouchpoint("ECAY-SOLAR-SEARCH")).toBe("ECAYTRADE");
    expect(getEntityFromTouchpoint("ECAY-PURCHASE")).toBe("ECAYTRADE");
    expect(getEntityFromTouchpoint("ECAY-LISTING-VIEW")).toBe("ECAYTRADE");
  });

  it("identifies Caymanian Times touchpoints", () => {
    expect(getEntityFromTouchpoint("CT-BREAKING-NEWS")).toBe("CAYMANIAN-TIMES");
    expect(getEntityFromTouchpoint("CT-NEWSLETTER")).toBe("CAYMANIAN-TIMES");
  });

  it("returns UNKNOWN for unrecognized prefixes", () => {
    expect(getEntityFromTouchpoint("UNKNOWN-THING")).toBe("UNKNOWN");
    expect(getEntityFromTouchpoint("OTHER")).toBe("UNKNOWN");
  });
});

describe("getColorForTouchpoint", () => {
  it("returns blue for Stingray", () => {
    expect(getColorForTouchpoint("X107-SOLAR-AD")).toBe(ENTITY_COLORS.STINGRAY);
  });

  it("returns emerald for eCayTrade", () => {
    expect(getColorForTouchpoint("ECAY-PURCHASE")).toBe(ENTITY_COLORS.ECAYTRADE);
  });

  it("returns amber for Caymanian Times", () => {
    expect(getColorForTouchpoint("CT-NEWSLETTER")).toBe(ENTITY_COLORS["CAYMANIAN-TIMES"]);
  });

  it("returns slate for unknown entities", () => {
    expect(getColorForTouchpoint("UNKNOWN-THING")).toBe("#64748b");
  });
});

describe("toSankeyData", () => {
  const sampleEdges: AttributionEdge[] = [
    {
      id: "E-001",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 384, click_through_rate: 0.12 },
      attribution_model: "last_touch",
    },
    {
      id: "E-002",
      source_touchpoint_id: "ECAY-SOLAR-SEARCH",
      target_touchpoint_id: "ECAY-LISTING-VIEW",
      period: "2025-01",
      metrics: { users_flowed: 131, click_through_rate: 0.34 },
      attribution_model: "last_touch",
    },
  ];

  it("returns empty data for empty edges", () => {
    const result = toSankeyData([]);
    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
  });

  it("extracts unique touchpoints as nodes", () => {
    const result = toSankeyData(sampleEdges);
    expect(result.nodes).toHaveLength(3);
    expect(result.nodes.map((n) => n.name)).toContain("X107-SOLAR-AD");
    expect(result.nodes.map((n) => n.name)).toContain("ECAY-SOLAR-SEARCH");
    expect(result.nodes.map((n) => n.name)).toContain("ECAY-LISTING-VIEW");
  });

  it("assigns entity to each node", () => {
    const result = toSankeyData(sampleEdges);
    const stingrayNode = result.nodes.find((n) => n.name === "X107-SOLAR-AD");
    const ecayNode = result.nodes.find((n) => n.name === "ECAY-LISTING-VIEW");
    expect(stingrayNode?.entity).toBe("STINGRAY");
    expect(ecayNode?.entity).toBe("ECAYTRADE");
  });

  it("creates links with correct indices", () => {
    const result = toSankeyData(sampleEdges);
    expect(result.links).toHaveLength(2);

    // Find node indices
    const sourceIdx = result.nodes.findIndex((n) => n.name === "X107-SOLAR-AD");
    const midIdx = result.nodes.findIndex((n) => n.name === "ECAY-SOLAR-SEARCH");
    const targetIdx = result.nodes.findIndex((n) => n.name === "ECAY-LISTING-VIEW");

    // First link: X107 -> ECAY-SEARCH
    const link1 = result.links.find((l) => l.edgeId === "E-001");
    expect(link1?.source).toBe(sourceIdx);
    expect(link1?.target).toBe(midIdx);
    expect(link1?.value).toBe(384);
    expect(link1?.clickThroughRate).toBe(0.12);

    // Second link: ECAY-SEARCH -> ECAY-LISTING-VIEW
    const link2 = result.links.find((l) => l.edgeId === "E-002");
    expect(link2?.source).toBe(midIdx);
    expect(link2?.target).toBe(targetIdx);
    expect(link2?.value).toBe(131);
  });
});

describe("filterEdgesByEntities", () => {
  const edges: AttributionEdge[] = [
    {
      id: "E-001",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 100, click_through_rate: 0.1 },
      attribution_model: "last_touch",
    },
    {
      id: "E-002",
      source_touchpoint_id: "CT-NEWSLETTER",
      target_touchpoint_id: "CT-BREAKING-NEWS",
      period: "2025-01",
      metrics: { users_flowed: 200, click_through_rate: 0.2 },
      attribution_model: "first_touch",
    },
  ];

  it("returns all edges when no filter applied", () => {
    expect(filterEdgesByEntities(edges, [])).toHaveLength(2);
  });

  it("filters edges by entity", () => {
    const filtered = filterEdgesByEntities(edges, ["STINGRAY"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("E-001");
  });

  it("includes edges that touch any allowed entity", () => {
    const filtered = filterEdgesByEntities(edges, ["ECAYTRADE"]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("E-001");
  });
});

describe("getEntitiesFromEdges", () => {
  const edges: AttributionEdge[] = [
    {
      id: "E-001",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 100, click_through_rate: 0.1 },
      attribution_model: "last_touch",
    },
  ];

  it("extracts unique entities from edges", () => {
    const entities = getEntitiesFromEdges(edges);
    expect(entities).toContain("STINGRAY");
    expect(entities).toContain("ECAYTRADE");
    expect(entities).not.toContain("UNKNOWN");
  });
});

describe("aggregateToEntityLevel", () => {
  const edges: AttributionEdge[] = [
    {
      id: "E-001",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 100, click_through_rate: 0.1 },
      attribution_model: "last_touch",
    },
    {
      id: "E-002",
      source_touchpoint_id: "KISS-DRIVE-TIME",
      target_touchpoint_id: "ECAY-LISTING-VIEW",
      period: "2025-01",
      metrics: { users_flowed: 150, click_through_rate: 0.2 },
      attribution_model: "last_touch",
    },
    {
      id: "E-003",
      source_touchpoint_id: "CT-NEWSLETTER",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 50, click_through_rate: 0.05 },
      attribution_model: "last_touch",
    },
  ];

  it("aggregates edges into entity flows", () => {
    const flows = aggregateToEntityLevel(edges);
    expect(flows).toHaveLength(2);

    const stingrayToEcay = flows.find(
      (f) => f.sourceEntity === "STINGRAY" && f.targetEntity === "ECAYTRADE"
    );
    expect(stingrayToEcay).toBeDefined();
    expect(stingrayToEcay?.totalUsers).toBe(250); // 100 + 150
    expect(stingrayToEcay?.edgeCount).toBe(2);
    expect(stingrayToEcay?.avgClickThroughRate).toBe(0.15); // (0.1 + 0.2) / 2
  });

  it("sorts by total users descending", () => {
    const flows = aggregateToEntityLevel(edges);
    expect(flows[0].totalUsers).toBeGreaterThanOrEqual(flows[1].totalUsers);
  });

  it("returns empty array for empty edges", () => {
    const flows = aggregateToEntityLevel([]);
    expect(flows).toHaveLength(0);
  });

  it("excludes same-entity flows (self-loops)", () => {
    const edgesWithSelfLoop: AttributionEdge[] = [
      {
        id: "E-001",
        source_touchpoint_id: "X107-SOLAR-AD",
        target_touchpoint_id: "ECAY-SOLAR-SEARCH",
        period: "2025-01",
        metrics: { users_flowed: 100, click_through_rate: 0.1 },
        attribution_model: "last_touch",
      },
      {
        id: "E-002",
        source_touchpoint_id: "ECAY-SOLAR-SEARCH",
        target_touchpoint_id: "ECAY-LISTING-VIEW",
        period: "2025-01",
        metrics: { users_flowed: 50, click_through_rate: 0.5 },
        attribution_model: "last_touch",
      },
    ];

    const flows = aggregateToEntityLevel(edgesWithSelfLoop);
    // Only STINGRAY → ECAYTRADE should be included
    // ECAYTRADE → ECAYTRADE should be excluded
    expect(flows).toHaveLength(1);
    expect(flows[0].sourceEntity).toBe("STINGRAY");
    expect(flows[0].targetEntity).toBe("ECAYTRADE");
  });
});

describe("entityFlowsToSankeyData", () => {
  it("converts entity flows to sankey format", () => {
    const flows = [
      {
        sourceEntity: "STINGRAY",
        targetEntity: "ECAYTRADE",
        totalUsers: 250,
        avgClickThroughRate: 0.15,
        edgeCount: 2,
      },
      {
        sourceEntity: "CAYMANIAN-TIMES",
        targetEntity: "ECAYTRADE",
        totalUsers: 50,
        avgClickThroughRate: 0.05,
        edgeCount: 1,
      },
    ];

    const sankeyData = entityFlowsToSankeyData(flows);
    expect(sankeyData.nodes).toHaveLength(3);
    expect(sankeyData.links).toHaveLength(2);

    const stingrayNode = sankeyData.nodes.find((n) => n.name === "STINGRAY");
    expect(stingrayNode?.entity).toBe("STINGRAY");
  });

  it("returns empty data for empty flows", () => {
    const sankeyData = entityFlowsToSankeyData([]);
    expect(sankeyData.nodes).toHaveLength(0);
    expect(sankeyData.links).toHaveLength(0);
  });
});

describe("filterEdgesByEntityPair", () => {
  const edges: AttributionEdge[] = [
    {
      id: "E-001",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "ECAY-SOLAR-SEARCH",
      period: "2025-01",
      metrics: { users_flowed: 100, click_through_rate: 0.1 },
      attribution_model: "last_touch",
    },
    {
      id: "E-002",
      source_touchpoint_id: "CT-NEWSLETTER",
      target_touchpoint_id: "ECAY-LISTING-VIEW",
      period: "2025-01",
      metrics: { users_flowed: 50, click_through_rate: 0.05 },
      attribution_model: "last_touch",
    },
    {
      id: "E-003",
      source_touchpoint_id: "X107-SOLAR-AD",
      target_touchpoint_id: "CT-BREAKING-NEWS",
      period: "2025-01",
      metrics: { users_flowed: 30, click_through_rate: 0.03 },
      attribution_model: "last_touch",
    },
  ];

  it("filters edges by source and target entity", () => {
    const filtered = filterEdgesByEntityPair(edges, "STINGRAY", "ECAYTRADE");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("E-001");
  });

  it("returns empty array when no matching edges", () => {
    const filtered = filterEdgesByEntityPair(edges, "ECAYTRADE", "STINGRAY");
    expect(filtered).toHaveLength(0);
  });

  it("finds edges from Stingray to Caymanian Times", () => {
    const filtered = filterEdgesByEntityPair(edges, "STINGRAY", "CAYMANIAN-TIMES");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("E-003");
  });
});
