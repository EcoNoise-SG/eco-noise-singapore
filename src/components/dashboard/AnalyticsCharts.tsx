"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export type ForecastChartPoint = {
  day: string;
  actual?: number;
  predicted: number;
  confidence?: [number, number];
};

export type AttentionChartPoint = {
  name: string;
  weight: number;
};

export type ClusterChartPoint = {
  region: string;
  persistence: number;
  seasonality: number;
  count: number;
};

export type AnomalyChartPoint = {
  time: string;
  value: number;
  isAnomaly?: boolean;
};

export type RadarChartPoint = {
  subject: string;
  noise: number;
  dumping: number;
  pest: number;
};

function hasChartData(data: unknown) {
  return Array.isArray(data) && data.length > 0;
}

function ChartFrame({
  height,
  minHeight,
  children,
  hasData = true,
}: {
  height: number | string;
  minHeight: number;
  children: React.ReactNode;
  hasData?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [hasMeasuredSize, setHasMeasuredSize] = useState(false);

  useEffect(() => {
    const node = frameRef.current;
    if (!node) return;

    const checkSize = () => {
      const { width, height: frameHeight } = node.getBoundingClientRect();
      setHasMeasuredSize(width > 0 && frameHeight > 0);
    };

    checkSize();
    const animationFrame = window.requestAnimationFrame(checkSize);

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        window.cancelAnimationFrame(animationFrame);
      };
    }

    const observer = new ResizeObserver(() => {
      checkSize();
    });

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={frameRef}
      style={{ width: '100%', height, minWidth: 0, minHeight, flex: 1 }}
    >
      {!hasData ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>No live data available for this chart yet.</div>
      ) : hasMeasuredSize ? (
        children
      ) : null}
    </div>
  );
}

export const TFTForecastChart = ({
  height = 300,
  data,
}: {
  height?: number | string;
  data?: ForecastChartPoint[] | any[];
}) => {
  const safeData = (hasChartData(data) ? data : []) as any[];
  return (
  <ChartFrame height={height} minHeight={280} hasData={hasChartData(data)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <AreaChart data={safeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Area type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorPredicted)" />
        <Line type="monotone" dataKey="actual" stroke="#334155" strokeWidth={2} dot={{ r: 4, fill: '#334155' }} />
      </AreaChart>
    </ResponsiveContainer>
  </ChartFrame>
  );
};

export const AttentionWeightsChart = ({
  height = 200,
  data,
}: {
  height?: number | string;
  data?: AttentionChartPoint[] | any[];
}) => {
  const safeData = (hasChartData(data) ? data : []) as any[];
  return (
  <ChartFrame height={height} minHeight={200} hasData={hasChartData(data)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
      <BarChart data={safeData} layout="vertical" margin={{ left: 40 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
        <Tooltip cursor={{ fill: 'transparent' }} />
        <Bar dataKey="weight" fill="#115e59" radius={[0, 4, 4, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  </ChartFrame>
  );
};

export const SpatialPersistenceChart = ({
  height = 300,
  data,
}: {
  height?: number | string;
  data?: ClusterChartPoint[] | any[];
}) => {
  const safeData = (hasChartData(data) ? data : []) as any[];
  return (
  <ChartFrame height={height} minHeight={280} hasData={hasChartData(data)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
        <XAxis type="number" dataKey="persistence" name="Persistence" unit="%" label={{ value: 'Persistence (%)', position: 'bottom', offset: 0, fontSize: 12 }} />
        <YAxis type="number" dataKey="seasonality" name="Seasonality" unit="%" label={{ value: 'Seasonality (%)', angle: -90, position: 'left', fontSize: 12 }} />
        <ZAxis type="number" dataKey="count" range={[100, 1000]} name="Complaint Volume" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name="Planning Areas" data={safeData} fill="#3b82f6">
          {safeData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.persistence > 60 ? '#2563eb' : '#60a5fa'} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  </ChartFrame>
  );
};

export const AnomalyDetectionChart = ({
  height = 300,
  data,
}: {
  height?: number | string;
  data?: AnomalyChartPoint[] | any[];
}) => {
  const safeData = (hasChartData(data) ? data : []) as any[];
  return (
  <ChartFrame height={height} minHeight={280} hasData={hasChartData(data)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
      <LineChart data={safeData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (payload.isAnomaly) {
              return (
                <circle cx={cx} cy={cy} r={6} fill="#f43f5e" stroke="none" />
              );
            }
            return <circle cx={cx} cy={cy} r={3} fill="#8b5cf6" stroke="none" />;
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  </ChartFrame>
  );
};

export const MultiOutputRadarChart = ({
  height = 350,
  data,
}: {
  height?: number | string;
  data?: RadarChartPoint[] | any[];
}) => {
  const safeData = (hasChartData(data) ? data : []) as any[];
  return (
  <ChartFrame height={height} minHeight={320} hasData={hasChartData(data)}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={safeData}>
        <PolarGrid stroke="#94a3b8" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
        <Radar name="Noise" dataKey="noise" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
        <Radar name="Dumping" dataKey="dumping" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
        <Radar name="Pest" dataKey="pest" stroke="#d946ef" fill="#d946ef" fillOpacity={0.6} />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  </ChartFrame>
  );
};
