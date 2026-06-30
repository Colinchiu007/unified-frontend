"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getGenerateOptions, batchGenerate, getJobDetail, uploadFile, type GenerateOptions, type BatchJobResult } from "@/lib/api";
import {
  Play,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronDown,
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
import dynamic from "next/dynamic";

const ProgressTracker = dynamic(() => import("@/components/generate/ProgressTracker"), {
  loading: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-muted">
          <div className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  ),
});

import { StatusBadge } from "@/components/ui";

const FileUploadZone = dynamic(() => import("@/components/FileUploadZone"));

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

// ── Step 1: Content Selector ──

function ContentSelector({
  sources,
  selected,
  onChange,
  touched,
  error,
}: {
  sources: GenerateOptions["content_sources"];
  selected: string[];
  onChange: (ids: string[]) => void;
  touched: boolean;
  error?: string;
}) {
  const hasError = touched && selected.length === 0;
  const allSelected = sources.length > 0 && selected.length === sources.length;

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(sources.map((s) => s.id));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          选择要生成视频的文章
          <FieldIndicator valid={selected.length > 0} show={touched} />
        </label>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-primary hover:underline"
        >
          {allSelected ? "取消全选" : `全选（${sources.length}篇）`}
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {sources.map((s) => {
          const isSelected = selected.includes(s.id);
          const title =
            s.title ??
            s.source_url?.split("/").pop()?.replace(/-/g, " ") ??
            s.source_url;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              className={`w-full text-left p-3 border rounded-lg transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : hasError
                    ? "border-red-300 hover:bg-muted/50"
                    : "hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={s.status} />
                      <span className="text-xs text-muted-foreground">
                        {s.word_count_original?.toLocaleString() ?? "?"} 字
                      </span>
                    </div>
                  </div>
                </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
  selectedArticles,
  voice,
  ratio,
  platform,
}: {
  options: GenerateOptions;
  selectedArticles: string[];
  voice: string;
  ratio: string;
  platform: string;
}) {
  const voiceLabel = options.voices.find((v) => v.id === voice)?.label ?? voice;
  const ratioLabel =
    options.video_ratios.find((r) => r.id === ratio)?.label ?? ratio;
  const platformLabel =
    options.prompt_platforms.find((p) => p.id === platform)?.label ?? platform;
  const articles = options.content_sources.filter((s) =>
    selectedArticles.includes(s.id)
  );

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        确认生成参数
      </label>

      <div className="border rounded-lg divide-y">
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">文章数量</span>
          <span className="text-sm font-medium">
            {articles.length} 篇
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

      {/* Article list collapsed */}
      <details className="border rounded-lg">
        <summary className="p-3 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2">
          <ChevronDown className="w-4 h-4" />
          已选文章
        </summary>
        <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto">
          {articles.map((a) => {
            const title =
              a.title ??
              a.source_url?.split("/").pop()?.replace(/-/g, " ") ??
              a.source_url;
            return (
              <div
                key={a.id}
                className="text-xs text-muted-foreground flex items-center gap-2 p-1.5"
              >
                <FileText className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{title}</span>
              </div>
            );
          })}
        </div>
      </details>
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
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [voice, setVoice] = useState("");
  const [ratio, setRatio] = useState("");
  const [platform, setPlatform] = useState("");

  // Validation state
  const [touched, setTouched] = useState<Record<number, boolean>>({});

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchJobResult[] | null>(null);

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
    if (selectedArticles.length === 0) {
      setTouched((prev) => ({ ...prev, 0: true }));
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await batchGenerate({
        article_ids: selectedArticles,
        voice,
        video_ratio: ratio,
        prompt_platform: platform,
      });
      setResults(res.results);
      setStep(3); // Move to result step
    } catch (err: any) {
      setSubmitError(err.message ?? "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  }

  function canProceedFromStep(s: number): boolean {
    if (s === 0) return selectedArticles.length > 0;
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
        {!results && (
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
        {!results && options && (
          <div className="border rounded-lg bg-card p-6 space-y-6">
            {step === 0 && (
              <ContentSelector
                sources={options.content_sources}
                selected={selectedArticles}
                onChange={setSelectedArticles}
                touched={!!touched[0]}
                error="请至少选择一篇文章"
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
                selectedArticles={selectedArticles}
                voice={voice}
                ratio={ratio}
                platform={platform}
              />
            )}

            {/* File upload zone — shown only in step 1 */}
            {step === 1 && (
              <UploadZoneWrapper onComplete={(id) => {
                setSelectedArticles((prev) => [...prev, id]);
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
                      开始生成 ({selectedArticles.length} 个视频)
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result / Progress tracking */}
        {results && (
          <div className="border rounded-lg bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Play className="w-4 h-4 text-muted-foreground" />
                批量生成进度 ({results.length} 个视频)
              </label>
            </div>
            <div className="space-y-3">
              {results.map((r, i) => (
                <details
                  key={r.job_id}
                  className="border rounded-lg"
                  open={results.length <= 3}
                >
                  <summary className="p-3 text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-2">
                    <ChevronDown className="w-4 h-4" />
                    视频 #{i + 1}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {r.status === "pending" ? "排队中" : r.status}
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <ProgressTracker
                      jobId={r.job_id}
                      initialStatus={r.status}
                    />
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
