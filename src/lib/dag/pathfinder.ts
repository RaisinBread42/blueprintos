/**
 * Pathfinding utilities for service line DAGs.
 * Finds and ranks all paths between two stations based on edge weights.
 */

export interface WeightedEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface PathResult {
  /** Station IDs in order from start to end */
  path: string[];
  /** Edge IDs traversed */
  edges: string[];
  /** Sum of edge weights along the path */
  totalWeight: number;
}

/**
 * Build an adjacency list from edges for efficient traversal.
 */
function buildAdjacencyList(
  edges: WeightedEdge[]
): Map<string, Array<{ target: string; edgeId: string; weight: number }>> {
  const adj = new Map<string, Array<{ target: string; edgeId: string; weight: number }>>();

  for (const edge of edges) {
    if (!adj.has(edge.source)) {
      adj.set(edge.source, []);
    }
    adj.get(edge.source)!.push({
      target: edge.target,
      edgeId: edge.id,
      weight: edge.weight,
    });
  }

  return adj;
}

/**
 * Find all paths from startId to endId using DFS.
 * Works correctly for DAGs (no cycles).
 *
 * @param edges - Array of weighted edges
 * @param startId - Starting station ID
 * @param endId - Target station ID
 * @returns Array of PathResult sorted by totalWeight (ascending)
 */
export function findAllPaths(
  edges: WeightedEdge[],
  startId: string,
  endId: string
): PathResult[] {
  if (startId === endId) {
    return [{ path: [startId], edges: [], totalWeight: 0 }];
  }

  const adj = buildAdjacencyList(edges);
  const results: PathResult[] = [];

  // DFS with path tracking
  function dfs(
    currentId: string,
    currentPath: string[],
    currentEdges: string[],
    currentWeight: number,
    visited: Set<string>
  ): void {
    if (currentId === endId) {
      results.push({
        path: [...currentPath],
        edges: [...currentEdges],
        totalWeight: currentWeight,
      });
      return;
    }

    const neighbors = adj.get(currentId);
    if (!neighbors) return;

    for (const { target, edgeId, weight } of neighbors) {
      // Prevent cycles (shouldn't happen in DAG, but safety check)
      if (visited.has(target)) continue;

      visited.add(target);
      currentPath.push(target);
      currentEdges.push(edgeId);

      dfs(target, currentPath, currentEdges, currentWeight + weight, visited);

      // Backtrack
      currentPath.pop();
      currentEdges.pop();
      visited.delete(target);
    }
  }

  const visited = new Set<string>([startId]);
  dfs(startId, [startId], [], 0, visited);

  // Sort by total weight (lowest first)
  results.sort((a, b) => a.totalWeight - b.totalWeight);

  return results;
}

/**
 * Get the shortest (minimum weight) path between two stations.
 * Returns null if no path exists.
 */
export function findShortestPath(
  edges: WeightedEdge[],
  startId: string,
  endId: string
): PathResult | null {
  const paths = findAllPaths(edges, startId, endId);
  return paths.length > 0 ? paths[0] : null;
}

/**
 * Convert React Flow edges to WeightedEdge format for pathfinding.
 * Combines cost + time into a single weight.
 */
export function toWeightedEdges(
  edges: Array<{
    id: string;
    source: string;
    target: string;
    data?: { weight?: { cost?: number; time?: number } };
  }>
): WeightedEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    weight:
      (edge.data?.weight?.cost ?? 1) + (edge.data?.weight?.time ?? 1),
  }));
}
