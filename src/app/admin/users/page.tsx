"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { ErrorState, EmptyState } from "@/components/ui";
import {
  getAdminUsers,
  getAdminUser,
  toggleUserStatus,
  type PaginatedUsers,
  type AdminUserDetail,
} from "@/lib/api";
import {
  Users,
  Search,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

// ── Plan Badge Colors ──

const PLAN_BADGE: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pro: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// ── Main Page ──

export default function AdminUsersPage() {
  const router = useRouter();

  // Data state
  const [pageData, setPageData] = useState<PaginatedUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [subscriptionFilter, setSubscriptionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Detail modal
  const [detailUuid, setDetailUuid] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Toggle state
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const params: Record<string, any> = { page, page_size: 20 };
      if (subscriptionFilter) params.subscription_type = subscriptionFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await getAdminUsers(params);
      setPageData(data);
    } catch (err: any) {
      if (err.message?.startsWith("401") || err.message?.startsWith("403")) {
        router.push("/login");
        return;
      }
      setError(err.message ?? "加载失败");
    } finally {
      setLoading(false);
    }
  }, [router, page, subscriptionFilter, searchQuery]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Detail Modal ──

  async function openDetail(uuid: string) {
    setDetailUuid(uuid);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);
    try {
      const data = await getAdminUser(uuid);
      setDetailData(data);
    } catch (err: any) {
      setDetailError(err.message ?? "加载用户详情失败");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailUuid(null);
    setDetailData(null);
    setDetailError(null);
  }

  // ── Toggle Status ──

  async function handleToggle(uuid: string, currentActive: boolean) {
    setTogglingUuid(uuid);
    setToggleError(null);
    try {
      await toggleUserStatus(uuid, !currentActive);
      await fetchData();
      // Refresh detail if open
      if (detailUuid === uuid) {
        await openDetail(uuid);
      }
    } catch (err: any) {
      setToggleError(err.message ?? "操作失败");
    } finally {
      setTogglingUuid(null);
    }
  }

  // ── Search ──

  function handleSearch() {
    setPage(1);
    setSearchQuery(searchInput.trim());
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function clearSearch() {
    setSearchInput("");
    setSearchQuery("");
    setPage(1);
  }

  // ── Render ──

  if (loading && !pageData) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
          <TableSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorState message={error} onRetry={fetchData} />
      </AppLayout>
    );
  }

  const users = pageData?.users ?? [];
  const total = pageData?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              用户管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              查看和管理所有注册用户
            </p>
          </div>
        </div>

        {/* Toggle error banner */}
        {toggleError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {toggleError}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-sm">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="搜索用户名或邮箱..."
                className="w-full pl-9 pr-8 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              搜索
            </button>
          </div>

          {/* Subscription filter */}
          <select
            value={subscriptionFilter}
            onChange={(e) => { setSubscriptionFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">全部套餐</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        {/* User list or Empty State */}
        {users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="暂无用户"
            description={searchQuery || subscriptionFilter ? "没有匹配的用户，试试其他搜索条件" : "还没有注册用户"}
          />
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-3">用户名</div>
              <div className="col-span-3">邮箱</div>
              <div className="col-span-2">套餐</div>
              <div className="col-span-2">状态</div>
              <div className="col-span-2">注册时间</div>
            </div>

            {/* Table Rows */}
            {users.map((u) => (
              <div
                key={u.uuid}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b last:border-b-0 items-center text-sm hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => openDetail(u.uuid)}
              >
                <div className="col-span-3 font-medium truncate" title={u.username}>{u.username}</div>
                <div className="col-span-3 truncate text-muted-foreground" title={u.email}>{u.email}</div>
                <div className="col-span-2">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_BADGE[u.subscription_type] ?? "bg-gray-100 text-gray-700"}`}>
                    {u.subscription_type.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggle(u.uuid, u.is_active)}
                      disabled={togglingUuid === u.uuid}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        u.is_active ? "bg-green-500" : "bg-gray-300"
                      } disabled:opacity-50`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          u.is_active ? "translate-x-[18px]" : "translate-x-[2px]"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium ${u.is_active ? "text-green-600" : "text-muted-foreground"}`}>
                      {togglingUuid === u.uuid ? "..." : (u.is_active ? "正常" : "已禁用")}
                    </span>
                  </label>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString("zh-CN") : "-"}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              共 {total} 个用户，第 {page}/{totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border rounded-md text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border rounded-md text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* Summary */}
        {users.length > 0 && (
          <p className="text-xs text-muted-foreground">
            共 {total} 个用户
          </p>
        )}

        {/* ── Detail Modal ── */}
        {detailUuid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeDetail}>
            <div className="bg-background rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-lg font-semibold">用户详情</h2>
                <button onClick={closeDetail} className="p-1 rounded-md hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-5">
                {detailLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {detailError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {detailError}
                  </div>
                )}

                {detailData && !detailLoading && (
                  <>
                    {/* User Info */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">基本信息</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">UUID:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{detailData.uuid}</code></div>
                        <div><span className="text-muted-foreground">用户名:</span> {detailData.username}</div>
                        <div><span className="text-muted-foreground">邮箱:</span> {detailData.email}</div>
                        <div>
                          <span className="text-muted-foreground">状态:</span>{" "}
                          <span className={detailData.is_active ? "text-green-600" : "text-red-600"}>
                            {detailData.is_active ? "正常" : "已禁用"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">套餐:</span>{" "}
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${PLAN_BADGE[detailData.subscription_type] ?? ""}`}>
                            {detailData.subscription_type.toUpperCase()}
                          </span>
                        </div>
                        <div><span className="text-muted-foreground">注册时间:</span> {detailData.created_at ? new Date(detailData.created_at).toLocaleString("zh-CN") : "-"}</div>
                      </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">订阅信息</h3>
                      {detailData.subscription ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">套餐:</span> {detailData.subscription.plan_type}</div>
                          <div><span className="text-muted-foreground">状态:</span> {detailData.subscription.status}</div>
                          <div><span className="text-muted-foreground">开始:</span> {detailData.subscription.start_date ? new Date(detailData.subscription.start_date).toLocaleDateString("zh-CN") : "-"}</div>
                          <div><span className="text-muted-foreground">结束:</span> {detailData.subscription.end_date ? new Date(detailData.subscription.end_date).toLocaleDateString("zh-CN") : "永久"}</div>
                          <div><span className="text-muted-foreground">自动续费:</span> {detailData.subscription.auto_renew ? "是" : "否"}</div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">暂无订阅信息</p>
                      )}
                    </div>

                    {/* Usage History */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">用量历史 (近30天)</h3>
                      {detailData.usage.length > 0 ? (
                        <div className="space-y-2">
                          {detailData.usage.map((u, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-b-0">
                              <span className="text-muted-foreground">{u.date}</span>
                              <span>
                                <span className={u.videos_created >= u.videos_quota ? "text-red-600 font-medium" : ""}>
                                  {u.videos_created}
                                </span>
                                {" / "}{u.videos_quota} 条
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">暂无用量记录</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
