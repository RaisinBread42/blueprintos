/**
 * Transform utilities for converting between ServiceLine and React Flow formats.
 *
 * ServiceLine is our domain model (Standard Gauge schema).
 * React Flow has its own Node/Edge format for rendering.
 */

import type { Node, Edge } from "reactflow";
import type { ServiceLine, Station, TrackEdge } from "@/types";

/**
 * Station node data stored in React Flow nodes
 */
export interface StationNodeData {
  station_id: string;
  name: string;
  department?: string;
  data_source: "mock" | "api";
  metrics: Station["metrics"];
  rag_status?: "red" | "amber" | "green";
}

/**
 * Edge data stored in React Flow edges
 */
export interface TrackEdgeData {
  weight: {
    cost: number;
    time: number;
  };
  rag_status?: "red" | "amber" | "green";
}

/**
 * Convert a Station to a React Flow Node
 */
export function stationToNode(station: Station): Node<StationNodeData> {
  return {
    id: station.station_id,
    type: "stationNode", // Custom node type (will use default until we build custom)
    position: station.position ?? { x: 0, y: 0 },
    data: {
      station_id: station.station_id,
      name: station.name,
      department: station.department,
      data_source: station.data_source,
      metrics: station.metrics,
      rag_status: station.rag_status,
    },
  };
}

/**
 * Convert a TrackEdge to a React Flow Edge
 */
export function trackToEdge(track: TrackEdge): Edge<TrackEdgeData> {
  return {
    id: track.id,
    source: track.source_station_id,
    target: track.target_station_id,
    type: "default", // Can be "smoothstep", "step", "straight", or custom
    animated: false,
    data: {
      weight: track.weight,
      rag_status: track.rag_status,
    },
  };
}

/**
 * Convert a ServiceLine to React Flow nodes and edges
 */
export function serviceLineToFlow(serviceLine: ServiceLine): {
  nodes: Node<StationNodeData>[];
  edges: Edge<TrackEdgeData>[];
} {
  return {
    nodes: serviceLine.nodes.map(stationToNode),
    edges: serviceLine.edges.map(trackToEdge),
  };
}

/**
 * Convert a React Flow Node back to a Station
 */
export function nodeToStation(node: Node<StationNodeData>): Station {
  return {
    station_id: node.data.station_id,
    name: node.data.name,
    department: node.data.department,
    data_source: node.data.data_source,
    metrics: node.data.metrics,
    rag_status: node.data.rag_status,
    position: { x: node.position.x, y: node.position.y },
  };
}

/**
 * Convert a React Flow Edge back to a TrackEdge
 */
export function edgeToTrack(edge: Edge<TrackEdgeData>): TrackEdge {
  return {
    id: edge.id,
    source_station_id: edge.source,
    target_station_id: edge.target,
    weight: edge.data?.weight ?? { cost: 1, time: 1 },
    rag_status: edge.data?.rag_status,
  };
}

/**
 * Convert React Flow nodes and edges back to a ServiceLine
 * (requires existing serviceLine for metadata)
 */
export function flowToServiceLine(
  nodes: Node<StationNodeData>[],
  edges: Edge<TrackEdgeData>[],
  base: Pick<ServiceLine, "service_line_id" | "name" | "description" | "created_at">
): ServiceLine {
  return {
    ...base,
    nodes: nodes.map(nodeToStation),
    edges: edges.map(edgeToTrack),
    updated_at: new Date().toISOString(),
  };
}

