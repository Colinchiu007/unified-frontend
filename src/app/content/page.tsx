"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getGenerateOptions } from "@/lib/api";
import {
  AlertCircle,
  RefreshCw,
  Search,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  CalendarDays,
  FileDigit,
} from "lucide-react";

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />
  );
}

function ContentSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 border rounded-lg space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "待处理",
  processing: "处理中",
  completed: "已完成",
  failed: "失败",
};

function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_BADGE[status] ?? STATUS_BADGE.default;
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colorClass}`}
    >
      {label}
    </span>
  );
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ── Page ──

export default function ContentPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    let redirected = false;
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        redirected = true;
        router.push("/login");
        return;
      }
      const result = await getGenerateOptions();
      setArticles(result.content_sources ?? []);
    } catch (err: any) {
      if (err.message?.startsWith("401")) {
        redirected = true;
        router.push("/login");
        return;
      }
      setError(err.message ?? "加载失败，请稍后重试");
    } finally {
      if (!redirected) setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // ── Client-side search / filter ──
  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) =>
        (a.title ?? a.source_url ?? "").toLowerCase().includes(q) ||
        (a.status ?? "").toLowerCase().includes(q)
    );
  }, [articles, search]);

  // ── Loading ──
  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-24" />
          <ContentSkeleton />
        </div>
      </AppLayout>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[40vh] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-1">加载失败</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{error}</p>
          <button
            onClick={fetchContent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">内容库</h1>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              共 {filtered.length} 条
            </span>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索标题或状态..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "未找到匹配的内容" : "内容库为空"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {search
                ? "尝试更换搜索关键词"
                : "内容将在采集后自动展示"}
            </p>
          </div>
        )}

        {/* Content cards */}
        {filtered.length > 0 && (
          <div className="grid gap-3">
            {filtered.map((article) => {
            const title =
              article.title ||
              article.source_url?.split("/").pop()?.replace(/-/g, " ") ||
              article.source_url;
            const isExpanded = expandedId === article.id;

            return (
              <div
                key={article.id}
                className="border rounded-lg bg-card transition-colors"
              >
                {/* Card header (always visible) */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : article.id)
                  }
                  className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                >
                  <div className="p-1.5 rounded-md bg-primary/5 text-primary mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{title}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <StatusBadge status={article.status} />
                      <span className="text-xs text-muted-foreground">
                        {extractDomain(article.source_url)}
                      </span>
                      {article.word_count_original != null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileDigit className="w-3 h-3" />
                          {article.word_count_original.toLocaleString()} 字
                        </span>
                      )}
                      {article.created_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {formatDate(article.created_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-muted-foreground mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-2 text-sm bg-muted/30 rounded-b-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">
                        ID
                      </span>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {article.id}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">
                        原文链接
                      </span>
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 truncate"
                      >
                        {article.source_url}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20 flex-shrink-0">
                        原始字数
                      </span>
                      <span>
                        {article.word_count_original?.toLocaleString() ?? "--"}{" "}
                        字
                      </span>
                    </div>
                    {article.created_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-20 flex-shrink-0">
                          创建时间
                        </span>
                        <span>{formatDate(article.created_at)}</span>
                      </div>
                    )}
         