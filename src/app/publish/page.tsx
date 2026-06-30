"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import {
  getJobs,
  retryJob,
  exportJobs,
  type JobStatus,
} from "@/lib/api";
import {
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  RotateCcw,
  XCircle,
  Hourglass,
  Download,
} from "lucide-react";
import { StatusBadge, EmptyState } from "@/components/ui";

// ── Constants ──

type FilterValue = "" | "pending" | "processing" | "done" | "failed";

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Hourglass,
  queued: Hourglass,
  processing: Loader2,
  generating_audio: Loader2,
  generating_images: Loader2,
  compositing: Loader2,
  done: CheckCircle2,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: XCircle,
};

const STATUS_ICON_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600",
  queued: "bg-yellow-100 text-yellow-600",
  processing: "bg-blue-100 text-blue-600",
  generating_audio: "bg-blue-100 text-blue-600",
  generating_images: "bg-blue-100 text-blue-600",
  compositing: "bg-purple-100 text-purple-600",
  done: "bg-green-100 text-green-600",
  completed: "bg-green-100 text-green-600",
  failed: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600",
};

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />
  );
}

function JobListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ── Progress Bar ──

const STATUS_PROGRESS: Record<string, number> = {
  pending: 5,
  queued: 5,
  processing: 40,
  generating_audio: 20,
  generating_images: 45,
  compositing: 70,
  done: 100,
  completed: 100,
};

