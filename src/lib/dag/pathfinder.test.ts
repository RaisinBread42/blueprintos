import { describe, it, expect } from "vitest";
import {
  findAllPaths,
  findShortestPath,
  toWeightedEdges,
  type WeightedEdge,
} from "./pathfinder";

describe("findAllPaths", () => {
  it("returns single-node path when start equals end", () => {
    const edges: WeightedEdge[] = [];
    const paths = findAllPaths(edges, "A", "A");

    expect(paths).toHaveLength(1);
    expect(paths[0]).toEqual({
      path: ["A"],
      edges: [],
      totalWeight: 0,
    });
  });

  it("finds single path in linear graph", () => {
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 3 },
      { id: "B->C", source: "B", target: "C", weight: 5 },
    ];
    const paths = findAllPaths(edges, "A", "C");

    expect(paths).toHaveLength(1);
    expect(paths[0]).toEqual({
      path: ["A", "B", "C"],
      edges: ["A->B", "B->C"],
      totalWeight: 8,
    });
  });

  it("finds multiple paths and sorts by weight", () => {
    // Diamond graph: A -> B -> D (weight 4+2=6)
    //                A -> C -> D (weight 1+3=4)
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 4 },
      { id: "A->C", source: "A", target: "C", weight: 1 },
      { id: "B->D", source: "B", target: "D", weight: 2 },
      { id: "C->D", source: "C", target: "D", weight: 3 },
    ];
    const paths = findAllPaths(edges, "A", "D");

    expect(paths).toHaveLength(2);
    // Shortest path first (via C)
    expect(paths[0].totalWeight).toBe(4);
    expect(paths[0].path).toEqual(["A", "C", "D"]);
    // Longer path second (via B)
    expect(paths[1].totalWeight).toBe(6);
    expect(paths[1].path).toEqual(["A", "B", "D"]);
  });

  it("returns empty array when no path exists", () => {
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 1 },
    ];
    const paths = findAllPaths(edges, "A", "C");

    expect(paths).toHaveLength(0);
  });

  it("handles complex DAG with multiple paths", () => {
    // A -> B -> C -> E
    // A -> B -> D -> E
    // A -> D -> E
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 2 },
      { id: "A->D", source: "A", target: "D", weight: 5 },
      { id: "B->C", source: "B", target: "C", weight: 1 },
      { id: "B->D", source: "B", target: "D", weight: 2 },
      { id: "C->E", source: "C", target: "E", weight: 3 },
      { id: "D->E", source: "D", target: "E", weight: 1 },
    ];
    const paths = findAllPaths(edges, "A", "E");

    expect(paths.length).toBeGreaterThanOrEqual(3);
    // All paths should end at E
    for (const p of paths) {
      expect(p.path[0]).toBe("A");
      expect(p.path[p.path.length - 1]).toBe("E");
    }
    // Should be sorted by weight
    for (let i = 1; i < paths.length; i++) {
      expect(paths[i].totalWeight).toBeGreaterThanOrEqual(
        paths[i - 1].totalWeight
      );
    }
  });
});

describe("findShortestPath", () => {
  it("returns shortest path from multiple options", () => {
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 10 },
      { id: "A->C", source: "A", target: "C", weight: 1 },
      { id: "B->D", source: "B", target: "D", weight: 1 },
      { id: "C->D", source: "C", target: "D", weight: 2 },
    ];
    const shortest = findShortestPath(edges, "A", "D");

    expect(shortest).not.toBeNull();
    expect(shortest!.totalWeight).toBe(3);
    expect(shortest!.path).toEqual(["A", "C", "D"]);
  });

  it("returns null when no path exists", () => {
    const edges: WeightedEdge[] = [
      { id: "A->B", source: "A", target: "B", weight: 1 },
    ];
    const shortest = findShortestPath(edges, "A", "C");

    expect(shortest).toBeNull();
  });
});

describe("toWeightedEdges", () => {
  it("converts React Flow edges to weighted edges", () => {
    const rfEdges = [
      {
        id: "X->Y",
        source: "X",
        target: "Y",
        data: { weight: { cost: 3, time: 2 } },
      },
      {
        id: "Y->Z",
        source: "Y",
        target: "Z",
        data: { weight: { cost: 1, time: 4 } },
      },
    ];
    const weighted = toWeightedEdges(rfEdges);

    expect(weighted).toEqual([
      { id: "X->Y", source: "X", target: "Y", weight: 5 },
      { id: "Y->Z", source: "Y", target: "Z", weight: 5 },
    ]);
  });

  it("uses defaults when weight data is missing", () => {
    const rfEdges = [
      { id: "A->B", source: "A", target: "B" },
      { id: "B->C", source: "B", target: "C", data: {} },
    ];
    const weighted = toWeightedEdges(rfEdges);

    expect(weighted[0].weight).toBe(2); // 1 + 1 defaults
    expect(weighted[1].weight).toBe(2);
  });
});
