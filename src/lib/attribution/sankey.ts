/**
 * Sankey diagram data transformation for attribution visualization
 */

import type { AttributionEdge } from "@/types";

/**
 * Sankey node with name and optional entity reference
 */
export interface SankeyNode {
  name: string;
  entity?: string;
}

/**
 * Sankey link with source/target indices and value
 */
export interface SankeyLink {
  source: number;
  target: number;
  value: number;
  clickThroughRate: number;
  edgeId: string;
}

/**
 * Complete Sankey data structure for Recharts
 */
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

/**
 * Entity color mapping
 */
export const ENTITY_COLORS: Record<string, string> = {
  STINGRAY: "#3b82f6", // blue-500
  ECAYTRADE: "#10b981", // emerald-500
  "CAYMANIAN-TIMES": "#f59e0b", // amber-500
};

/**
 * Get entity from touchpoint ID
 * Touchpoint IDs follow pattern: ENTITY-* (e.g., X107-SOLAR-AD is STINGRAY)
 */
export function getEntityFromTouchpoint(touchpointId: string): string {
  // Known prefixes
  if (touchpointId.startsWith("X107-") || touchpointId.startsWith("KISS-") || touchpointId.startsWith("STINGRAY-")) {
    return "STINGRAY";
  }
  if (touchpointId.startsWith("ECAY-")) {
    return "ECAYTRADE";
  }
  if (touchpointId.startsWith("CT-")) {
    return "CAYMANIAN-TIMES";
  }
  return "UNKNOWN";
}

/**
 * Get color for a touchpoint based on its entity
 */
export function getColorForTouchpoint(touchpointId: string): string {
  const entity = getEntityFromTouchpoint(touchpointId);
  return ENTITY_COLORS[entity] ?? "#64748b"; // slate-500 fallback
}

/**
 * Transform AttributionEdge array to Recharts Sankey data format
 */
export function toSankeyData(edges: AttributionEdge[]): SankeyData {
  if (edges.length === 0) {
    return { nodes: [], links: [] };
  }

  // Collect unique touchpoints
  const touchpointSet = new Set<string>();
  edges.forEach((edge) => {
    touchpointSet.add(edge.source_touchpoint_id);
    touchpointSet.add(edge.target_touchpoint_id);
  });

  // Create nodes with entity info
  const touchpoints = Array.from(touchpointSet);
  const nodes: SankeyNode[] = touchpoints.map((tp) => ({
    name: tp,
    entity: getEntityFromTouchpoint(tp),
  }));

  // Create node index map
  const nodeIndex = new Map<string, number>();
  touchpoints.forEach((tp, i) => {
    nodeIndex.set(tp, i);
  });

  // Create links
  const links: SankeyLink[] = edges.map((edge) => ({
    source: nodeIndex.get(edge.source_touchpoint_id)!,
    target: nodeIndex.get(edge.target_touchpoint_id)!,
    value: edge.metrics.users_flowed,
    clickThroughRate: edge.metrics.click_through_rate,
    edgeId: edge.id,
  }));

  return { nodes, links };
}

/**
 * Filter edges by entity
 */
export function filterEdgesByEntities(
  edges: AttributionEdge[],
  allowedEntities: string[]
): AttributionEdge[] {
  if (allowedEntities.length === 0) {
    return edges;
  }

  return edges.filter((edge) => {
    const sourceEntity = getEntityFromTouchpoint(edge.source_touchpoint_id);
    const targetEntity = getEntityFromTouchpoint(edge.target_touchpoint_id);
    return (
      allowedEntities.includes(sourceEntity) ||
      allowedEntities.includes(targetEntity)
    );
  });
}

/**
 * Get unique entities from edges
 */
export function getEntitiesFromEdges(edges: AttributionEdge[]): string[] {
  const entities = new Set<string>();
  edges.forEach((edge) => {
    entities.add(getEntityFromTouchpoint(edge.source_touchpoint_id));
    entities.add(getEntityFromTouchpoint(edge.target_touchpoint_id));
  });
  return Array.from(entities).filter((e) => e !== "UNKNOWN");
}

/**
 * Aggregated entity-level flow
 */
export interface EntityFlow {
  sourceEntity: string;
  targetEntity: string;
  totalUsers: number;
  avgClickThroughRate: number;
  edgeCount: number;
}

/**
 * Aggregate edges to entity-level flows for top-level view
 * Note: Same-entity flows (e.g., ECAYTRADE → ECAYTRADE) are excluded
 * as they create self-loops that Sankey diagrams cannot render
 */
export function aggregateToEntityLevel(edges: AttributionEdge[]): EntityFlow[] {
  const flowMap = new Map<string, { users: number; rates: number[]; count: number }>();

  edges.forEach((edge) => {
    const sourceEntity = getEntityFromTouchpoint(edge.source_touchpoint_id);
    const targetEntity = getEntityFromTouchpoint(edge.target_touchpoint_id);

    // Skip same-entity flows (self-loops break Sankey)
    if (sourceEntity === targetEntity) return;

    const key = `${sourceEntity}→${targetEntity}`;

    const existing = flowMap.get(key) ?? { users: 0, rates: [], count: 0 };
    existing.users += edge.metrics.users_flowed;
    existing.rates.push(edge.metrics.click_through_rate);
    existing.count++;
    flowMap.set(key, existing);
  });

  const flows: EntityFlow[] = [];
  flowMap.forEach((data, key) => {
    const [sourceEntity, targetEntity] = key.split("→");
    const avgRate = data.rates.reduce((a, b) => a + b, 0) / data.rates.length;
    flows.push({
      sourceEntity: sourceEntity!,
      targetEntity: targetEntity!,
      totalUsers: data.users,
      avgClickThroughRate: Math.round(avgRate * 100) / 100,
      edgeCount: data.count,
    });
  });

  return flows.sort((a, b) => b.totalUsers - a.totalUsers);
}

/**
 * Transform entity flows to Sankey data format
 */
export function entityFlowsToSankeyData(flows: EntityFlow[]): SankeyData {
  if (flows.length === 0) {
    return { nodes: [], links: [] };
  }

  // Collect unique entities
  const entitySet = new Set<string>();
  flows.forEach((flow) => {
    entitySet.add(flow.sourceEntity);
    entitySet.add(flow.targetEntity);
  });

  // Create nodes
  const entities = Array.from(entitySet);
  const nodes: SankeyNode[] = entities.map((entity) => ({
    name: entity,
    entity: entity,
  }));

  // Create node index map
  const nodeIndex = new Map<string, number>();
  entities.forEach((entity, i) => {
    nodeIndex.set(entity, i);
  });

  // Create links
  const links: SankeyLink[] = flows.map((flow, i) => ({
    source: nodeIndex.get(flow.sourceEntity)!,
    target: nodeIndex.get(flow.targetEntity)!,
    value: flow.totalUsers,
    clickThroughRate: flow.avgClickThroughRate,
    edgeId: `entity-flow-${i}`,
  }));

  return { nodes, links };
}

/**
 * Filter edges to only those between two specific entities
 */
export function filterEdgesByEntityPair(
  edges: AttributionEdge[],
  sourceEntity: string,
  targetEntity: string
): AttributionEdge[] {
  return edges.filter((edge) => {
    const edgeSource = getEntityFromTouchpoint(edge.source_touchpoint_id);
    const edgeTarget = getEntityFromTouchpoint(edge.target_touchpoint_id);
    return edgeSource === sourceEntity && edgeTarget === targetEntity;
  });
}
