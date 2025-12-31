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
  missing?: boolean;
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

// =============================================================================
// Entity Registry Types - Cross-Entity Attribution (2026 Multiplex Network)
// =============================================================================

/**
 * Entity type - the kind of business unit in the ecosystem
 */
export type EntityType =
  | "radio"
  | "marketplace"
  | "news"
  | "rewards"
  | "internal";

/**
 * Touchpoint metrics - observable user interaction metrics
 */
export interface TouchpointMetrics {
  impressions: number;
  unique_users: number;
  avg_time_spent?: number;
}

/**
 * Touchpoint - an observable user interaction point within an entity
 * Examples: "X107 Solar Panel Ad", "eCayTrade Real Estate Search"
 */
export interface Touchpoint {
  touchpoint_id: string;
  entity_id: string;
  name: string;
  category: string; // "audio_ad", "search", "article_view", "listing", "purchase"
  metrics: TouchpointMetrics;
  data_source: DataSourceType;
}

/**
 * Entity - a business unit in the ecosystem
 * Examples: Stingray Radio, eCayTrade, Caymanian Times
 */
export interface Entity {
  entity_id: string;
  name: string;
  type: EntityType;
  description?: string;
  touchpoints: Touchpoint[];
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Attribution Types - Cross-Entity User Flow Tracking
// =============================================================================

/**
 * Attribution model - how credit is assigned across touchpoints
 */
export type AttributionModel =
  | "first_touch"
  | "last_touch"
  | "linear"
  | "time_decay";

/**
 * Period type for snapshots
 */
export type SnapshotPeriodType = "weekly" | "monthly" | "quarterly";

/**
 * Attribution Edge metrics - flow statistics between two touchpoints
 */
export interface AttributionEdgeMetrics {
  users_flowed: number;
  click_through_rate: number;
  lift_vs_baseline?: number;
}

/**
 * Attribution Edge - user flow between two touchpoints
 * Represents how users move from one touchpoint to another
 */
export interface AttributionEdge {
  id: string;
  source_touchpoint_id: string;
  target_touchpoint_id: string;
  period: string;
  metrics: AttributionEdgeMetrics;
  attribution_model: AttributionModel;
}

/**
 * Gap Opportunity - demand vs supply mismatch
 * Identifies opportunities where user demand exceeds available supply
 */
export interface GapOpportunity {
  touchpoint_id: string;
  search_demand: number;
  supply_count: number;
  gap_score: number;
  recommended_action: string;
  /** Optional category for grouping (e.g., "vehicles", "real-estate") */
  category?: string;
  /** Optional trend indicator: "rising", "stable", "falling" */
  trend?: "rising" | "stable" | "falling";
  /** Optional revenue potential estimate */
  revenue_potential?: number;
}

/**
 * Journey Insights - computed analytics for a snapshot
 */
export interface JourneyInsights {
  highest_click_through_path: string[];
  biggest_bridge?: string;
  gap_opportunities: GapOpportunity[];
}

/**
 * Journey Snapshot - aggregated cross-entity flow for a time period
 * Captures user journeys across entities for analysis and visualization
 */
export interface JourneySnapshot {
  snapshot_id: string;
  period: string;
  period_type: SnapshotPeriodType;
  entities: string[];
  edges: AttributionEdge[];
  computed_at: string;
  insights: JourneyInsights;
}

