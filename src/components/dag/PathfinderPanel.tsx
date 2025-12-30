"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findAllPaths, toWeightedEdges, type PathResult } from "@/lib/dag/pathfinder";
import type { Edge } from "reactflow";
import type { TrackEdgeData } from "@/lib/dag/transforms";

interface Station {
  id: string;
  name: string;
}

interface PathfinderPanelProps {
  stations: Station[];
  edges: Edge<TrackEdgeData>[];
  onSelectPath: (edgeIds: string[] | null) => void;
  onClose: () => void;
}

export function PathfinderPanel({
  stations,
  edges,
  onSelectPath,
  onClose,
}: PathfinderPanelProps) {
  const [startId, setStartId] = useState<string>("");
  const [endId, setEndId] = useState<string>("");
  const [paths, setPaths] = useState<PathResult[]>([]);
  const [selectedPathIndex, setSelectedPathIndex] = useState<number | null>(null);

  // Convert edges for pathfinding
  const weightedEdges = useMemo(() => toWeightedEdges(edges), [edges]);

  // Get station name by ID
  const getStationName = (id: string) => {
    return stations.find((s) => s.id === id)?.name ?? id;
  };

  const handleFindPaths = () => {
    if (!startId || !endId) return;

    const foundPaths = findAllPaths(weightedEdges, startId, endId);
    setPaths(foundPaths);
    setSelectedPathIndex(null);
    onSelectPath(null);
  };

  const handleSelectPath = (index: number) => {
    setSelectedPathIndex(index);
    onSelectPath(paths[index].edges);
  };

  const handleClearSelection = () => {
    setSelectedPathIndex(null);
    onSelectPath(null);
  };

  return (
    <div className="flex h-full flex-col border-l border-slate-700 bg-slate-900 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-cyan-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white">Pathfinder</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Station Selection */}
      <div className="space-y-3">
        <div>
          <Label className="text-slate-300">From Station</Label>
          <Select value={startId} onValueChange={setStartId}>
            <SelectTrigger className="mt-1 border-slate-600 bg-slate-800 text-white">
              <SelectValue placeholder="Select start..." />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-800">
              {stations.map((station) => (
                <SelectItem
                  key={station.id}
                  value={station.id}
                  className="text-white hover:bg-slate-700"
                >
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-slate-300">To Station</Label>
          <Select value={endId} onValueChange={setEndId}>
            <SelectTrigger className="mt-1 border-slate-600 bg-slate-800 text-white">
              <SelectValue placeholder="Select end..." />
            </SelectTrigger>
            <SelectContent className="border-slate-600 bg-slate-800">
              {stations.map((station) => (
                <SelectItem
                  key={station.id}
                  value={station.id}
                  className="text-white hover:bg-slate-700"
                >
                  {station.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleFindPaths}
          disabled={!startId || !endId || startId === endId}
          className="w-full bg-cyan-600 hover:bg-cyan-700"
        >
          Find Paths
        </Button>
      </div>

      {/* Results */}
      <div className="mt-4 flex-1 overflow-auto">
        {paths.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                {paths.length} path{paths.length !== 1 ? "s" : ""} found
              </p>
              {selectedPathIndex !== null && (
                <button
                  onClick={handleClearSelection}
                  className="text-xs text-cyan-400 hover:text-cyan-300"
                >
                  Clear selection
                </button>
              )}
            </div>

            {paths.map((path, index) => (
              <button
                key={index}
                onClick={() => handleSelectPath(index)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  selectedPathIndex === index
                    ? "border-cyan-500 bg-cyan-900/30"
                    : "border-slate-700 bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">
                    Path {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      index === 0
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    Weight: {path.totalWeight}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {path.path.map((id) => getStationName(id)).join(" → ")}
                </p>
              </button>
            ))}
          </div>
        ) : startId && endId && startId !== endId ? (
          <p className="text-center text-sm text-slate-500">
            Click &quot;Find Paths&quot; to search
          </p>
        ) : (
          <p className="text-center text-sm text-slate-500">
            Select start and end stations
          </p>
        )}

        {paths.length === 0 && startId && endId && startId !== endId && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-900/20 p-3">
            <p className="text-sm text-amber-300">
              No paths found between these stations. They may not be connected.
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 border-t border-slate-700 pt-3">
        <p className="text-xs text-slate-500">
          Weight = cost + time for each edge. Lower is better.
        </p>
      </div>
    </div>
  );
}
