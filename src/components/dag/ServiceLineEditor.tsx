"use client";

import Link from "next/link";
import { Plus, Save, FolderOpen, Check, Loader2, FilePlus, Download, Upload, Copy, ChevronDown, LayoutDashboard, Database, Menu } from "lucide-react";
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

import type { ServiceLine, RAGStatus, Station } from "@/types";
import {
  serviceLineToFlow,
  flowToServiceLine,
  type StationNodeData,
  type TrackEdgeData,
} from "@/lib/dag/transforms";
import { computeStationRag, worstRag } from "@/lib/rag/compute";
import { StationNode } from "./StationNode";
import { StationPanel } from "./StationPanel";
import { EdgePanel } from "./EdgePanel";
import { PathfinderPanel } from "./PathfinderPanel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { computeServiceLineRollup } from "@/lib/rag/rollup";
import { getRagDisplay } from "@/lib/rag/compute";
import {
  applyScenarioToMetrics,
  applyScenarioToServiceLine,
  defaultScenarioConfig,
  type ScenarioConfig,
  type ScenarioDeltas,
} from "@/lib/scenario/apply";

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
    description: undefined,
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
    setDescription(serviceLine.description ?? "");
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

  const [scenario, setScenario] = useState<ScenarioConfig>(defaultScenarioConfig);
  const [scenarioNames, setScenarioNames] = useState<string[]>([]);
  const [scenarioModalOpen, setScenarioModalOpen] = useState(false);
  const [scenarioModalMode, setScenarioModalMode] = useState<"save" | "load">("load");
  const [scenarioNameInput, setScenarioNameInput] = useState("");
  const [activeScenarioName, setActiveScenarioName] = useState("default");
  const [scenarioDirty, setScenarioDirty] = useState(false);
  const [stationOptions, setStationOptions] = useState<Station[]>([]);
  const [stationOptionsLoading, setStationOptionsLoading] = useState(false);
  const [addStationModalOpen, setAddStationModalOpen] = useState(false);
  const [addStationMode, setAddStationMode] = useState<"existing" | "new">("existing");
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [showPathfinder, setShowPathfinder] = useState(false);
  const [highlightedEdges, setHighlightedEdges] = useState<string[] | null>(null);
  const [description, setDescription] = useState(serviceLine.description ?? "");
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateId, setDuplicateId] = useState("");
  const [duplicateName, setDuplicateName] = useState("");

  // Load scenario from local server storage
  const loadScenarioFromServer = useCallback(async (id: string, name?: string) => {
    try {
      const url = name
        ? `/api/scenarios/${encodeURIComponent(id)}?name=${encodeURIComponent(name)}`
        : `/api/scenarios/${encodeURIComponent(id)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setScenario(defaultScenarioConfig);
        setActiveScenarioName("default");
        return;
      }
      const json = await res.json();
      if (json.success && json.data) {
        if (Array.isArray(json.data.names)) {
          setScenarioNames(json.data.names);
        }
        const sc = json.data.scenario ?? json.data;
        if (sc.global) {
          setScenario({
            global: {
              laborDelta: sc.global.laborDelta ?? 0,
              timeDelta: sc.global.timeDelta ?? 0,
              qualityDelta: sc.global.qualityDelta ?? 0,
            },
            byStation: Object.fromEntries(
              Object.entries(sc.byStation ?? {}).map(([k, v]) => {
                const delta = v as Partial<ScenarioDeltas>;
                return [
                  k,
                  {
                    laborDelta: delta.laborDelta ?? 0,
                    timeDelta: delta.timeDelta ?? 0,
                    qualityDelta: delta.qualityDelta ?? 0,
                  },
                ];
              })
            ),
          });
        } else {
          setScenario({
            global: {
              laborDelta: sc.laborDelta ?? 0,
              timeDelta: sc.timeDelta ?? 0,
              qualityDelta: sc.qualityDelta ?? 0,
            },
            byStation: {},
          });
        }
        setActiveScenarioName(name ?? "default");
        setScenarioDirty(false);
        return;
      }
    } catch {
      setScenario(defaultScenarioConfig);
      setActiveScenarioName("default");
      setScenarioDirty(false);
    }
  }, []);

  // Reload scenario whenever the service line changes
  useEffect(() => {
    loadScenarioFromServer(serviceLine.service_line_id);
  }, [serviceLine.service_line_id, loadScenarioFromServer]);

  // Auto-save scenario to active name when dirty (behaves like autosave)
  useEffect(() => {
    if (!scenarioDirty) return;
    const controller = new AbortController();
    const saveScenario = async () => {
      const name = activeScenarioName || "default";
      try {
        await fetch(
          `/api/scenarios/${encodeURIComponent(serviceLine.service_line_id)}?name=${encodeURIComponent(name)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scenario),
            signal: controller.signal,
          }
        );
        setScenarioDirty(false);
      } catch {
        // ignore; will retry on next change
      }
    };
    void saveScenario();
    return () => controller.abort();
  }, [scenarioDirty, scenario, activeScenarioName, serviceLine.service_line_id]);

  // Load station catalog for "Add Station" modal
  useEffect(() => {
    const loadStations = async () => {
      setStationOptionsLoading(true);
      try {
        const res = await fetch("/api/stations");
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setStationOptions(json.data as Station[]);
        }
      } finally {
        setStationOptionsLoading(false);
      }
    };
    loadStations();
  }, []);

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
  const persistStationToCatalog = useCallback((data: StationNodeData) => {
    const payload: Station = {
      station_id: data.station_id,
      name: data.name,
      description: data.description,
      department: data.department,
      data_source: data.data_source,
      metrics: data.metrics,
      rag_status: computeStationRag(data.metrics, data.rag_status),
    };

    return fetch(`/api/stations/${encodeURIComponent(payload.station_id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* ignore network errors */
    });
  }, []);

  const handleStationUpdate = useCallback(
    (updates: Partial<StationNodeData>) => {
      if (!selectedNodeId) return;

      let updatedStation: StationNodeData | null = null;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNodeId) {
            const nextData = { ...node.data, ...updates };
            updatedStation = nextData;
            return {
              ...node,
              data: nextData,
            };
          }
          return node;
        })
      );

      if (updatedStation) {
        persistStationToCatalog(updatedStation);
      }

      setHasUnsavedChanges(true);
    },
    [persistStationToCatalog, selectedNodeId, setNodes]
  );

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

  const centerPosition = useCallback(() => {
    const viewport = getViewport();
    return {
      x: (-viewport.x + 400) / viewport.zoom,
      y: (-viewport.y + 300) / viewport.zoom,
    };
  }, [getViewport]);

  // Add station modal helpers
  const addExistingStation = useCallback(
    (stationId: string) => {
      if (!stationId) return;
      if (nodes.some((n) => n.id === stationId)) {
        alert("This station is already in the service line.");
        return;
      }
      const st = stationOptions.find((s) => s.station_id === stationId);
      if (!st) return;
      const newNode: Node<StationNodeData> = {
        id: st.station_id,
        type: "stationNode",
        position: centerPosition(),
        data: {
          station_id: st.station_id,
          name: st.name,
          department: st.department,
          data_source: st.data_source,
          metrics: st.metrics,
          rag_status: st.rag_status,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(st.station_id);
      setSelectedEdgeId(null);
      setHasUnsavedChanges(true);
      setAddStationModalOpen(false);
    },
    [centerPosition, nodes, setNodes, stationOptions]
  );

  const addNewStation = useCallback(() => {
    const id = generateStationId();
    const defaultData = createDefaultStationData(id);
    const newNode: Node<StationNodeData> = {
      id,
      type: "stationNode",
      position: centerPosition(),
      data: defaultData,
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setHasUnsavedChanges(true);
    persistStationToCatalog(defaultData);
    setAddStationModalOpen(false);
  }, [centerPosition, persistStationToCatalog, setNodes]);

  const handleAddStation = useCallback(() => {
    setAddStationMode("existing");
    setSelectedStationId("");
    setAddStationModalOpen(true);
  }, []);

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
        description: description,
        created_at: serviceLine.created_at,
      });
      // Persist scenario (default to activeScenarioName) if dirty
      if (scenarioDirty) {
        const name = activeScenarioName || "default";
        await fetch(
          `/api/scenarios/${encodeURIComponent(serviceLine.service_line_id)}?name=${encodeURIComponent(name)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scenario),
          }
        );
        setScenarioDirty(false);
      }

      const success = await onSave(updatedServiceLine);
      if (success) {
        setHasUnsavedChanges(false);
      }
    } finally {
      setSaving(false);
    }
  }, [nodes, edges, serviceLine, onSave, scenario, scenarioDirty, activeScenarioName, description]);

  // Load handler
  const handleLoad = useCallback(async (id: string) => {
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
      description: description,
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
  }, [nodes, edges, serviceLine, description]);

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

  // Derived nodes with scenario applied (used for rendering only)
  const nodesForView = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        metrics: applyScenarioToMetrics(node.data.metrics, scenario, node.data.station_id),
      },
    }));
  }, [nodes, scenario]);

  // Export handler for scenario-applied view (non-persistent)
  const handleExportScenario = useCallback(() => {
    const baseServiceLine = flowToServiceLine(nodes, edges, {
      service_line_id: serviceLine.service_line_id,
      name: serviceLine.name,
      description: description,
      created_at: serviceLine.created_at,
    });
    const scenarioServiceLine = applyScenarioToServiceLine(baseServiceLine, scenario);
    const exportLine: ServiceLine = {
      ...scenarioServiceLine,
      service_line_id: `${serviceLine.service_line_id}-scenario`,
      name: `${serviceLine.name} (scenario)`,
    };

    const blob = new Blob([JSON.stringify(exportLine, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${serviceLine.service_line_id}-scenario.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [edges, nodes, scenario, serviceLine, description]);

  // Duplicate handler - creates a copy with new ID and name
  const handleDuplicate = useCallback(async () => {
    if (!duplicateId.trim() || !duplicateName.trim()) return;

    // Create a new service line with current nodes/edges but new ID/name
    const duplicatedServiceLine = flowToServiceLine(nodes, edges, {
      service_line_id: duplicateId.trim(),
      name: duplicateName.trim(),
      description: description,
      created_at: new Date().toISOString(),
    });

    // Import the duplicated service line (this will trigger a save)
    onImport(duplicatedServiceLine);
    setShowDuplicateDialog(false);
    setDuplicateId("");
    setDuplicateName("");
  }, [duplicateId, duplicateName, nodes, edges, description, onImport]);

  // Map of node id -> computed RAG (view)
  const nodeRagMap = useMemo(() => {
    const map = new Map<string, RAGStatus>();
    nodesForView.forEach((node) => {
      map.set(node.id, computeStationRag(node.data.metrics, node.data.rag_status));
    });
    return map;
  }, [nodesForView]);

  const ragColor = (status: RAGStatus) => {
    switch (status) {
      case "red":
        return "#ef4444";
      case "amber":
        return "#f59e0b";
      case "green":
      default:
        return "#10b981";
    }
  };

  // Apply RAG styling, weight labels, and path highlighting to edges
  const coloredEdges = useMemo(() => {
    const highlightSet = highlightedEdges ? new Set(highlightedEdges) : null;
    return edges.map((edge) => {
      const sourceRag = nodeRagMap.get(edge.source) ?? "green";
      const targetRag = nodeRagMap.get(edge.target) ?? "green";
      const edgeRag = worstRag(sourceRag, targetRag);
      const weight = (edge.data?.weight?.cost ?? 1) + (edge.data?.weight?.time ?? 1);
      const isHighlighted = highlightSet?.has(edge.id);
      return {
        ...edge,
        data: { ...edge.data, rag_status: edgeRag },
        label: String(weight),
        labelStyle: {
          fill: isHighlighted ? "#22d3ee" : "#94a3b8",
          fontSize: 12,
          fontWeight: isHighlighted ? 700 : 600
        },
        labelBgStyle: {
          fill: isHighlighted ? "#0e7490" : "#1e293b",
          fillOpacity: 0.9
        },
        labelBgPadding: [4, 6] as [number, number],
        labelBgBorderRadius: 4,
        animated: isHighlighted,
        style: {
          ...(edge.style ?? {}),
          stroke: isHighlighted ? "#22d3ee" : ragColor(edgeRag),
          strokeWidth: isHighlighted ? 4 : 2.5,
        },
      };
    });
  }, [edges, nodeRagMap, highlightedEdges]);

  // Service line rollup (totals, averages, overall rag)
  const rollup = useMemo(
    () =>
      computeServiceLineRollup({
        ...serviceLine,
        nodes: nodesForView.map((n) => ({
          station_id: n.data.station_id,
          name: n.data.name,
          department: n.data.department,
          data_source: n.data.data_source,
          metrics: n.data.metrics,
          rag_status: n.data.rag_status,
          position: n.position,
          missing: n.data.missing,
        })),
        edges: [], // rollup currently only needs nodes
      }),
    [serviceLine, nodesForView]
  );

  const hasMissingStations = useMemo(() => nodes.some((n) => n.data.missing), [nodes]);

  return (
    <div className="flex h-full w-full">
      {/* Main canvas area */}
      <div className="relative flex-1">
        {/* Header bar with service line info - 2 row layout */}
        <div className="absolute left-0 right-0 top-0 z-10 border-b border-slate-800 bg-slate-950/90 px-4 py-2 backdrop-blur-sm">
          {/* Row 1: Service line info */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors shrink-0"
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
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500 shrink-0">
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
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold text-white">
                  {serviceLine.name}
                </h1>
                <span className="text-xs text-slate-500">({serviceLine.service_line_id})</span>
                {activeScenarioName && activeScenarioName !== "default" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {activeScenarioName}
                  </span>
                )}
                {hasMissingStations && (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-300">
                    Missing station
                  </span>
                )}
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Add a description..."
                  className="flex-1 max-w-lg bg-transparent text-xs text-slate-300 placeholder:text-slate-500 border-b border-transparent hover:border-slate-600 focus:border-cyan-500 focus:outline-none transition-colors"
                />
                <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                  <span>
                    {Math.round(rollup.total_planned_hrs * 10) / 10}h / {Math.round(rollup.total_actual_hrs * 10) / 10}h
                    <span className={`ml-1 ${rollup.variance_pct > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                      ({rollup.variance_pct > 0 ? "+" : ""}{Math.round(rollup.variance_pct * 10) / 10}%)
                    </span>
                  </span>
                  <span>QA: {rollup.avg_qa_score.toFixed(1)}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${getRagDisplay(rollup.overall_rag).bg} ${getRagDisplay(rollup.overall_rag).color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${getRagDisplay(rollup.overall_rag).bgSolid}`} />
                    {getRagDisplay(rollup.overall_rag).label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Action buttons */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/50">
            {/* File Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
                >
                  <Menu className="h-4 w-4 mr-1" />
                  File
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700">
                <DropdownMenuItem
                  onClick={() => setShowNewDialog(true)}
                  className="text-slate-300 focus:bg-slate-800 focus:text-white"
                >
                  <FilePlus className="h-4 w-4 mr-2" />
                  New Service Line
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDuplicateId(`${serviceLine.service_line_id}-copy`);
                    setDuplicateName(`${serviceLine.name} (Copy)`);
                    setShowDuplicateDialog(true);
                  }}
                  className="text-slate-300 focus:bg-slate-800 focus:text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-slate-300 focus:bg-slate-800 focus:text-white">
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="bg-slate-900 border-slate-700 max-h-64 overflow-y-auto">
                    {serviceLines.length === 0 ? (
                      <DropdownMenuItem disabled className="text-slate-500">
                        No service lines found
                      </DropdownMenuItem>
                    ) : (
                      serviceLines.map((sl) => (
                        <DropdownMenuItem
                          key={sl.service_line_id}
                          onClick={() => handleLoad(sl.service_line_id)}
                          className={`${
                            sl.service_line_id === serviceLine.service_line_id
                              ? "text-emerald-400"
                              : "text-slate-300"
                          } focus:bg-slate-800 focus:text-white`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div>
                              <div className="font-medium">{sl.name}</div>
                              <div className="text-xs text-slate-500">{sl.service_line_id}</div>
                            </div>
                            {sl.service_line_id === serviceLine.service_line_id && (
                              <Check className="h-4 w-4 ml-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => fileInputRef.current?.click()}
                  className="text-slate-300 focus:bg-slate-800 focus:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExport}
                  className="text-slate-300 focus:bg-slate-800 focus:text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportScenario}
                  className="text-emerald-300 focus:bg-slate-800 focus:text-emerald-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Scenario
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />

            {/* View Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4 mr-1" />
                  View
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-slate-300 focus:bg-slate-800 focus:text-white">
                  <Link href="/admin/stations">
                    <Database className="h-4 w-4 mr-2" />
                    Stations Catalog
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
              Add
            </Button>

            {/* Pathfinder button */}
            <Button
              onClick={() => {
                setShowPathfinder(!showPathfinder);
                if (showPathfinder) setHighlightedEdges(null);
              }}
              variant="ghost"
              size="sm"
              className={`border transition-all ${
                showPathfinder
                  ? "border-cyan-500 text-cyan-300 bg-cyan-900/30 hover:bg-cyan-900/50"
                  : "border-slate-700/50 text-slate-400 bg-transparent hover:bg-cyan-600 hover:text-white hover:border-cyan-600"
              }`}
            >
              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Path
            </Button>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{nodes.length} stations</span>
              <span>•</span>
              <span>{edges.length} tracks</span>
            </div>

            {/* Scenario sliders - right aligned */}
            <div className="flex items-center gap-2 ml-auto">
              {[
                { key: "laborDelta", label: "Labor", min: -20, max: 20, unit: "h" },
                { key: "timeDelta", label: "Time", min: -20, max: 20, unit: "h" },
                { key: "qualityDelta", label: "QA", min: -5, max: 5, unit: "pt" },
              ].map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 bg-slate-900/50 border border-slate-800 rounded px-2 py-1">
                  <span className="text-[10px] text-slate-400 w-8">{s.label}</span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={1}
                    value={scenario.global[s.key as keyof typeof scenario.global] as number}
                    onChange={(e) =>
                      setScenario((prev) => ({
                        ...prev,
                        global: {
                          ...prev.global,
                          [s.key]: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    onMouseUp={() => {
                      setScenarioDirty(true);
                      setHasUnsavedChanges(true);
                    }}
                    onTouchEnd={() => {
                      setScenarioDirty(true);
                      setHasUnsavedChanges(true);
                    }}
                    className="w-16 accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-300 font-mono w-10 text-right">
                    {scenario.global[s.key as keyof typeof scenario.global] >= 0 ? "+" : ""}
                    {scenario.global[s.key as keyof typeof scenario.global]}{s.unit}
                  </span>
                </div>
              ))}

              {/* Scenario dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem
                    onClick={() => {
                      setScenarioModalMode("save");
                      setScenarioNameInput("");
                      setScenarioModalOpen(true);
                    }}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white text-xs"
                  >
                    <Save className="h-3 w-3 mr-2" />
                    Save Scenario
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setScenarioModalMode("load");
                      setScenarioNameInput(scenarioNames[0] ?? "");
                      setScenarioModalOpen(true);
                    }}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white text-xs"
                  >
                    <FolderOpen className="h-3 w-3 mr-2" />
                    Load Scenario
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={() => {
                      setScenario(defaultScenarioConfig);
                      setScenarioDirty(true);
                      fetch(`/api/scenarios/${encodeURIComponent(serviceLine.service_line_id)}`, {
                        method: "DELETE",
                      });
                    }}
                    className="text-slate-300 focus:bg-slate-800 focus:text-white text-xs"
                  >
                    <svg className="h-3 w-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset to Zero
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodesForView}
          edges={coloredEdges}
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

      {scenarioModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-white">
                {scenarioModalMode === "save" ? "Save Scenario" : "Load Scenario"}
              </div>
              <button
                onClick={() => setScenarioModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-200">
              {scenarioModalMode === "load" && scenarioNames.length === 0 && (
                <p className="text-slate-400">No saved scenarios yet.</p>
              )}
              <label className="flex flex-col gap-1">
                <span className="text-slate-400">Scenario name</span>
                {scenarioModalMode === "load" ? (
                  <select
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  >
                    {scenarioNames.length === 0 && <option value="">(none)</option>}
                    {scenarioNames.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                    placeholder="e.g. peak-load, qa-boost"
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  />
                )}
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="border border-slate-700/60 text-slate-200 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-500/80 transition-all"
                onClick={() => setScenarioModalOpen(false)}
              >
                Cancel
              </Button>
              {scenarioModalMode === "save" ? (
                <Button
                  size="sm"
                  className="border border-emerald-700/60 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                  disabled={!scenarioNameInput.trim()}
                  onClick={async () => {
                    const name = scenarioNameInput.trim();
                    if (!name) return;
                    await fetch(
                      `/api/scenarios/${encodeURIComponent(serviceLine.service_line_id)}?name=${encodeURIComponent(
                        name
                      )}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(scenario),
                      }
                    );
                    await loadScenarioFromServer(serviceLine.service_line_id, name);
                    setScenarioDirty(false);
                    setScenarioModalOpen(false);
                  }}
                >
                  Save
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="border border-emerald-700/60 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                  disabled={!scenarioNameInput.trim()}
                  onClick={async () => {
                    const name = scenarioNameInput.trim();
                    if (!name) return;
                    const res = await fetch(
                      `/api/scenarios/${encodeURIComponent(serviceLine.service_line_id)}?name=${encodeURIComponent(
                        name
                      )}`
                    );
                    if (res.ok) {
                      const json = await res.json();
                      if (json.success && json.data?.scenario) {
                        const sc = json.data.scenario;
                        if (sc.global) {
                          setScenario({
                            global: {
                              laborDelta: sc.global.laborDelta ?? 0,
                              timeDelta: sc.global.timeDelta ?? 0,
                              qualityDelta: sc.global.qualityDelta ?? 0,
                            },
                            byStation: Object.fromEntries(
                              Object.entries(sc.byStation ?? {}).map(([k, v]) => {
                                const delta = v as Partial<ScenarioDeltas>;
                                return [
                                  k,
                                  {
                                    laborDelta: delta.laborDelta ?? 0,
                                    timeDelta: delta.timeDelta ?? 0,
                                    qualityDelta: delta.qualityDelta ?? 0,
                                  },
                                ];
                              })
                            ),
                          });
                        } else {
                          setScenario({
                            global: {
                              laborDelta: sc.laborDelta ?? 0,
                              timeDelta: sc.timeDelta ?? 0,
                              qualityDelta: sc.qualityDelta ?? 0,
                            },
                            byStation: {},
                          });
                        }
                      }
                    }
                    await loadScenarioFromServer(serviceLine.service_line_id, name);
                    setScenarioDirty(false);
                    setScenarioModalOpen(false);
                  }}
                >
                  Load
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      {addStationModalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-white">Add Station</div>
              <button
                onClick={() => setAddStationModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-sm text-slate-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setAddStationMode("existing")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    addStationMode === "existing" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Use Existing
                </button>
                <button
                  onClick={() => setAddStationMode("new")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    addStationMode === "new" ? "bg-emerald-700 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  Create New
                </button>
              </div>

              {addStationMode === "existing" ? (
                <div className="space-y-2">
                  <label className="text-slate-400">Select station</label>
                  <select
                    value={selectedStationId}
                    onChange={(e) => setSelectedStationId(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                    disabled={stationOptionsLoading}
                  >
                    <option value="">-- choose station --</option>
                    {stationOptions
                      .filter((s) => !nodes.some((n) => n.id === s.station_id))
                      .map((s) => {
                        const dept = s.department ? s.department : "No dept";
                        return (
                          <option key={s.station_id} value={s.station_id}>
                            {s.name} ({dept})
                          </option>
                        );
                      })}
                  </select>
                  {stationOptionsLoading && <p className="text-xs text-slate-500">Loading stations...</p>}
                  {!stationOptionsLoading && stationOptions.length === 0 && (
                    <p className="text-xs text-slate-500">No stations in catalog yet.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-slate-400 text-sm">
                    A new station will be created with default metrics and saved to the catalog.
                  </p>
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="border border-slate-700/60 text-slate-200 bg-transparent hover:bg-slate-800 hover:text-white hover:border-slate-500/80 transition-all"
                onClick={() => setAddStationModalOpen(false)}
              >
                Cancel
              </Button>
              {addStationMode === "existing" ? (
                <Button
                  size="sm"
                  className="border border-emerald-700/60 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                  disabled={!selectedStationId}
                  onClick={() => addExistingStation(selectedStationId)}
                >
                  Add
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="border border-emerald-700/60 bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800 hover:text-white"
                  onClick={addNewStation}
                >
                  Create
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Station Panel (shown when a station is selected) */}
      {selectedStation && (
        <StationPanel
          station={selectedStation}
          onClose={handleClosePanel}
          onUpdate={handleStationUpdate}
          onDelete={handleDeleteStation}
          scenarioOverride={scenario.byStation?.[selectedStation.station_id]}
          onScenarioOverrideChange={(deltas) => {
            setScenario((prev) => ({
              ...prev,
              byStation: {
                ...(prev.byStation ?? {}),
                [selectedStation.station_id]: deltas,
              },
            }));
            setScenarioDirty(true);
            setHasUnsavedChanges(true);
          }}
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

      {/* Pathfinder Panel */}
      {showPathfinder && (
        <div className="fixed right-0 top-0 h-screen w-80 z-30">
          <PathfinderPanel
            stations={nodes.map((n) => ({ id: n.id, name: n.data.name }))}
            edges={edges}
            onSelectPath={(edgeIds) => setHighlightedEdges(edgeIds)}
            onClose={() => {
              setShowPathfinder(false);
              setHighlightedEdges(null);
            }}
          />
        </div>
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

      {/* Duplicate Service Line Dialog */}
      {showDuplicateDialog && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setShowDuplicateDialog(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-96 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-700 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Duplicate Service Line</h2>
            <p className="text-sm text-slate-400 mb-4">
              Create a copy of &quot;{serviceLine.name}&quot; with a new ID and name.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">New Service Line ID</label>
                <input
                  type="text"
                  value={duplicateId}
                  onChange={(e) => setDuplicateId(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ""))}
                  placeholder="e.g., SL-NEW-PROJECT"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">Uppercase letters, numbers, hyphens, underscores only</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">New Name</label>
                <input
                  type="text"
                  value={duplicateName}
                  onChange={(e) => setDuplicateName(e.target.value)}
                  placeholder="e.g., New Project Workflow"
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => setShowDuplicateDialog(false)}
                variant="ghost"
                className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-slate-700 hover:text-white hover:border-slate-600 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDuplicate}
                disabled={!duplicateId.trim() || !duplicateName.trim()}
                variant="ghost"
                className="border border-slate-700/50 text-slate-400 bg-transparent hover:bg-cyan-600 hover:text-white hover:border-cyan-600 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
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
