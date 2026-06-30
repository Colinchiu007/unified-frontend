"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getJobDetail } from "@/lib/api";
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronRight,
  Clock,
} from "lucide-react";

// ── Progress Tracker ──

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; progress: number }
> = {
  pending: { label: "排队中", color: "bg-yellow-500", progress: 5 },
  queued: { label: "排队中", color: "bg-yellow-500", progress: 5 },
  processing: { label: "生成中", color: "bg-blue-500", progress: 30 },
  generating_audio: { label: "生成音频", color: "bg-blue-500", progress: 20 },
  generating_images: { label: "生成图片", color: "bg-indigo-500", progress: 45 },
  compositing: { label: "合成视频", color: "bg-purple-500", progress: 70 },
  done: { label: "已完成", color: "bg-green-500", progress: 100 },
  completed: { label: "已完成", color: "bg-green-500", progress: 100 },
  failed: { label: "失败", color: "bg-red-500", progress: 0 },
};

export default function ProgressTracker({
  jobId,
  initialStatus,
}: {
  jobId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [output, setOutput] = useState<Record<string, unknown> | null>(null);
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const detail = await getJobDetail(jobId);
      setStatus(detail.status);
      setOutput(detail.output_data ?? null);
      if (detail.status === "done" || detail.status === "failed") {
        if (polling.current) clearInterval(polling.current);
      }
    } catch {
      // silent — keep polling
    }
  }, [jobId]);

  useEffect(() => {
    // Poll every 3s while job is active
    if (status !== "done" && status !== "failed" && status !== "completed") {
      polling.current = setInterval(poll, 3000);
      return () => {
        if (polling.current) clearInterval(polling.current);
      };
    }
  }, [poll, status]);

  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-gray-400",
    progress: 0,
  };
  const isFinal = status === "done" || status === "failed" || status === "completed";

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center gap-3">
        {status === "done" || status === "completed" ? (
          <div className="p-2 rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        ) : status === "failed" ? (
          <div className="p-2 rounded-full bg-red-100 text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        ) : (
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
        <div>
          <div className="text-lg font-semibold">{cfg.label}</div>
          <div className="text-xs text-muted-foreground font-mono">
            {jobId.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {!isFinal && (
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.color}`}
            style={{ width: `${cfg.progress}%` }}
          />
        </div>
      )}

      {/* Output summary */}
      {output != null && (status === "done" || status === "completed") && (
        <div className="p-4 border rounded-lg bg-card text-sm space-y-2">
          {output.output_path != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">输出:</span>
              <span className="font-mono text-xs truncate">
                {output.output_path as string}
              </span>
            </div>
          )}
          {output.scenes != null && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">场景数:</span>
              <span>{output.scenes as number}</span>
            </div>
          )}
          {output.duration != null && (
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">时长:</span>
              <span>{output.duration as number}s</span>
            </div>
          )}
        </div>
      )}

      {/* Error detail */}
      {status === "failed" && output?.error != null && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {output.error as string}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {status === "done" || status === "completed" ? (
          <button
            onClick={() => (window.location.href = "/publish")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            查看发布
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : status === "failed" ? (
          <button
            onClick={() => (window.location.href = "/generate")}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            重新生成
          </button>
        ) : null}
        <button
          onClick={() => (window.location.href = "/publish")}
          className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          任务列表
        </button>
      </div>
    </div>
  );
}