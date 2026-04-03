"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

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

// --- Multi-step Forecast (TFT) Data ---
const tftData = [
  { day: 'Day 1', actual: 45, predicted: 42, confidence: [40, 44] },
  { day: 'Day 2', actual: 52, predicted: 50, confidence: [48, 52] },
  { day: 'Day 3', actual: 48, predicted: 55, confidence: [52, 58] },
  { day: 'Day 4', actual: 61, predicted: 58, confidence: [55, 61] },
  { day: 'Day 5', actual: 55, predicted: 62, confidence: [59, 65] },
  { day: 'Day 6', predicted: 68, confidence: [64, 72] },
  { day: 'Day 7', predicted: 75, confidence: [70, 80] },
  { day: 'Day 8', predicted: 72, confidence: [68, 76] },
  { day: 'Day 9', predicted: 65, confidence: [60, 70] },
  { day: 'Day 10', predicted: 60, confidence: [55, 65] },
];

const attentionData = [
  { name: 'Weather', weight: 0.35 },
  { name: 'Construction', weight: 0.25 },
  { name: 'Public Holidays', weight: 0.20 },
  { name: 'Road Works', weight: 0.15 },
  { name: 'Historical', weight: 0.05 },
];

// --- Spatial Clustering Data ---
const clusterData = [
  { region: 'Jurong West', persistence: 85, seasonality: 20, count: 120 },
  { region: 'Woodlands', persistence: 40, seasonality: 75, count: 95 },
  { region: 'Tampines', persistence: 65, seasonality: 45, count: 110 },
  { region: 'Bukit Merah', persistence: 30, seasonality: 80, count: 85 },
  { region: 'Seng Kang', persistence: 70, seasonality: 30, count: 105 },
];

// --- Anomaly Detection Data ---
const anomalyData = [
  { time: '08:00', value: 20 },
  { time: '10:00', value: 25 },
  { time: '12:00', value: 85, isAnomaly: true },
  { time: '14:00', value: 30 },
  { time: '16:00', value: 28 },
  { time: '18:00', value: 110, isAnomaly: true },
  { time: '20:00', value: 45 },
  { time: '22:00', value: 35 },
];

// --- Multi-Output Models Data ---
const multiOutputData = [
  { subject: 'Forecasting Accuracy', noise: 88, dumping: 76, pest: 81 },
  { subject: 'Recall', noise: 82, dumping: 70, pest: 78 },
  { subject: 'Precision', noise: 85, dumping: 82, pest: 75 },
  { subject: 'F1 Score', noise: 83, dumping: 75, pest: 76 },
  { subject: 'Response Coverage', noise: 90, dumping: 65, pest: 82 },
];

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
  data?: typeof tftData | any[];
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
  data?: typeof attentionData | any[];
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
  data?: typeof clusterData | any[];
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
  data?: typeof anomalyData | any[];
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
  data?: typeof multiOutputData | any[];
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
