"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ServiceLineEditor } from "@/components/dag/ServiceLineEditor";
import type { ServiceLine } from "@/types";

function EditorPageInner() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id") ?? "SL-360-CAMPAIGN";
  const [serviceLine, setServiceLine] = useState<ServiceLine | null>(null);
  const [serviceLines, setServiceLines] = useState<ServiceLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);
  const [newNameInput, setNewNameInput] = useState("New Service Line");

  // Load all service lines for the dropdown
  const loadServiceLines = useCallback(async () => {
    try {
      const response = await fetch("/api/service-lines");
      const json = await response.json();
      if (json.success && json.data) {
        setServiceLines(json.data);
      }
    } catch {
      // Silently fail - dropdown just won't show other options
    }
  }, []);

  // Load a specific service line
  const loadServiceLine = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/service-lines/${encodeURIComponent(id)}`);
      if (!response.ok) {
        if (response.status === 404) {
          setServiceLine(null);
          setMissingId(id);
          return;
        }
        throw new Error(`Failed to load: ${response.statusText}`);
      }
      const json = await response.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || "Invalid response");
      }
      setServiceLine(json.data);
      setMissingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load service line");
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a service line
  const saveServiceLine = useCallback(async (sl: ServiceLine): Promise<boolean> => {
    try {
      const response = await fetch(`/api/service-lines/${encodeURIComponent(sl.service_line_id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sl),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save");
      }
      // Update local state with saved version
      setServiceLine(json.data);
      // Refresh the list in case name changed
      loadServiceLines();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      return false;
    }
  }, [loadServiceLines]);

  // Create a new service line
  const createServiceLine = useCallback(async (id: string, name: string): Promise<boolean> => {
    const newServiceLine: ServiceLine = {
      service_line_id: id,
      name: name,
      description: "",
      nodes: [],
      edges: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const response = await fetch("/api/service-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServiceLine),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to create");
      }
      setServiceLine(json.data);
      loadServiceLines();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service line");
      return false;
    }
  }, [loadServiceLines]);

  // Import a service line from JSON
  const importServiceLine = useCallback((sl: ServiceLine) => {
    setServiceLine(sl);
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadServiceLines();
    loadServiceLine(requestedId);
  }, [loadServiceLines, loadServiceLine, requestedId]);

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
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-6 py-5 shadow-lg text-slate-200 space-y-3 w-full max-w-md">
          <div className="text-lg font-semibold text-white">No service line found</div>
          <p className="text-sm text-slate-400">
            {missingId
              ? `Service line "${missingId}" does not exist yet. Create it to continue.`
              : "No service line available. Create a new one to get started."}
          </p>
          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Service Line ID</label>
            <input
              type="text"
              value={missingId ?? ""}
              onChange={(e) => setMissingId(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. SL-MY-LINE"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-slate-400">Name</label>
            <input
              type="text"
              value={newNameInput}
              onChange={(e) => setNewNameInput(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. New Workflow"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => loadServiceLines().then(() => loadServiceLine(requestedId))}
              className="text-sm text-slate-400 hover:text-white"
            >
              Retry
            </button>
            <button
              onClick={() => {
                const id = (missingId ?? "").trim();
                const name = newNameInput.trim() || "New Service Line";
                if (!id) return;
                createServiceLine(id, name);
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Create & Open
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ServiceLineEditor
      serviceLine={serviceLine}
      serviceLines={serviceLines}
      onSave={saveServiceLine}
      onLoad={loadServiceLine}
      onCreate={createServiceLine}
      onImport={importServiceLine}
    />
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Loading editor...</p>
          </div>
        </div>
      }
    >
      <EditorPageInner />
    </Suspense>
  );
}
