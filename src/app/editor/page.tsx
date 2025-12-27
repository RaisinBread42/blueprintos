"use client";

import { useEffect, useState } from "react";
import { ServiceLineEditor } from "@/components/dag/ServiceLineEditor";
import type { ServiceLine } from "@/types";

export default function EditorPage() {
  const [serviceLine, setServiceLine] = useState<ServiceLine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadServiceLine() {
      try {
        // Load the default service line
        const response = await fetch("/api/service-lines/SL-360-CAMPAIGN");
        if (!response.ok) {
          throw new Error(`Failed to load: ${response.statusText}`);
        }
        const json = await response.json();
        if (!json.success || !json.data) {
          throw new Error(json.error || "Invalid response");
        }
        setServiceLine(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load service line");
      } finally {
        setLoading(false);
      }
    }

    loadServiceLine();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading service line...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-400">
          <p className="font-medium">Error loading service line</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  if (!serviceLine) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-slate-400">No service line found</p>
      </div>
    );
  }

  return <ServiceLineEditor serviceLine={serviceLine} />;
}

