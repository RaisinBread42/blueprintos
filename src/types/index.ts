/**
 * TypeScript type definitions for the project
 */

// Feature tracking types
export interface Feature {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  priority: Priority;
  complexity: Complexity;
  createdAt: string;
  phases: FeaturePhases;
  files: string[];
  dependencies: string[];
  notes?: string;
  blockedBy?: string[];
}

export type FeatureStatus =
  | "backlog"
  | "planning"
  | "accepted"
  | "implementing"
  | "implemented"
  | "verifying"
  | "complete"
  | "blocked";

export type Priority = "critical" | "high" | "medium" | "low";

export type Complexity = "S" | "M" | "L" | "XL";

export interface FeaturePhases {
  planning?: PhaseRecord;
  accepted?: PhaseRecord;
  implemented?: PhaseRecord;
  verified?: PhaseRecord;
  committed?: PhaseRecord & { commitHash?: string };
}

export interface PhaseRecord {
  completedAt: string;
  notes?: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  complexity?: Complexity;
  addedAt: string;
}

export interface FeaturesFile {
  projectName: string;
  lastUpdated: string;
  features: Feature[];
  backlog: BacklogItem[];
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// =============================================================================
// BlueprintOS Core Types - The "Standard Gauge" Schema
// See VISION.md for full specification
// =============================================================================

/**
 * RAG (Red-Amber-Green) status indicators for nodes and edges
 */
export type RAGStatus = "red" | "amber" | "green";

/**
 * Data source type for a station - supports mock or live data
 */
export type DataSourceType = "mock" | "api";

/**
 * Fair Pricing metrics - measures operational efficiency
 * Success: actual_labor <= market_value
 */
export interface FairPricingMetrics {
  planned_hrs: number;
  actual_hrs: number;
  labor_variance: number;
  market_value?: number;
  actual_labor_cost?: number;
}

/**
 * World Class metrics - measures quality standards
 * Success: performance_proof >= industry_benchmark
 */
export interface WorldClassMetrics {
  internal_qa_score: number;
  standard_met: boolean;
  industry_benchmark?: number;
}

/**
 * Performance Proof metrics - measures client impact
 */
export interface PerformanceProofMetrics {
  client_approval_speed?: string;
  engagement_rate?: number;
  conversion_rate?: number;
  roi?: number;
  [key: string]: string | number | undefined;
}

/**
 * Station Metrics - the sensor data for each node
 */
export interface StationMetrics {
  fair_pricing: FairPricingMetrics;
  world_class: WorldClassMetrics;
  performance_proof: PerformanceProofMetrics;
}

/**
 * Station (Node) - a department or processing point in the DAG
 */
export interface Station {
  station_id: string;
  name: string;
  department?: string;
  metrics: StationMetrics;
  data_source: DataSourceType;
  rag_status?: RAGStatus;
  position?: { x: number; y: number };
}

/**
 * Edge - a connection between stations with weight for pathfinding
 */
export interface TrackEdge {
  id: string;
  source_station_id: string;
  target_station_id: string;
  weight: {
    cost: number;
    time: number;
  };
  rag_status?: RAGStatus;
}

/**
 * Service Line - a complete workflow track in the DAG
 */
export interface ServiceLine {
  service_line_id: string;
  name: string;
  description?: string;
  nodes: Station[];
  edges: TrackEdge[];
  created_at: string;
  updated_at: string;
}

/**
 * Cargo - a unit of work flowing through the system
 */
export interface Cargo {
  cargo_id: string;
  project_name: string;
  service_line_id: string;
  current_station_id: string;
  status: "in_transit" | "at_station" | "delivered" | "blocked";
  path_history: string[];
  started_at: string;
  estimated_delivery?: string;
  actual_delivery?: string;
}

/**
 * Dispatcher Alert - AI-generated alert based on system state
 */
export interface DispatcherAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  affected_stations: string[];
  generated_at: string;
  acknowledged: boolean;
}

/**
 * Dispatcher Report - AI-generated narrative summary
 */
export interface DispatcherReport {
  id: string;
  generated_at: string;
  period: "daily" | "weekly" | "monthly";
  narrative: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

/**
 * BlueprintOS State - the complete system state
 */
export interface BlueprintOSState {
  service_lines: ServiceLine[];
  active_cargo: Cargo[];
  global_alerts: DispatcherAlert[];
  latest_report?: DispatcherReport;
  system_health: {
    overall_rag: RAGStatus;
    fairly_priced_score: number;
    world_class_score: number;
  };
}

/**
 * Simulation Config - for sandbox mode stress testing
 */
export interface SimulationConfig {
  labor_cost_multiplier: number;
  time_delay_multiplier: number;
  quality_variance: number;
  enabled: boolean;
}

