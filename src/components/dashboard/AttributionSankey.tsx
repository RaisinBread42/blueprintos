"use client";

import { useMemo } from "react";
import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import type { AttributionEdge } from "@/types";
import {
  toSankeyData,
  getColorForTouchpoint,
  ENTITY_COLORS,
  type SankeyNode,
  type SankeyData,
} from "@/lib/attribution/sankey";

interface AttributionSankeyPropsWithEdges {
  edges: AttributionEdge[];
  sankeyData?: never;
  height?: number;
}

interface AttributionSankeyPropsWithData {
  edges?: never;
  sankeyData: SankeyData;
  height?: number;
}

type AttributionSankeyProps = AttributionSankeyPropsWithEdges | AttributionSankeyPropsWithData;

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  payload: SankeyNode;
}

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  payload: {
    source: SankeyNode;
    target: SankeyNode;
    value: number;
    clickThroughRate: number;
  };
}

function getColorForNode(node: SankeyNode): string {
  // If it's an entity name, use entity color
  if (ENTITY_COLORS[node.name]) {
    return ENTITY_COLORS[node.name];
  }
  // Otherwise derive from touchpoint
  return getColorForTouchpoint(node.name);
}

function CustomNode({ x, y, width, height, payload }: CustomNodeProps) {
  const color = getColorForNode(payload);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        rx={2}
        ry={2}
      />
      <text
        x={x + width + 6}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="central"
        fill="#e2e8f0"
        fontSize={11}
        fontFamily="system-ui, sans-serif"
      >
        {payload.name.replace(/-/g, " ")}
      </text>
    </g>
  );
}

function CustomLink({
  sourceX,
  targetX,
  sourceY,
  targetY,
  sourceControlX,
  targetControlX,
  linkWidth,
  payload,
}: CustomLinkProps) {
  const sourceColor = getColorForNode(payload.source);
  const targetColor = getColorForNode(payload.target);

  // Opacity based on click-through rate (higher = more opaque)
  const opacity = 0.4 + payload.clickThroughRate * 0.4;

  // Create unique gradient ID (sanitize names for valid SVG ID)
  const gradientId = `lg-${payload.source.name.replace(/[^a-zA-Z0-9]/g, "")}-${payload.target.name.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Calculate midpoint for percentage label (above the bezier curve)
  const t = 0.5;
  const midX = (1-t)*(1-t)*(1-t)*sourceX + 3*(1-t)*(1-t)*t*sourceControlX + 3*(1-t)*t*t*targetControlX + t*t*t*targetX;
  const curveY = (1-t)*(1-t)*(1-t)*sourceY + 3*(1-t)*(1-t)*t*sourceY + 3*(1-t)*t*t*targetY + t*t*t*targetY;
  // Position label above the link path
  const midY = curveY - linkWidth / 2 - 14;

  const percentText = `${(payload.clickThroughRate * 100).toFixed(0)}%`;
  const usersText = payload.value >= 1000
    ? `${(payload.value / 1000).toFixed(1)}k`
    : `${payload.value}`;

  // Show label if link is visible enough
  const showLabel = linkWidth > 6;

  return (
    <g>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={opacity} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={opacity} />
        </linearGradient>
      </defs>
      {/* Main gradient path */}
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={Math.max(linkWidth, 3)}
        strokeOpacity={opacity}
      />
      {/* Additional visible stroke for all links */}
      <path
        d={`M${sourceX},${sourceY} C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
        fill="none"
        stroke={sourceColor}
        strokeWidth={Math.max(linkWidth * 0.5, 1.5)}
        strokeOpacity={0.3}
      />
      {showLabel && (
        <>
          {/* Background pill for readability */}
          <rect
            x={midX - 28}
            y={midY - 9}
            width={56}
            height={18}
            rx={9}
            fill="#1e293b"
            fillOpacity={0.95}
            stroke="#334155"
            strokeWidth={0.5}
          />
          <text
            x={midX}
            y={midY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            <tspan fill="#94a3b8">{usersText}</tspan>
            <tspan fill="#64748b"> · </tspan>
            <tspan fill="#10b981" fontWeight="600">{percentText}</tspan>
          </text>
        </>
      )}
    </g>
  );
}

interface TooltipPayload {
  payload?: {
    source?: SankeyNode;
    target?: SankeyNode;
    value?: number;
    clickThroughRate?: number;
    name?: string;
    entity?: string;
  };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0].payload;
  if (!data) return null;

  // Link tooltip
  if (data.source && data.target) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-lg">
        <p className="text-xs text-slate-400 mb-1">
          {data.source.name} → {data.target.name}
        </p>
        <p className="text-sm text-white font-medium">
          {data.value?.toLocaleString()} users
        </p>
        <p className="text-xs text-emerald-400">
          {((data.clickThroughRate ?? 0) * 100).toFixed(1)}% click-through
        </p>
      </div>
    );
  }

  // Node tooltip
  if (data.name) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-lg">
        <p className="text-sm text-white font-medium">{data.name}</p>
        {data.entity && <p className="text-xs text-slate-400">{data.entity}</p>}
      </div>
    );
  }

  return null;
}

export function AttributionSankey(props: AttributionSankeyProps) {
  const { height = 400 } = props;

  // Extract values to use as stable dependencies
  const propsEdges = "edges" in props ? props.edges : undefined;
  const propsSankeyData = "sankeyData" in props ? props.sankeyData : undefined;

  // Compute sankey data either from edges or use provided data
  const sankeyData = useMemo(() => {
    if (propsSankeyData) {
      return propsSankeyData;
    }
    if (propsEdges) {
      return toSankeyData(propsEdges);
    }
    return { nodes: [], links: [] };
  }, [propsEdges, propsSankeyData]);

  if (sankeyData.nodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-slate-700 rounded-lg"
        style={{ height }}
      >
        <p className="text-slate-500">No flow data to display</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeRenderer = (nodeProps: any) => <CustomNode {...nodeProps} />;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkRenderer = (linkProps: any) => <CustomLink {...linkProps} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Sankey
        data={sankeyData}
        node={nodeRenderer}
        link={linkRenderer}
        nodePadding={24}
        nodeWidth={8}
        margin={{ top: 10, right: 180, bottom: 10, left: 10 }}
      >
        <Tooltip content={<CustomTooltip />} />
      </Sankey>
    </ResponsiveContainer>
  );
}
