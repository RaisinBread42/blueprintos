import type { DataSourceType, ServiceLine, Station, StationMetrics, TrackEdge } from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isDataSourceType(value: unknown): value is DataSourceType {
  return value === "mock" || value === "api";
}

function isStationMetrics(value: unknown): value is StationMetrics {
  if (!isRecord(value)) return false;
  const fair = value.fair_pricing;
  const wc = value.world_class;
  const perf = value.performance_proof;
  if (!isRecord(fair) || !isRecord(wc) || !isRecord(perf)) return false;

  if (!isNumber(fair.planned_hrs) || !isNumber(fair.actual_hrs) || !isNumber(fair.labor_variance)) return false;
  if (!isNumber(wc.internal_qa_score) || !isBoolean(wc.standard_met)) return false;

  // performance_proof is intentionally flexible; accept any object
  return true;
}

function isStation(value: unknown): value is Station {
  if (!isRecord(value)) return false;
  return (
    isString(value.station_id) &&
    isString(value.name) &&
    isDataSourceType(value.data_source) &&
    isStationMetrics(value.metrics)
  );
}

function isTrackEdge(value: unknown): value is TrackEdge {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || !isString(value.source_station_id) || !isString(value.target_station_id)) return false;
  if (!isRecord(value.weight)) return false;
  return isNumber(value.weight.cost) && isNumber(value.weight.time);
}

export function isServiceLine(value: unknown): value is ServiceLine {
  if (!isRecord(value)) return false;
  if (!isString(value.service_line_id) || !isString(value.name)) return false;
  if (!isString(value.created_at) || !isString(value.updated_at)) return false;
  if (!Array.isArray(value.nodes) || !value.nodes.every(isStation)) return false;
  if (!Array.isArray(value.edges) || !value.edges.every(isTrackEdge)) return false;
  return true;
}


