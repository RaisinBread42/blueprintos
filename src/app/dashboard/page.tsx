"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import type { ServiceLine } from "@/types";
import { ServiceLineCard } from "@/components/dashboard/ServiceLineCard";
import { VarianceChart } from "@/components/dashboard/VarianceChart";
import { useState, useMemo } from "react";

export default function DashboardPage() {
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

        {serviceLines.length === 0 ? (
          <p className="text-slate-400">No service lines found.</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {serviceLines.map((sl) => {
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
                    {isOpen && <VarianceChart serviceLine={sl} height={160} title="Variance by Station" />}
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

