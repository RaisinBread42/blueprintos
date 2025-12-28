"use client";

import { X, GitBranch, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { TrackEdgeData } from "@/lib/dag/transforms";

interface EdgePanelProps {
  edgeId: string;
  source: string;
  target: string;
  data: TrackEdgeData | undefined;
  onClose: () => void;
  onUpdate: (updates: Partial<TrackEdgeData>) => void;
  onDelete: () => void;
}

/**
 * Side panel for viewing and editing edge (track) details.
 */
export function EdgePanel({ edgeId, source, target, data, onClose, onUpdate, onDelete }: EdgePanelProps) {
  const weight = data?.weight ?? { cost: 1, time: 1 };

  return (
    <div className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Edit Track</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Edge Info */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Connection
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Edge ID</span>
              <span className="text-sm text-slate-200 font-mono text-right truncate max-w-[140px]">{edgeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">From</span>
              <span className="text-sm text-slate-200 font-mono">{source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">To</span>
              <span className="text-sm text-slate-200 font-mono">{target}</span>
            </div>
          </div>
        </section>

        {/* Edge Weights */}
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-3">
            Track Weights
          </h3>
          <div className="space-y-4">
            {/* Cost Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="edge-cost" className="text-slate-400 text-xs">
                Cost Weight
              </Label>
              <Input
                id="edge-cost"
                type="number"
                min={0}
                step={1}
                value={weight.cost}
                onChange={(e) => onUpdate({
                  weight: { ...weight, cost: parseInt(e.target.value) || 0 }
                })}
                className="bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-500">Relative cost to traverse this track</p>
            </div>

            {/* Time Weight */}
            <div className="space-y-1.5">
              <Label htmlFor="edge-time" className="text-slate-400 text-xs">
                Time Weight
              </Label>
              <Input
                id="edge-time"
                type="number"
                min={0}
                step={1}
                value={weight.time}
                onChange={(e) => onUpdate({
                  weight: { ...weight, time: parseInt(e.target.value) || 0 }
                })}
                className="bg-slate-900 border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20"
              />
              <p className="text-xs text-slate-500">Relative time to traverse this track</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with delete */}
      <div className="border-t border-slate-800 px-4 py-3 space-y-3">
        <Button
          onClick={onDelete}
          variant="outline"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Track
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Or press Delete/Backspace with track selected
        </p>
      </div>
    </div>
  );
}

