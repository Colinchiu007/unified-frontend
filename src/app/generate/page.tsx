"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getGenerateOptions, submitGenerate, getJobDetail, uploadFile, type GenerateOptions } from "@/lib/api";
import {
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  FileText,
  Music,
  Settings2,
  Sparkles,
  Clock,
  XCircle,
  Upload,
  Check,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/ui";
import FileUploadZone from "@/components/FileUploadZone";

// ── Constants ──

const STEPS = [
  { label: "选择内容", icon: FileText },
  { label: "视频配置", icon: Settings2 },
  { label: "确认生成", icon: Sparkles },
];

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

// ── Empty State ──

function EmptySources() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
      <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">暂无可用内容</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        请先在内容库中采集或导入文章
      </p>
    </div>
  );
}

// ── Error State ──

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="w-10 h-10 text-destructive mb-3" />
      <p className="text-sm text-destructive font-medium mb-1">加载失败</p>
      <p className="text-xs text-muted-foreground mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重试
        </button>
      )}
    </div>
  );
}

// ── Validation Indicator ──

function FieldIndicator({ valid, show }: { valid: boolean; show: boolean }) {
  if (!show) return null;
  return (
    <span className="flex-shrink-0">
      {valid ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
    </span>
  );
}

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

function ProgressTracker({
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

// ── Step 1: Content Selector ──

function ContentSelector({
  sources,
  selected,
  onChange,
  touched,
  error,
}: {
  sources: GenerateOptions["content_sources"];
  selected: string;
  onChange: (id: string) => void;
  touched: boolean;
  error?: string;
}) {
  const hasError = touched && !selected;
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        选择要生成视频的文章
        <FieldIndicator valid={!!selected} show={touched} />
      </label>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {sources.map((s) => {
          const title =
            s.title ??
            s.source_url?.split("/").pop()?.replace(/-/g, " ") ??
            s.source_url;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`w-full text-left p-3 border rounded-lg transition-colors ${
                selected === s.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : hasError
                    ? "border-red-300 hover:bg-muted/50"
                    : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{title}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-muted-foreground">
                      {s.word_count_original?.toLocaleString() ?? "?"} 字
                    </span>
                  </div>
                </div>
                {selected === s.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>
      {hasError && error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <XCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ── File Upload Zone ──

function UploadZoneWrapper({ onComplete }: { onComplete: (id: string) => void }) {
  return <FileUploadZone onUploadComplete={onComplete} />;
}

// ── Step 2: Video Config ──

function VideoConfig({
  options,
  voice,
  ratio,
  platform,
  onVoiceChange,
  onRatioChange,
  onPlatformChange,
  touched,
}: {
  options: GenerateOptions;
  voice: string;
  ratio: string;
  platform: string;
  onVoiceChange: (v: string) => void;
  onRatioChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
  touched: boolean;
}) {
  return (
    <div className="space-y-5">
      <label className="text-sm font-medium flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        视频参数配置
        <FieldIndicator valid={!!voice && !!ratio && !!platform} show={touched} />
      </label>

      {/* Voice */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5" />
          配音音色
        </label>
        <select
          value={voice}
          onChange={(e) => onVoiceChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        >
          {options.voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Video Ratio */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Settings2 className="w-3.5 h-3.5" />
          视频比例
        </label>
        <div className="grid grid-cols-3 gap-2">
          {options.video_ratios.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onRatioChange(r.id)}
              className={`p-3 border rounded-lg text-center text-sm transition-colors ${
                ratio === r.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                  : "hover:bg-muted/50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Platform */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          图片风格
        </label>
        <div className="grid grid-cols-2 gap-2">
          {options.prompt_platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPlatformChange(p.id)}
              className={`p-3 border rounded-lg text-center text-sm transition-colors ${
                platform === p.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary font-medium"
                  : "hover:bg-muted/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Confirm ──

function ConfirmStep({
  options,
  selectedArticle,
  voice,
  ratio,
  platform,
}: {
  options: GenerateOptions;
  selectedArticle: string;
  voice: string;
  ratio: string;
  platform: string;
}) {
  const article = options.content_sources.find((s) => s.id === selectedArticle);
  const voiceLabel = options.voices.find((v) => v.id === voice)?.label ?? voice;
  const ratioLabel =
    options.video_ratios.find((r) => r.id === ratio)?.label ?? ratio;
  const platformLabel =
    options.prompt_platforms.find((p) => p.id === platform)?.label ?? platform;
  const title =
    article?.title ??
    article?.source_url?.split("/").pop()?.replace(/-/g, " ") ??
    article?.source_url;

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        确认生成参数
      </label>

      <div className="border rounded-lg divide-y">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">文章</span>
          <span className="text-sm font-medium truncate max-w-[260px] ml-4">
            {title}
          </span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">配音</span>
          <span className="text-sm">{voiceLabel}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">比例</span>
          <span className="text-sm">{ratioLabel}</span>
        </div>
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">风格</span>
          <span className="text-sm">{platformLabel}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function GeneratePage() {
  const router = useRouter();
  const [options, setOptions] = useState<GenerateOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState("");
  const [voice, setVoice] = useState("");
  const [ratio, setRatio] = useState("");
  const [platform, setPlatform] = useState("");

  // Validation state
  const [touched, setTouched] = useState<Record<number, boolean>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    job_id: string;
    status: string;
  } | null>(null);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const opts = await getGenerateOptions();
      setOptions(opts);
      // Set defaults
      if (opts.voices.length > 0) setVoice(opts.voices[0].id);
      if (opts.video_ratios.length > 0) setRatio(opts.video_ratios[0].id);
      if (opts.prompt_platforms.length > 0)
        setPlatform(opts.prompt_platforms[0].id);
    } catch (err: any) {
      if (err.message?.startsWith("401")) {
        router.push("/login");
        return;
      }
      setError(err.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  async function handleGenerate() {
    // Validate step 0 before submitting
    if (!selectedArticle) {
      setTouched((prev) => ({ ...prev, 0: true }));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitGenerate({
        article_id: selectedArticle,
        voice,
        video_ratio: ratio,
        prompt_platform: platform,
      });
      setResult(res);
      setStep(3); // Move to result step
    } catch (err: any) {
      setSubmitError(err.message ?? "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function canProceedFromStep(s: number): boolean {
    if (s === 0) return !!selectedArticle;
    if (s === 1) return true; // All configs have defaults
    return true;
  }

  function nextStep() {
    if (step < 2) {
      // Mark current step as touched for validation
      setTouched((prev) => ({ ...prev, [step]: true }));
      if (canProceedFromStep(step)) {
        setStep(step + 1);
      }
    }
  }

  function prevStep() {
    if (step > 0) setStep(step - 1);
  }

  function handleStepClick(targetStep: number) {
    // Allow going back to any previous step
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    // Going forward: validate each intermediate step
    for (let s = step; s < targetStep; s++) {
      if (!canProceedFromStep(s)) {
        setTouched((prev) => ({ ...prev, [s]: true }));
        return;
      }
    }
    setStep(targetStep);
  }

  // ── Loading ──
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <FormSkeleton />
        </div>
      </AppLayout>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <ErrorBlock message={error} onRetry={fetchOptions} />
        </div>
      </AppLayout>
    );
  }

  // ── Empty content sources ──
  if (options && options.content_sources.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold">生成视频</h1>
          <EmptySources />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page title */}
        <h1 className="text-2xl font-bold">生成视频</h1>

        {/* Step indicators */}
        {!result && (
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s.label} className="flex items-center flex-1">
                <button
                  type="button"
                  onClick={() => handleStepClick(i)}
                  disabled={i > step}
                  className={`flex items-center gap-2 text-sm ${
                    i === step
                      ? "text-primary font-medium"
                      : i < step
                        ? "text-green-600"
                        : "text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      i === step
                        ? "border-primary bg-primary/5 text-primary"
                        : i < step
                          ? "border-green-500 bg-green-50 text-green-600"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < step ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-3 ${
                      i < step ? "bg-green-400" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step content */}
        {!result && options && (
          <div className="border rounded-lg bg-card p-6 space-y-6">
            {step === 0 && (
              <ContentSelector
                sources={options.content_sources}
                selected={selectedArticle}
                onChange={setSelectedArticle}
                touched={!!touched[0]}
                error="请选择一篇文章"
              />
            )}
            {step === 1 && (
              <VideoConfig
                options={options}
                voice={voice}
                ratio={ratio}
                platform={platform}
                onVoiceChange={setVoice}
                onRatioChange={setRatio}
                onPlatformChange={setPlatform}
                touched={!!touched[1]}
              />
            )}
            {step === 2 && (
              <ConfirmStep
                options={options}
                selectedArticle={selectedArticle}
                voice={voice}
                ratio={ratio}
                platform={platform}
              />
            )}

            {/* File upload zone — shown only in step 1 */}
            {step === 1 && (
              <UploadZoneWrapper onComplete={(id) => {
                setSelectedArticle(id);
                // Refresh options to include new article
                fetchOptions();
              }} />
            )}

            {/* Submit error */}
            {submitError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                {submitError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2 border-t">
              <button
                onClick={prevStep}
                disabled={step === 0}
                className="px-4 py-2 border rounded-md text-sm font-medium disabled:opacity-30 hover:bg-muted transition-colors"
              >
                上一步
              </button>

              {step < 2 ? (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result / Progress tracking */}
        {result && (
          <div className="border rounded-lg bg-card p-6 space-y-4">
            <ProgressTracker
              jobId={result.job_id}
              initialStatus={result.status}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
