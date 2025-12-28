"use client";

import Link from "next/link";
import { Plus, Save, FolderOpen, Check, Loader2, FilePlus, Download, Upload } from "lucide-react";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  type NodeTypes,
  type OnSelectionChangeFunc,
  type OnConnect,
  type Node,
  type Edge,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import type { ServiceLine } from "@/types";
import {
  serviceLineToFlow,
  flowToServiceLine,
  type StationNodeData,
  type TrackEdgeData,
} from "@/lib/dag/transforms";
import { StationNode } from "./StationNode";
import { StationPanel } from "./StationPanel";
import { EdgePanel } from "./EdgePanel";
import { Button } from "@/components/ui/button";

const nodeTypes: NodeTypes = {
  stationNode: StationNode,
};

// Generate a unique station ID
function generateStationId(): string {
  return `Station_${Date.now().toString(36)}`;
}

// Create default station data for a new node
function createDefaultStationData(id: string): StationNodeData {
  return {
    station_id: id,
    name: "New Station",
    department: undefined,
    data_source: "mock",
    metrics: {
      fair_pricing: {
        planned_hrs: 0,
        actual_hrs: 0,
        labor_variance: 0,
      },
      world_class: {
        internal_qa_score: 0,
        standard_met: false,
      },
      performance_proof: {},
    },
  };
}

interface ServiceLineEditorInnerProps {
  serviceLine: ServiceLine;
  serviceLines: ServiceLine[];
  onSave: (sl: ServiceLine) => Promise<boolean>;
  onLoad: (id: string) => Promise<void>;
  onCreate: (id: string, name: string) => Promise<boolean>;
  onImport: (sl: ServiceLine) => void;
}

