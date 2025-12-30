import type {
  AttributionEdge,
  AttributionEdgeMetrics,
  AttributionModel,
  GapOpportunity,
  JourneySnapshot,
} from "@/types";

/**
 * Compute conversion rate between two touchpoints
 */
export function computeClickThroughRate(
  usersFlowed: number,
  sourceImpressions: number
): number {
  if (sourceImpressions <= 0) return 0;
  return Math.round((usersFlowed / sourceImpressions) * 100) / 100;
}

/**
 * Compute lift vs baseline (comparing to a control period or no-campaign scenario)
 */
export function computeLift(
  currentRate: number,
  baselineRate: number
): number {
  if (baselineRate <= 0) return currentRate > 0 ? 1 : 0;
  return Math.round((currentRate - baselineRate) * 100) / 100;
}

/**
 * Create an attribution edge between two touchpoints
 */
export function createAttributionEdge(params: {
  id: string;
  sourceTouchpointId: string;
  targetTouchpointId: string;
  period: string;
  usersFlowed: number;
  sourceImpressions: number;
  baselineClickThroughRate?: number;
  attributionModel?: AttributionModel;
}): AttributionEdge {
  const clickThroughRate = computeClickThroughRate(
    params.usersFlowed,
    params.sourceImpressions
  );

  const metrics: AttributionEdgeMetrics = {
    users_flowed: params.usersFlowed,
    click_through_rate: clickThroughRate,
  };

  if (params.baselineClickThroughRate !== undefined) {
    metrics.lift_vs_baseline = computeLift(
      clickThroughRate,
      params.baselineClickThroughRate
    );
  }

  return {
    id: params.id,
    source_touchpoint_id: params.sourceTouchpointId,
    target_touchpoint_id: params.targetTouchpointId,
    period: params.period,
    metrics,
    attribution_model: params.attributionModel ?? "last_touch",
  };
}

/**
 * Compute gap score (0-1, higher = bigger opportunity)
 * Gap score represents how underserved a demand is
 */
export function computeGapScore(
  searchDemand: number,
  supplyCount: number
): number {
  if (searchDemand <= 0) return 0;
  if (supplyCount <= 0) return 1;

  // Ratio of unfulfilled demand
  const idealSupply = searchDemand * 0.1; // Assume 10% conversion would be ideal
  const gap = Math.max(0, idealSupply - supplyCount) / idealSupply;
  return Math.round(gap * 100) / 100;
}

/**
 * Create a gap opportunity from touchpoint data
 */
export function createGapOpportunity(params: {
  touchpointId: string;
  searchDemand: number;
  supplyCount: number;
  recommendedAction: string;
}): GapOpportunity {
  return {
    touchpoint_id: params.touchpointId,
    search_demand: params.searchDemand,
    supply_count: params.supplyCount,
    gap_score: computeGapScore(params.searchDemand, params.supplyCount),
    recommended_action: params.recommendedAction,
  };
}

/**
 * Find the highest conversion path in a snapshot
 * Uses a simple greedy approach: follow the highest conversion rate at each step
 */
export function findHighestConversionPath(
  edges: AttributionEdge[],
  maxDepth = 10
): string[] {
  if (edges.length === 0) return [];

  // Build adjacency map
  const adjacency = new Map<string, AttributionEdge[]>();
  for (const edge of edges) {
    const existing = adjacency.get(edge.source_touchpoint_id) ?? [];
    existing.push(edge);
    adjacency.set(edge.source_touchpoint_id, existing);
  }

  // Find starting points (sources that aren't targets)
  const targets = new Set(edges.map((e) => e.target_touchpoint_id));
  const sources = edges
    .map((e) => e.source_touchpoint_id)
    .filter((s) => !targets.has(s));

  if (sources.length === 0) {
    // All nodes are targets, just pick the first edge's source
    sources.push(edges[0].source_touchpoint_id);
  }

  // Greedy traversal from each source, keep best path
  let bestPath: string[] = [];
  let bestScore = 0;

  for (const start of sources) {
    const path = [start];
    let current = start;
    let score = 0;
    let depth = 0;

    while (depth < maxDepth) {
      const outgoing = adjacency.get(current);
      if (!outgoing || outgoing.length === 0) break;

      // Pick edge with highest conversion rate
      const best = outgoing.reduce((a, b) =>
        a.metrics.click_through_rate > b.metrics.click_through_rate ? a : b
      );

      path.push(best.target_touchpoint_id);
      score += best.metrics.click_through_rate;
      current = best.target_touchpoint_id;
      depth++;
    }

    if (path.length > bestPath.length || score > bestScore) {
      bestPath = path;
      bestScore = score;
    }
  }

  return bestPath;
}

/**
 * Find the biggest bridge (touchpoint with highest betweenness)
 * Simple approximation: count how many paths pass through each node
 */
export function findBiggestBridge(edges: AttributionEdge[]): string | undefined {
  if (edges.length === 0) return undefined;

  // Count appearances as both source and target
  const nodeCounts = new Map<string, number>();

  for (const edge of edges) {
    nodeCounts.set(
      edge.source_touchpoint_id,
      (nodeCounts.get(edge.source_touchpoint_id) ?? 0) + 1
    );
    nodeCounts.set(
      edge.target_touchpoint_id,
      (nodeCounts.get(edge.target_touchpoint_id) ?? 0) + 1
    );
  }

  // Find node with highest count (excluding endpoints)
  let maxNode: string | undefined;
  let maxCount = 0;

  // Identify endpoints (only source or only target)
  const sources = new Set(edges.map((e) => e.source_touchpoint_id));
  const targets = new Set(edges.map((e) => e.target_touchpoint_id));
  const intermediates = Array.from(nodeCounts.keys()).filter(
    (n) => sources.has(n) && targets.has(n)
  );

  for (const node of intermediates) {
    const count = nodeCounts.get(node) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      maxNode = node;
    }
  }

  return maxNode;
}

/**
 * Compute insights for a snapshot
 */
export function computeSnapshotInsights(
  edges: AttributionEdge[],
  gapOpportunities: GapOpportunity[] = []
): {
  highest_click_through_path: string[];
  biggest_bridge?: string;
  gap_opportunities: GapOpportunity[];
} {
  return {
    highest_click_through_path: findHighestConversionPath(edges),
    biggest_bridge: findBiggestBridge(edges),
    gap_opportunities: gapOpportunities,
  };
}

/**
 * Aggregate edges from multiple snapshots (for trend analysis)
 */
export function aggregateEdges(
  snapshots: JourneySnapshot[]
): Map<string, AttributionEdgeMetrics[]> {
  const aggregated = new Map<string, AttributionEdgeMetrics[]>();

  for (const snapshot of snapshots) {
    for (const edge of snapshot.edges) {
      const key = `${edge.source_touchpoint_id}→${edge.target_touchpoint_id}`;
      const existing = aggregated.get(key) ?? [];
      existing.push(edge.metrics);
      aggregated.set(key, existing);
    }
  }

  return aggregated;
}

/**
 * Calculate average conversion rate for an edge across periods
 */
export function averageClickThroughRate(metrics: AttributionEdgeMetrics[]): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, m) => acc + m.click_through_rate, 0);
  return Math.round((sum / metrics.length) * 100) / 100;
}
