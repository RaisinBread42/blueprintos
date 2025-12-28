"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type OnSelectionChangeFunc,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import type { ServiceLine } from "@/types";
import {
  serviceLineToFlow,
  type StationNodeData,
  type TrackEdgeData,
} from "@/lib/dag/transforms";
import { StationNode } from "./StationNode";
import { StationPanel } from "./StationPanel";

const nodeTypes: NodeTypes = {
  stationNode: StationNode,
};

interface ServiceLineEditorProps {
  serviceLine: ServiceLine;
}

export function ServiceLineEditor({ serviceLine }: ServiceLineEditorProps) {
  // Convert service line to React Flow format
  const initialFlow = useMemo(
    () => serviceLineToFlow(serviceLine),
    [serviceLine]
  );

  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<StationNodeData>(
    initialFlow.nodes
  );
  const [edges, , onEdgesChange] = useEdgesState<TrackEdgeData>(
    initialFlow.edges
  );

  // Selected node ID (we track ID, then derive station data from nodes)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Get the currently selected station data from nodes
  const selectedStation = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    return node?.data ?? null;
  }, [nodes, selectedNodeId]);

  // Handle selection changes
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Handle station updates from the panel
  const handleStationUpdate = useCallback((updates: Partial<StationNodeData>) => {
    if (!selectedNodeId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates,
            },
          };
        }
        return node;
      })
    );

    setHasUnsavedChanges(true);
  }, [selectedNodeId, setNodes]);

  // Close panel handler
  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Main canvas area */}
      <div className="relative flex-1">
        {/* Header bar with service line info */}
        <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
              title="Back to Home"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">
                  {serviceLine.name}
                </h1>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                    Unsaved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{serviceLine.service_line_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{nodes.length} stations</span>
            <span>•</span>
            <span>{edges.length} tracks</span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-slate-950"
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            style: { stroke: "#475569", strokeWidth: 2 },
            animated: false,
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
          />
          <Controls
            className="!bg-slate-800 !border-slate-700 !rounded-lg !shadow-lg [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-700"
          />
          <MiniMap
            className="!bg-slate-900 !border-slate-700 !rounded-lg"
            nodeColor="#10b981"
            maskColor="rgba(0, 0, 0, 0.7)"
          />
        </ReactFlow>
      </div>

      {/* Station Panel (shown when a station is selected) */}
      {selectedStation && (
        <StationPanel
          station={selectedStation}
          onClose={handleClosePanel}
          onUpdate={handleStationUpdate}
        />
      )}
    </div>
  );
}
