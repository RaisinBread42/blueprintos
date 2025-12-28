"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import type { ServiceLine } from "@/types";
import { ServiceLineCard } from "@/components/dashboard/ServiceLineCard";
import { VarianceChart } from "@/components/dashboard/VarianceChart";
import { QADistributionChart } from "@/components/dashboard/QADistributionChart";

type ScenarioPayload = {
  laborDelta: number;
  timeDelta: number;
  qualityDelta: number;
};

const defaultScenario: ScenarioPayload = { laborDelta: 0, timeDelta: 0, qualityDelta: 0 };

export default function DashboardPage() {
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"base" | "scenario">("base");
  const [scenarioNameInput, setScenarioNameInput] = useState("default");
  const [scenarioName, setScenarioName] = useState("default");
  const [scenarioData, setScenarioData] = useState<Record<string, ScenarioPayload>>({});
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/service-lines");
        const json = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load service lines");
        }
        setServiceLines(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service lines");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const applyScenarioToMetrics = useCallback((metrics: ServiceLine["nodes"][number]["metrics"], scenario: ScenarioPayload) => {
    const planned = Math.max(0, metrics.fair_pricing.planned_hrs + scenario.timeDelta);
    const actual = Math.max(0, metrics.fair_pricing.actual_hrs + scenario.laborDelta);
    const labor_variance = actual - planned;

    const qa_score = Math.min(10, Math.max(0, metrics.world_class.internal_qa_score + scenario.qualityDelta));
    const benchmark =
      metrics.world_class.industry_benchmark !== undefined
        ? Math.min(10, Math.max(0, metrics.world_class.industry_benchmark + scenario.qualityDelta))
        : undefined;
    const standard_met = benchmark === undefined ? metrics.world_class.standard_met : qa_score >= benchmark;

    return {
      fair_pricing: {
        ...metrics.fair_pricing,
        planned_hrs: planned,
        actual_hrs: actual,
        labor_variance,
      },
      world_class: {
        ...metrics.world_class,
        internal_qa_score: qa_score,
        industry_benchmark: benchmark,
        standard_met,
      },
      performance_proof: { ...metrics.performance_proof },
    };
  }, []);

  const applyScenarioToServiceLine = useCallback(
    (sl: ServiceLine, scenario: ScenarioPayload): ServiceLine => ({
      ...sl,
      nodes: sl.nodes.map((n) => ({
        ...n,
        metrics: applyScenarioToMetrics(n.metrics, scenario),
      })),
    }),
    [applyScenarioToMetrics]
  );

  const loadScenarioForAll = useCallback(
    async (name: string) => {
      if (serviceLines.length === 0) return;
      setScenarioLoading(true);
      setScenarioError(null);
      try {
        const entries = await Promise.all(
          serviceLines.map(async (sl) => {
            try {
              const res = await fetch(
                `/api/scenarios/${encodeURIComponent(sl.service_line_id)}?name=${encodeURIComponent(name)}`
              );
              if (!res.ok) {
                return [sl.service_line_id, defaultScenario] as const;
              }
              const json = await res.json();
              if (json.success && json.data?.scenario) {
                return [sl.service_line_id, json.data.scenario as ScenarioPayload] as const;
              }
            } catch {
              // ignore
            }
            return [sl.service_line_id, defaultScenario] as const;
          })
        );
        setScenarioData(Object.fromEntries(entries));
      } catch (err) {
        setScenarioError(err instanceof Error ? err.message : "Failed to load scenarios");
      } finally {
        setScenarioLoading(false);
      }
    },
    [serviceLines]
  );

  useEffect(() => {
    if (viewMode === "scenario") {
      loadScenarioForAll(scenarioName || "default");
    }
  }, [viewMode, scenarioName, loadScenarioForAll]);

  const serviceLinesForView = useMemo(() => {
    if (viewMode !== "scenario") return serviceLines;
    return serviceLines.map((sl) => applyScenarioToServiceLine(sl, scenarioData[sl.service_line_id] ?? defaultScenario));
  }, [viewMode, serviceLines, scenarioData, applyScenarioToServiceLine]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-300">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <p className="text-sm">Loading service lines...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
          <p className="font-medium">Error</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Service Line Dashboard</h1>
            <p className="text-slate-400 text-sm">Overview of all service lines and their health</p>
          </div>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 px-3 py-2 text-sm text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Link>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
          <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/70 p-1">
            <button
              className={`px-3 py-1 rounded-md ${viewMode === "base" ? "bg-slate-800 text-white" : "text-slate-400"}`}
              onClick={() => setViewMode("base")}
            >
              Base
            </button>
            <button
              className={`px-3 py-1 rounded-md ${viewMode === "scenario" ? "bg-emerald-900/60 text-emerald-100" : "text-slate-400"}`}
              onClick={() => setViewMode("scenario")}
            >
              Scenario
            </button>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2">
            <span className="text-slate-400">Scenario name</span>
            <input
              value={scenarioNameInput}
              onChange={(e) => setScenarioNameInput(e.target.value)}
              className="w-40 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 text-sm"
              placeholder="default"
            />
            <button
              onClick={() => setScenarioName(scenarioNameInput.trim() || "default")}
              className="rounded-md bg-emerald-700 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
            >
              Apply
            </button>
            {scenarioLoading && <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />}
          </div>
          {scenarioError && <span className="text-xs text-red-400">Scenario error: {scenarioError}</span>}
        </div>

        {serviceLinesForView.length === 0 ? (
          <p className="text-slate-400">No service lines found.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceLinesForView.map((sl) => {
                const isOpen = expanded[sl.service_line_id] ?? false;
                return (
                  <div key={sl.service_line_id} className="space-y-3">
                    <ServiceLineCard
                      serviceLine={sl}
                      expanded={isOpen}
                      onToggleBreakdown={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [sl.service_line_id]: !isOpen,
                        }))
                      }
                    />
                    {isOpen && (
                      <div className="space-y-3">
                        <VarianceChart serviceLine={sl} title="Variance by Station" />
                        <QADistributionChart serviceLine={sl} title="QA Scores vs Benchmark" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

