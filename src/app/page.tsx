"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import dynamic from "next/dynamic";
import { useTranslations } from "@/i18n/TranslationsProvider";

const DashboardCharts = dynamic(() => import("@/components/DashboardCharts"), {
  ssr: false,
  loading: () => <div className="h-64 bg-muted rounded-lg animate-pulse" />,
});
import { getDashboard, type DashboardData } from "@/lib/api";
import {
  AlertCircle,
  RefreshCw,
  TrendingUp,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ── Skeleton primitives ──

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-card space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

function TrendingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center p-3 border rounded-md">
          <Skeleton className="h-6 w-6 rounded-full mr-3" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-4 w-12 ml-4" />
        </div>
      ))}
    </div>
  );
}

// ── Helpers ──

const PLATFORM_BADGES: Record<string, string> = {
  zhihu: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  weibo: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  baidu: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  douyin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  bilibili: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  weixin: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  toutiao: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function PlatformBadge({ code }: { code: string }) {
  const colorClass = PLATFORM_BADGES[code] ?? PLATFORM_BADGES.default;
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colorClass}`}
    >
      {code.toUpperCase()}
    </span>
  );
}

// ── Page ──

export default function DashboardPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const result = await getDashboard();
      setData(result);
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
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <StatsSkeleton />
          <div className="space-y-3">
            <Skeleton className="h-6 w-24" />
            <TrendingSkeleton />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[40vh] text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium mb-1">{t("dashboard.loading_failed")}</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{error}</p>
          <button
            onClick={fetchDashboard}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("dashboard.retry")}
          </button>
        </div>
      </AppLayout>
    );
  }

  const { trending, today_stats, user } = data!;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t("dashboard.title", { username: user.username })}</h1>
          <p className="text-muted-foreground text-sm">{t("dashboard.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-card flex items-center gap-4">
            <div className="p-2.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {today_stats.processing}
              </div>
              <div className="text-sm text-muted-foreground">{t("dashboard.processing")}</div>
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card flex items-center gap-4">
            <div className="p-2.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {today_stats.done}
              </div>
              <div className="text-sm text-muted-foreground">{t("dashboard.completed")}</div>
            </div>
          </div>
          <div className="p-4 border rounded-lg bg-card flex items-center gap-4">
            <div className="p-2.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-3xl font-bold tabular-nums">
                {today_stats.failed}
              </div>
              <div className="text-sm text-muted-foreground">{t("dashboard.failed")}</div>
            </div>
          </div>
        </div>

        <DashboardCharts />

        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">{t("dashboard.trending")}</h2>
          </div>

          {trending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
              <TrendingUp className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">{t("dashboard.no_trending")}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t("dashboard.no_trending_desc")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {trending.map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted transition-colors group"
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3
                        ? "bg-primary/10 text-primary"
                        : "bg-muted-foreground/10 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </div>
                    <div className="mt-1">
                      <PlatformBadge code={item.platform_code} />
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-sm font-mono tabular-nums text-primary ml-2">
                    {item.hot_score.toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