function ServiceLineEditorInner({ serviceLine, serviceLines, onSave, onLoad, onCreate, onImport }: ServiceLineEditorInnerProps) {
  // React Flow instance for viewport operations
  const { getViewport } = useReactFlow();

  // Convert service line to React Flow format
  const initialFlow = useMemo(
    () => serviceLineToFlow(serviceLine),
    [serviceLine]
  );

  // React Flow state hooks
  const [nodes, setNodes, onNodesChange] = useNodesState<StationNodeData>(
    initialFlow.nodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<TrackEdgeData>(
    initialFlow.edges
  );

  // Reset nodes/edges when serviceLine changes (after load)
  useEffect(() => {
    const flow = serviceLineToFlow(serviceLine);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setHasUnsavedChanges(false);
  }, [serviceLine, setNodes, setEdges]);

  // Selected node ID (we track ID, then derive station data from nodes)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  // Selected edge ID
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Open dropdown state
  const [openDropdownOpen, setOpenDropdownOpen] = useState(false);

  // New service line dialog state
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get the currently selected station data from nodes
  const selectedStation = useMemo(() => {
    if (!selectedNodeId) return null;
    const node = nodes.find((n) => n.id === selectedNodeId);
    return node?.data ?? null;
  }, [nodes, selectedNodeId]);

  // Get the currently selected edge
  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) return null;
    return edges.find((e) => e.id === selectedEdgeId) ?? null;
  }, [edges, selectedEdgeId]);

  // Handle selection changes (nodes and edges)
  const onSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes: selectedNodes, edges: selectedEdges }) => {
    if (selectedNodes.length === 1) {
      setSelectedNodeId(selectedNodes[0].id);
      setSelectedEdgeId(null);
    } else if (selectedEdges.length === 1) {
      setSelectedEdgeId(selectedEdges[0].id);
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  }, []);

  // Handle new edge connections
  const onConnect: OnConnect = useCallback((connection) => {
    if (!connection.source || !connection.target) return;
    
    const newEdge: Edge<TrackEdgeData> = {
      id: `${connection.source}->${connection.target}`,
      source: connection.source,
      target: connection.target,
      data: {
        weight: { cost: 1, time: 1 },
      },
    };

    setEdges((eds) => addEdge(newEdge, eds));
    setHasUnsavedChanges(true);
  }, [setEdges]);

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

  // Handle edge updates from the panel
  const handleEdgeUpdate = useCallback((updates: Partial<TrackEdgeData>) => {
    if (!selectedEdgeId) return;

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === selectedEdgeId) {
          return {
            ...edge,
            data: {
              ...edge.data,
              ...updates,
            } as TrackEdgeData,
          };
        }
        return edge;
      })
    );

    setHasUnsavedChanges(true);
  }, [selectedEdgeId, setEdges]);

  // Add new station
  const handleAddStation = useCallback(() => {
    const viewport = getViewport();
    const id = generateStationId();
    
    // Position new node at center of current viewport
    const newNode: Node<StationNodeData> = {
      id,
      type: "stationNode",
      position: {
        x: (-viewport.x + 400) / viewport.zoom,
        y: (-viewport.y + 300) / viewport.zoom,
      },
      data: createDefaultStationData(id),
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setHasUnsavedChanges(true);
  }, [getViewport, setNodes]);

  // Delete selected station
  const handleDeleteStation = useCallback(() => {
    if (!selectedNodeId) return;

    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    
    // Remove edges connected to this node
    setEdges((eds) => eds.filter(
      (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
    ));

    setSelectedNodeId(null);
    setHasUnsavedChanges(true);
  }, [selectedNodeId, setNodes, setEdges]);

  // Delete selected edge
  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdgeId) return;

    setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
    setHasUnsavedChanges(true);
  }, [selectedEdgeId, setEdges]);

  // Close panel handler
  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updatedServiceLine = flowToServiceLine(nodes, edges, {
        service_line_id: serviceLine.service_line_id,
        name: serviceLine.name,
        description: serviceLine.description,
        created_at: serviceLine.created_at,
      });
      const success = await onSave(updatedServiceLine);
      if (success) {
        setHasUnsavedChanges(false);
      }
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, serviceLine, onSave]);

  // Load handler
  const handleLoad = useCallback(async (id: string) => {
    setOpenDropdownOpen(false);
    if (id !== serviceLine.service_line_id) {
      await onLoad(id);
    }
  }, [serviceLine.service_line_id, onLoad]);

  // Create new handler
  const handleCreate = useCallback(async () => {
    if (!newId.trim() || !newName.trim()) return;
    setCreating(true);
    try {
      const success = await onCreate(newId.trim(), newName.trim());
      if (success) {
        setShowNewDialog(false);
        setNewId("");
        setNewName("");
      }
    } finally {
      setCreating(false);
    }
  }, [newId, newName, onCreate]);

  // Export handler
  const handleExport = useCallback(() => {
    const currentServiceLine = flowToServiceLine(nodes, edges, {
      service_line_id: serviceLine.service_line_id,
      name: serviceLine.name,
      description: serviceLine.description,
      created_at: serviceLine.created_at,
    });
    
    const blob = new Blob([JSON.stringify(currentServiceLine, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceLine.service_line_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [nodes, edges, serviceLine]);

  // Import handler
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as ServiceLine;
        // Basic validation
        if (!imported.service_line_id || !imported.nodes || !imported.edges) {
          throw new Error("Invalid service line format");
        }
        onImport(imported);
        setHasUnsavedChanges(true);
      } catch (err) {
        alert("Failed to import: " + (err instanceof Error ? err.message : "Invalid JSON"));
      }
    };
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again
    event.target.value = "";
  }, [onImport]);

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
          <div className="flex items-center gap-2">
            {/* New button */}
            <Button
              onClick={() => setShowNewDialog(true)}
              variant="ghost"
              size="sm"
              className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
            >
              <FilePlus className="h-4 w-4 mr-1" />
              New
            </Button>

            {/* Open dropdown */}
            <div className="relative">
              <Button
                onClick={() => setOpenDropdownOpen(!openDropdownOpen)}
                variant="ghost"
                size="sm"
                className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                Open
              </Button>
              {openDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setOpenDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 w-64 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
                    {serviceLines.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-slate-500">No service lines found</div>
                    ) : (
                      serviceLines.map((sl) => (
                        <button
                          key={sl.service_line_id}
                          onClick={() => handleLoad(sl.service_line_id)}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-800 flex items-center justify-between ${
                            sl.service_line_id === serviceLine.service_line_id
                              ? "text-emerald-400"
                              : "text-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{sl.name}</div>
                            <div className="text-xs text-slate-500">{sl.service_line_id}</div>
                          </div>
                          {sl.service_line_id === serviceLine.service_line_id && (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Import button */}
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
            >
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {/* Export button */}
            <Button
              onClick={handleExport}
              variant="ghost"
              size="sm"
              className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>

            <div className="w-px h-6 bg-slate-700/50" />

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              variant="ghost"
              size="sm"
              className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-slate-700/50 disabled:hover:text-slate-400 transition-all"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>

            {/* Add Station button */}
            <Button
              onClick={handleAddStation}
              variant="ghost"
              size="sm"
              className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Station
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-500 ml-2">
              <span>{nodes.length} stations</span>
              <span>•</span>
              <span>{edges.length} tracks</span>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-slate-950"
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={["Backspace", "Delete"]}
          defaultEdgeOptions={{
            style: { stroke: "#475569", strokeWidth: 2 },
            animated: false,
          }}
          edgesUpdatable
          edgesFocusable
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
          onDelete={handleDeleteStation}
        />
      )}

      {/* Edge Panel (shown when an edge is selected) */}
      {selectedEdge && (
        <EdgePanel
          edgeId={selectedEdge.id}
          source={selectedEdge.source}
          target={selectedEdge.target}
          data={selectedEdge.data}
          onClose={handleClosePanel}
          onUpdate={handleEdgeUpdate}
          onDelete={handleDeleteEdge}
        />
      )}

      {/* New Service Line Dialog */}
      {showNewDialog && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/50" 
            onClick={() => setShowNewDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Service Line</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Service Line ID</label>
                <input
                  type="text"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ""))}
                  placeholder="e.g., SL-NEW-PROJECT"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Uppercase letters, numbers, hyphens, underscores only</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., New Project Workflow"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setShowNewDialog(false)}
                variant="ghost"
                className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newId.trim() || !newName.trim() || creating}
                variant="ghost"
                className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-emerald-600 hover:text-white hover:border-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <FilePlus className="h-4 w-4 mr-1" />
                )}
                Create
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface ServiceLineEditorProps {
  serviceLine: ServiceLine;
  serviceLines: ServiceLine[];
  onSave: (sl: ServiceLine) => Promise<boolean>;
  onLoad: (id: string) => Promise<void>;
  onCreate: (id: string, name: string) => Promise<boolean>;
  onImport: (sl: ServiceLine) => void;
}

export function ServiceLineEditor({ serviceLine, serviceLines, onSave, onLoad, onCreate, onImport }: ServiceLineEditorProps) {
  return (
    <ReactFlowProvider>
      <ServiceLineEditorInner 
        serviceLine={serviceLine} 
        serviceLines={serviceLines}
        onSave={onSave}
        onLoad={onLoad}
        onCreate={onCreate}
        onImport={onImport}
      />
    </ReactFlowProvider>
  );
}