function ProgressBar({ status }: { status: string }) {
  const progress = STATUS_PROGRESS[status] ?? 0;
  const isActive = status !== "done" && status !== "failed" && status !== "completed";

  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${
          status === "done" || status === "completed"
            ? "bg-green-500"
            : status === "failed"
              ? "bg-red-400"
              : isActive
                ? "bg-blue-500"
                : "bg-gray-300"
        }`}
        style={{
          width: `${progress}%`,
          ...(isActive ? { animation: "pulse-width 2s ease-in-out infinite" } : {}),
        }}
      />
    </div>
  );
}

// ─── Helpers ──

function formatTime(dateStr?: string): string {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function formatDuration(start?: string, end?: string): string | null {
  if (!start || !end) return null;
  try {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return null;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return t("publish.seconds", { s: seconds });
    const minutes = Math.floor(seconds / 60);
    const remainSec = seconds % 60;
    return remainSec > 0 ? t("publish.minutes_seconds", { m: minutes, s: remainSec }) : t("publish.minutes", { m: minutes });
  } catch {
    return null;
  }
}

// ── Job Card ──

function JobCard({
  job,
  onRetry,
  isRetrying,
}: {
  job: JobStatus;
  onRetry: (id: string) => void;
  isRetrying?: boolean;
}) {
  const isProcessing =
    job.status !== "done" &&
    job.status !== "failed" &&
    job.status !== "completed";
  const [expanded, setExpanded] = useState(false);

  const StatusIcon = STATUS_ICONS[job.status] ?? Clock;
  const iconColorClass = STATUS_ICON_COLORS[job.status] ?? "bg-gray-100 text-gray-600";
  const isSpinning = isProcessing;
  const duration = formatDuration(job.created_at, job.completed_at ?? job.updated_at);

  return (
    <div className="border rounded-lg bg-card transition-colors hover:border-muted-foreground/20">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Icon + Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-full flex-shrink-0 mt-0.5 ${iconColorClass}`}>
              <StatusIcon className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">
                  {JOB_TYPE_LABELS[job.job_type ?? "video"] ?? t("publish.type_video")}
                </span>
                <StatusBadge status={job.status} />
                {duration && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-1">
                    <Clock className="w-3 h-3" />
                    {duration}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                <span className="font-mono">{job.id.slice(0, 10)}...</span>
                {job.created_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(job.created_at)}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {(isProcessing ||
                job.status === "done" ||
                job.status === "failed") && (
                <div className="mt-2 max-w-xs">
                  <ProgressBar status={job.status} />
                </div>
              )}

              {/* Error message */}
              {job.status === "failed" && job.error && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded break-words">
                  {job.error.length > 100
                    ? `${job.error.slice(0, 100)}...`
                    : job.error}
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {job.status === "failed" && (
              <button
                onClick={() => onRetry(job.id)}
                disabled={isRetrying}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                title={t("common.retry")}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={expanded ? t("common.collapse") : t("common.details")}
            >
              <svg
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 bg-muted/30 rounded-b-lg space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-16 flex-shrink-0">Job ID</span>
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono break-all">
              {job.id}
            </code>
          </div>
          {job.job_type && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0">{t("publish.job_type")}</span>
              <span>{JOB_TYPE_LABELS[job.job_type] ?? job.job_type}</span>
            </div>
          )}
          {job.created_at && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0">{t("publish.created_at")}</span>
              <span>{new Date(job.created_at).toLocaleString("zh-CN")}</span>
            </div>
          )}
          {job.updated_at && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0">{t("publish.updated_at")}</span>
              <span>{new Date(job.updated_at).toLocaleString("zh-CN")}</span>
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0">{t("publish.duration")}</span>
              <span className="font-medium">{duration}</span>
            </div>
          )}
          {job.output_data?.output_path != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0">{t("publish.output")}</span>
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[300px]">
                {job.output_data.output_path as string}
              </code>
            </div>
          )}
          {job.status === "failed" && job.error && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground w-16 flex-shrink-0 mt-0.5">
                {t("publish.error")}
              </span>
              <span className="text-red-600 break-all">{job.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──

export default function PublishPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("");
  const [retrying, setRetrying] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // ── Inline constants ──
  const FILTER_TABS: { value: FilterValue; label: string }[] = [
    { value: "" as const, label: t("publish.filter_all") },
    { value: "pending" as const, label: t("publish.filter_pending") },
    { value: "processing" as const, label: t("publish.filter_processing") },
    { value: "done" as const, label: t("publish.filter_done") },
    { value: "failed" as const, label: t("publish.filter_failed") },
  ];
  
  const FILTER_EMPTY_MESSAGES: Record<string, { title: string; description: string }> = {
    "": { title: t("publish.empty_all"), description: t("publish.empty_all_desc") },
    pending: { title: t("publish.empty_pending"), description: t("publish.empty_pending_desc") },
    processing: { title: t("publish.empty_processing"), description: t("publish.empty_processing_desc") },
    done: { title: t("publish.empty_done"), description: t("publish.empty_done_desc") },
    failed: { title: t("publish.empty_failed"), description: t("publish.empty_failed_desc") },
  };
  
  const JOB_TYPE_LABELS: Record<string, string> = {
    video: t("publish.type_video"),
    story2video: t("publish.type_story2video"),
  };

  const fetchJobs = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const result = await getJobs(filter || undefined);
      setJobs(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err: any) {
      if (err.message?.startsWith("401")) {
        router.push("/login");
        return;
      }
      setError(err.message ?? t("common.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [router, filter]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Poll when there are active jobs
  const hasActive = jobs.some(
    (j) =>
      j.status !== "done" && j.status !== "failed" && j.status !== "completed",
  );

  useEffect(() => {
    if (hasActive) {
      pollingRef.current = setInterval(fetchJobs, 5000);
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, [hasActive, fetchJobs]);

  async function handleExportPublish(format: "csv" | "json") {
    try {
      await exportJobs(format);
    } catch (err: any) {
      setError(err.message ?? t("common.export_failed"));
    }
  }

  async function handleRetry(jobId: string) {
    setRetrying(jobId);
    try {
      await retryJob(jobId);
      await fetchJobs();
    } catch (err: any) {
      setError(err.message ?? t("common.retry_failed"));
    } finally {
      setRetrying(null);
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
          <Skeleton className="h-8 w-32" />
          <JobListSkeleton />
        </div>
      </AppLayout>
    );
  }

  // ── Error (no data) ──
  if (error && jobs.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-0">
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive font-medium mb-1">{t("common.load_failed")}</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {error}
            </p>
            <button
              onClick={fetchJobs}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t("common.retry")}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const emptyMsg = FILTER_EMPTY_MESSAGES[filter] ?? FILTER_EMPTY_MESSAGES[""];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t("publish.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("publish.subtitle")}: {total}
              {hasActive && (
                <span className="ml-2 text-blue-600 inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {t("common.refreshing")}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="relative group">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" />
                {t("common.export")}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-28 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExportPublish("csv")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors rounded-t-lg">{t("common.export")} CSV</button>
                <button onClick={() => handleExportPublish("json")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors rounded-b-lg">{t("common.export")} JSON</button>
              </div>
            </div>
            <button
              onClick={fetchJobs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t("common.refresh")}
            </button>
          </div>
        </div>

        {/* Filter Tabs — responsive: wrap on mobile */}
        <div className="flex flex-wrap gap-1 p-1 border rounded-lg bg-muted/30 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-card text-foreground shadow-sm border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-destructive/70 hover:text-destructive ml-2 flex-shrink-0"
            >
              {t("common.close")}
            </button>
          </div>
        )}

        {/* Filter-aware empty state */}
        {jobs.length === 0 && !loading && (
          <EmptyState
            icon={filter === "failed" ? XCircle : filter === "done" ? CheckCircle2 : filter === "processing" ? Loader2 : filter === "pending" ? Hourglass : Send}
            title={emptyMsg.title}
            description={emptyMsg.description}
            action={
              filter === ""
                ? { label: t("publish.type_video"), onClick: () => router.push("/generate") }
                : undefined
            }
          />
        )}

        {/* Job list */}
        {jobs.length > 0 && (
          <div className="space-y-2">
            {jobs.map((job) => (
              <JobCard
                key={`${job.id}-${job.status}`}
                job={job}
                onRetry={handleRetry}
                isRetrying={retrying === job.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
