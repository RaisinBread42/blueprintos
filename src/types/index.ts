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

