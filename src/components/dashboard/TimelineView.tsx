"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Users,
  Wrench,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { ChangelogEvent, ChangelogEventType } from "@/types";

interface TimelineViewProps {
  events: ChangelogEvent[];
  onEventClick?: (event: ChangelogEvent) => void;
}

const EVENT_TYPE_CONFIG: Record<
  ChangelogEventType,
  { label: string; icon: typeof Calendar; color: string; bg: string }
> = {
  process_change: {
    label: "Process",
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  team_change: {
    label: "Team",
    icon: Users,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  tool_change: {
    label: "Tool",
    icon: Wrench,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  policy_change: {
    label: "Policy",
    icon: FileText,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface TimelineEventCardProps {
  event: ChangelogEvent;
  onClick?: () => void;
}

function TimelineEventCard({ event, onClick }: TimelineEventCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div
      className="relative ml-6 cursor-pointer"
      onClick={() => {
        setExpanded(!expanded);
        onClick?.();
      }}
    >
      {/* Timeline dot */}
      <div
        className={`absolute -left-[29px] top-1 flex h-5 w-5 items-center justify-center rounded-full ${config.bg} ring-4 ring-slate-900`}
      >
        <Icon className={`h-3 w-3 ${config.color}`} />
      </div>

      {/* Card */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 transition-colors hover:border-slate-700">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}
              >
                {config.label}
              </span>
              <span className="text-xs text-slate-500">{formatDate(event.date)}</span>
            </div>
            <h4 className="mt-1 text-sm font-medium text-white">{event.title}</h4>
          </div>
          <button className="text-slate-500 hover:text-slate-300">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-3 space-y-2 border-t border-slate-800 pt-3">
            {event.description && (
              <p className="text-sm text-slate-400">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500">Affected:</span>
              {event.affected_stations.map((station) => (
                <span
                  key={station}
                  className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
                >
                  {station.replace(/_/g, " ")}
                </span>
              ))}
            </div>
            {event.expected_impact && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Expected impact:</span>
                <span className="text-xs text-emerald-400">{event.expected_impact}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelineView({ events, onEventClick }: TimelineViewProps) {
  // Sort events by date descending
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [events]
  );

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-sm font-medium text-slate-400">No events yet</h3>
        <p className="mt-1 text-xs text-slate-500">
          Changes will appear here as they are logged.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Change Timeline</h3>
        <span className="text-xs text-slate-500">{events.length} event(s)</span>
      </div>

      {/* Timeline */}
      <div className="relative border-l-2 border-slate-800 pl-2">
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <TimelineEventCard
              key={event.id}
              event={event}
              onClick={() => onEventClick?.(event)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
