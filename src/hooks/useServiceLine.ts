import { useState, useCallback } from "react";
import type { ServiceLine } from "@/types";

interface UseServiceLineResult {
  serviceLine: ServiceLine | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  load: (id: string) => Promise<void>;
  save: (serviceLine: ServiceLine) => Promise<boolean>;
  listAll: () => Promise<ServiceLine[]>;
}

/**
 * Hook for loading and saving service lines via the API.
 */
export function useServiceLine(initialServiceLine?: ServiceLine): UseServiceLineResult {
  const [serviceLine, setServiceLine] = useState<ServiceLine | null>(initialServiceLine ?? null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/service-lines/${encodeURIComponent(id)}`);
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to load service line");
      }
      setServiceLine(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (sl: ServiceLine): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/service-lines/${encodeURIComponent(sl.service_line_id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sl),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to save service line");
      }
      setServiceLine(json.data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const listAll = useCallback(async (): Promise<ServiceLine[]> => {
    try {
      const response = await fetch("/api/service-lines");
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to list service lines");
      }
      return json.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to list");
      return [];
    }
  }, []);

  return {
    serviceLine,
    loading,
    saving,
    error,
    load,
    save,
    listAll,
  };
}

