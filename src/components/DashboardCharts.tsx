"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { getJobStats, type JobStatsResponse } from "@/lib/api";
import { AlertCircle, RefreshCw, BarChart3 } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

// ── Helpers ──

const STATUS_COLORS = {
  completed: "#22c55e",
  processing: "#3b82f6",
  pending: "#eab308",
  failed: "#ef4444",
} as const;

const STATUS_LABELS: Record<string, string> = {
  completed: "已完成",
  processing: "生成中",
  pending: "排队中",
  failed: "失败",
};

// ── Skeleton ──

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-4 border rounded-lg bg-card space-y-4">
        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
      <div className="p-4 border rounded-lg bg-card space-y-4">
        <div className="h-5 w-24 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

// ── Component ──

export default function DashboardCharts() {
  const lineRef = useRef<HTMLCanvasElement>(null);
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const lineChartRef = useRef<ChartJS<"line"> | null>(null);
  const doughnutChartRef = useRef<ChartJS<"doughnut"> | null>(null);
  const [data, setData] = useState<JobStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getJobStats(7);
      setData(result);
    } catch (err: any) {
      setError(err.message ?? "加载统计数据失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Build charts when data is ready
  useEffect(() => {
    if (!data || !lineRef.current || !doughnutRef.current) return;

    const ctxLine = lineRef.current.getContext("2d");
    const ctxDoughnut = doughnutRef.current.getContext("2d");
    if (!ctxLine || !ctxDoughnut) return;

    // Destroy previous instances
    lineChartRef.current?.destroy();
    doughnutChartRef.current?.destroy();

    const dates = data.daily.map((d) => d.date.slice(5)); // "MM-DD"
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "#a1a1aa" : "#71717a";

    // ── Line chart: 7-day trend ──
    lineChartRef.current = new ChartJS(ctxLine, {
      type: "line",
      data: {
        labels: dates,
        datasets: [
          {
            label: "已完成",
            data: data.daily.map((d) => d.completed),
            borderColor: STATUS_COLORS.completed,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            pointHitRadius: 8,
          },
          {
            label: "生成中",
            data: data.daily.map((d) => d.processing),
            borderColor: STATUS_COLORS.processing,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            pointHitRadius: 8,
          },
          {
            label: "排队中",
            data: data.daily.map((d) => d.pending),
            borderColor: STATUS_COLORS.pending,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            pointHitRadius: 8,
            borderDash: [5, 3],
          },
          {
            label: "失败",
            data: data.daily.map((d) => d.failed),
            borderColor: STATUS_COLORS.failed,
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.3,
            pointRadius: 3,
            pointHitRadius: 8,
            borderDash: [3, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, padding: 16, color: textColor } },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              title: (items) => items[0]?.label ?? "",
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { size: 11 },
              stepSize: 1,
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
      },
    });

    // ── Doughnut chart: status distribution ──
    const hasData = Object.values(data.totals).some((v) => v > 0);
    const labels = hasData
      ? (["completed", "processing", "pending", "failed"] as const)
          .filter((k) => data.totals[k] > 0)
          .map((k) => STATUS_LABELS[k])
      : ["暂无数据"];

    const doughnutData = hasData
      ? (["completed", "processing", "pending", "failed"] as const)
          .filter((k) => data.totals[k] > 0)
          .map((k) => data.totals[k])
      : [1];

    const doughnutColors = hasData
      ? (["completed", "processing", "pending", "failed"] as const)
          .filter((k) => data.totals[k] > 0)
          .map((k) => STATUS_COLORS[k])
      : ["#e4e4e7"];

    doughnutChartRef.current = new ChartJS(ctxDoughnut, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: doughnutData,
            backgroundColor: doughnutColors,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { boxWidth: 12, padding: 16, color: textColor },
          },
          tooltip: {
            callbacks: {
              label: (item) => {
                const total = (item.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const value = item.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return `${item.label}: ${value} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      lineChartRef.current?.destroy();
      doughnutChartRef.current?.destroy();
    };
  }, [data]);

  if (loading) return <ChartsSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
        <AlertCircle className="w-8 h-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground mb-3">{error}</p>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重试
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">任务趋势（近 7 天）</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line chart */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="h-56">
            <canvas ref={lineRef} />
          </div>
        </div>
        {/* Doughnut chart */}
        <div className="p-4 border rounded-lg bg-card">
          <div className="h-56">
            <canvas ref={doughnutRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
