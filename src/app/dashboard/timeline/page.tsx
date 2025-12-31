"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { TimelineView } from "@/components/dashboard/TimelineView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Changelog, ChangelogEvent, ChangelogEventType, StationSnapshot } from "@/types";

const EVENT_TYPES: { value: ChangelogEventType; label: string }[] = [
  { value: "process_change", label: "Process Change" },
  { value: "team_change", label: "Team Change" },
  { value: "tool_change", label: "Tool Change" },
  { value: "policy_change", label: "Policy Change" },
];

const STATIONS = [
  "SALES_MKTG",
  "CONTENT_CREATIVE",
  "MEDIA_BUY",
  "ACCOUNT_MGMT",
  "OPS_PM",
];

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TimelineDashboardPage() {
  const [changelog, setChangelog] = useState<Changelog>({ events: [] });
  const [snapshots, setSnapshots] = useState<StationSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState<ChangelogEventType>("process_change");
  const [formDate, setFormDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStations, setFormStations] = useState<string[]>([]);
  const [formImpact, setFormImpact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Get available dates from snapshots
  const availableDates = useMemo(() => {
    return snapshots.map((s) => s.period).sort();
  }, [snapshots]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [changelogRes, snapshotsRes] = await Promise.all([
        fetch("/api/changelog"),
        fetch("/api/snapshots/stations"),
      ]);

      const changelogJson = await changelogRes.json();
      const snapshotsJson = await snapshotsRes.json();

      if (changelogJson.success) {
        setChangelog(changelogJson.data);
      } else {
        setError(changelogJson.error || "Failed to load changelog");
      }

      if (snapshotsJson.success) {
        setSnapshots(snapshotsJson.data);
        // Set default date to latest snapshot
        if (snapshotsJson.data.length > 0) {
          const periods = snapshotsJson.data.map((s: StationSnapshot) => s.period).sort();
          setFormDate(periods[periods.length - 1]);
        }
      }
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formStations.length === 0 || !formDate) return;

    setSubmitting(true);
    try {
      const event: ChangelogEvent = {
        id: `evt-${Date.now()}`,
        date: formDate,
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        affected_stations: formStations,
        expected_impact: formImpact.trim() || undefined,
      };

      const res = await fetch("/api/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const json = await res.json();
      if (json.success) {
        setChangelog(json.data);
        setShowAddModal(false);
        resetForm();
      } else {
        setError(json.error || "Failed to add event");
      }
    } catch {
      setError("Failed to add event");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormType("process_change");
    setFormDate(availableDates[availableDates.length - 1] || "");
    setFormDescription("");
    setFormStations([]);
    setFormImpact("");
  };

  const toggleStation = (station: string) => {
    setFormStations((prev) =>
      prev.includes(station)
        ? prev.filter((s) => s !== station)
        : [...prev, station]
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Change Timeline</h1>
          <p className="text-sm text-slate-400">
            Track changes and correlate with metric improvements
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Timeline */}
      <TimelineView events={changelog.events} />

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Add Change Event</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-slate-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Streamlined approval process"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Type & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-slate-300">
                    Type
                  </Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v as ChangelogEventType)}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {EVENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value} className="text-white hover:bg-slate-700">
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-slate-300">
                    Date *
                  </Label>
                  <Select value={formDate} onValueChange={setFormDate}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableDates.map((date) => (
                        <SelectItem key={date} value={date} className="text-white hover:bg-slate-700">
                          {formatDateDisplay(date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-slate-300">
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the change..."
                  rows={3}
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Affected Stations */}
              <div className="space-y-1.5">
                <Label className="text-slate-300">Affected Stations *</Label>
                <div className="flex flex-wrap gap-2">
                  {STATIONS.map((station) => (
                    <button
                      key={station}
                      type="button"
                      onClick={() => toggleStation(station)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        formStations.includes(station)
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
                      }`}
                    >
                      {station.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Impact */}
              <div className="space-y-1.5">
                <Label htmlFor="impact" className="text-slate-300">
                  Expected Impact
                </Label>
                <Input
                  id="impact"
                  value={formImpact}
                  onChange={(e) => setFormImpact(e.target.value)}
                  placeholder="e.g., Reduce hours by 10%"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formTitle.trim() || formStations.length === 0 || !formDate}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
