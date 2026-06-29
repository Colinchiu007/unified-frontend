"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { getGenerateOptions, exportArticles } from "@/lib/api";
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
  Trash2,
  Download,
  CheckSquare,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchDeleting, setBatchDeleting] = useState(false);

  const handleExport = useCallback((format: "csv" | "json") => {
    exportArticles(format).catch((err: any) => setError(err.message));
  }, []);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const result = await getGenerateOptions();
      setArticles(result.content_sources ?? []);
    } catch (err: any) {
      if (err.message?.startsWith("401")) {
        router.push("/login");
        return;
      }
      setError(err.message ?? "加载失败，请稍后重试");
    } finally {
      setLoading(false);
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

  // Batch operations
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a: any) => a.id)));
    }
  }, [filtered, selectedIds]);

  const handleBatchDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确定删除选中的 ${selectedIds.size} 条内容？`)) return;
    setBatchDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("/api/articles/batch-delete", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ article_ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSelectedIds(new Set());
      await fetchContent();
    } catch (err: any) {
      setError(err.message ?? "批量删除失败");
    } finally {
      setBatchDeleting(false);
    }
  }, [selectedIds, fetchContent]);
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
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">内容库</h1>
            {!loading && (
              <span className="text-sm text-muted-foreground">
                {selectedIds.size > 0
                  ? `已选 ${selectedIds.size} / ${filtered.length} 条`
                  : `共 ${filtered.length} 条`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchDelete}
                disabled={batchDeleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {batchDeleting ? "删除中..." : `删除选中 (${selectedIds.size})`}
              </button>
            )}
            <div className="relative group">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-medium hover:bg-muted transition-colors">
                <Download className="w-3.5 h-3.5" />
                导出
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute right-0 top-full mt-1 w-28 bg-card border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button onClick={() => handleExport("csv")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors rounded-t-lg">导出 CSV</button>
                <button onClick={() => handleExport("json")} className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors rounded-b-lg">导出 JSON</button>
              </div>
            </div>
          </div>
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
                <div className="flex items-start">
                  {/* Checkbox */}
                  <div className="p-4 pr-0 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary/20 cursor-pointer mt-1"
                    />
                  </div>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : article.id)
                    }
                    className="flex-1 flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
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
                </div>

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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </AppLayout>
  );
}
