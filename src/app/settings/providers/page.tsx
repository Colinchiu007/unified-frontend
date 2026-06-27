"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { ErrorState } from "@/components/ui";
import {
  getUserProviders,
  getUserProvider,
  setUserProviderKey,
  deleteUserProviderKey,
  type ProviderConfig,
} from "@/lib/api";
import {
  Key,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />;
}

function ProviderCardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-5 border rounded-lg space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──

export default function UserProvidersPage() {
  const router = useRouter();

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-provider key state
  const [keyValues, setKeyValues] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [keyErrors, setKeyErrors] = useState<Record<string, string>>({});
  const [keySuccess, setKeySuccess] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [hasUserKey, setHasUserKey] = useState<Record<string, boolean>>({});

  // Expanded provider detail
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [providerDetail, setProviderDetail] = useState<ProviderConfig | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const data = await getUserProviders();
      setProviders(Array.isArray(data) ? data : []);
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

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSetKey(providerName: string) {
    const apiKey = keyValues[providerName]?.trim();
    if (!apiKey) {
      setKeyErrors((prev) => ({ ...prev, [providerName]: "请输入 API Key" }));
      return;
    }
    setSavingKey(providerName);
    setKeyErrors((prev) => ({ ...prev, [providerName]: "" }));
    setKeySuccess((prev) => ({ ...prev, [providerName]: "" }));
    try {
      await setUserProviderKey(providerName, apiKey);
      setKeySuccess((prev) => ({ ...prev, [providerName]: "设置成功" }));
      setHasUserKey((prev) => ({ ...prev, [providerName]: true }));
      setKeyValues((prev) => ({ ...prev, [providerName]: "" }));
      setTimeout(() => {
        setKeySuccess((prev) => ({ ...prev, [providerName]: "" }));
      }, 3000);
    } catch (err: any) {
      setKeyErrors((prev) => ({ ...prev, [providerName]: err.message ?? "设置失败" }));
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDeleteKey(providerName: string) {
    if (!window.confirm(`确定要删除「${providerName}」的自定义 API Key 吗？将恢复使用系统默认 Key。`)) return;
    setDeletingKey(providerName);
    setKeyErrors((prev) => ({ ...prev, [providerName]: "" }));
    try {
      await deleteUserProviderKey(providerName);
      setHasUserKey((prev) => ({ ...prev, [providerName]: false }));
      setKeySuccess((prev) => ({ ...prev, [providerName]: "已恢复默认 Key" }));
      setTimeout(() => {
        setKeySuccess((prev) => ({ ...prev, [providerName]: "" }));
      }, 3000);
    } catch (err: any) {
      setKeyErrors((prev) => ({ ...prev, [providerName]: err.message ?? "删除失败" }));
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleExpand(providerName: string) {
    if (expandedProvider === providerName) {
      setExpandedProvider(null);
      setProviderDetail(null);
      return;
    }
    setExpandedProvider(providerName);
    setDetailLoading(true);
    try {
      const detail = await getUserProvider(providerName);
      setProviderDetail(detail);
      // Check if user has their own key — if api_key is present and not masked
      setHasUserKey((prev) => ({ ...prev, [providerName]: !!detail.api_key && !detail.api_key.startsWith("sk-***") }));
    } catch {
      setProviderDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-64" />
          <ProviderCardSkeleton />
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Key className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Provider 配置</h1>
        </div>
        <p className="text-sm text-muted-foreground -mt-3 mb-6">
          为每个 AI 提供商设置你自己的 API Key，设置后将优先使用你的 Key 而非系统默认 Key
        </p>

        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
            <Key className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">当前没有可用的 Provider</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              你的账户暂未开放任何 AI 提供商配置
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((p) => (
              <div key={p.name} className="border rounded-lg bg-card overflow-hidden">
                {/* Card Header */}
                <button
                  onClick={() => handleExpand(p.name)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{p.display_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 space-x-2">
                        <span className="bg-muted px-1 py-0.5 rounded font-mono">{p.name}</span>
                        <span>{p.models.slice(0, 3).join(", ")}{p.models.length > 3 ? "..." : ""}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${expandedProvider === p.name ? "rotate-90" : ""}`} />
                </button>

                {/* Expanded Detail */}
                {expandedProvider === p.name && (
                  <div className="border-t px-4 py-4 space-y-4 bg-muted/10">
                    {detailLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                    ) : (
                      <>
                        {/* Provider info */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-xs text-muted-foreground">Base URL</span>
                            <div className="font-mono text-xs mt-0.5 truncate">{p.base_url}</div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">可用模型</span>
                            <div className="text-xs mt-0.5">{p.models.join(", ")}</div>
                          </div>
                        </div>

                        {/* Key status */}
                        {hasUserKey[p.name] && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            已使用自定义 Key
                          </div>
                        )}

                        {/* Success / Error messages */}
                        {keySuccess[p.name] && (
                          <div className="flex items-center gap-1.5 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {keySuccess[p.name]}
                          </div>
                        )}
                        {keyErrors[p.name] && (
                          <div className="flex items-center gap-1.5 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                            <AlertCircle className="w-3 h-3 flex-shrink-0" />
                            {keyErrors[p.name]}
                          </div>
                        )}

                        {/* Key input */}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={showKey[p.name] ? "text" : "password"}
                              value={keyValues[p.name] ?? ""}
                              onChange={(e) => {
                                setKeyValues((prev) => ({ ...prev, [p.name]: e.target.value }));
                                setKeyErrors((prev) => ({ ...prev, [p.name]: "" }));
                              }}
                              placeholder={hasUserKey[p.name] ? "输入新 Key 以覆盖..." : "输入你的 API Key..."}
                              className="w-full px-3 py-2 pr-8 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-mono"
                              onKeyDown={(e) => { if (e.key === "Enter") handleSetKey(p.name); }}
                            />
                            <button
                              onClick={() => setShowKey((prev) => ({ ...prev, [p.name]: !prev[p.name] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                            >
                              {showKey[p.name] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSetKey(p.name)}
                            disabled={savingKey === p.name || !keyValues[p.name]?.trim()}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            {savingKey === p.name ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "设置"
                            )}
                          </button>
                          {hasUserKey[p.name] && (
                            <button
                              onClick={() => handleDeleteKey(p.name)}
                              disabled={deletingKey === p.name}
                              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                              title="删除自定义 Key"
                            >
                              {deletingKey === p.name ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
                           