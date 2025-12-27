"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface LineChartDataPoint {
  name: string;
  [key: string]: string | number;
}

export interface LineConfig {
  dataKey: string;
  stroke: string;
  name?: string;
  strokeWidth?: number;
}

interface LineChartComponentProps {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  xAxisKey?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export function LineChartComponent({
  data,
  lines,
  xAxisKey = "name",
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: LineChartComponentProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis dataKey={xAxisKey} className="text-xs" />
        <YAxis className="text-xs" />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            name={line.name || line.dataKey}
            strokeWidth={line.strokeWidth || 2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

