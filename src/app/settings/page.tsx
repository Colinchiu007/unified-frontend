"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import {
  getProfile,
  updateProfile,
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getUserUsage,
  getUserSubscription,
  type UserProfile,
  type ApiKey,
  type UserUsage,
  type UserSubscription,
} from "@/lib/api";
import {
  User,
  Key,
  Shield,
  Mail,
  Clock,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Server,
  Globe,
} from "lucide-react";
import { ErrorState } from "@/components/ui";

// ── Skeleton ──

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-md ${className ?? ""}`} />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-6 border rounded-lg">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

// ── Copy Button ──

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      title="复制"
    >
      {copied ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ── Main Page ──

export default function SettingsPage() {
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // API keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState<string | null>(null);

  // Subscription & usage state
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const p = await getProfile();
      setProfile(p);
      setEditUsername(p.username);
      setEditEmail(p.email);
    } catch (err: any) {
      if (err.message?.startsWith("401")) {
        router.push("/login");
        return;
      }
      setProfileError(err.message ?? "加载失败");
    } finally {
      setProfileLoading(false);
    }
  }, [router]);

  const fetchApiKeys = useCallback(async () => {
    setKeysLoading(true);
    setKeysError(null);
    try {
      const result = await getApiKeys();
      setApiKeys(result.items);
    } catch (err: any) {
      setKeysError(err.message ?? "加载失败");
    } finally {
      setKeysLoading(false);
    }
  }, []);

  const fetchSubscriptionData = useCallback(async () => {
    setSubLoading(true);
    try {
      const [usageData, subData] = await Promise.all([
        getUserUsage(),
        getUserSubscription(),
      ]);
      setUsage(usageData);
      setSubscription(subData);
    } catch {
      // Non-critical — user may not have subscription data
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchApiKeys();
    fetchSubscriptionData();
  }, [fetchProfile, fetchApiKeys, fetchSubscriptionData]);

  async function handleSaveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaved(false);
    try {
      const updated = await updateProfile({
        username: editUsername,
        email: editEmail,
      });
      setProfile(updated);
      setEditing(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileSaveError(err.message ?? "保存失败");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateKey() {
    if (!newKeyLabel.trim()) return;
    setCreatingKey(true);
    try {
      const result = await createApiKey(newKeyLabel.trim());
      setNewlyCreatedKey(result.key);
      setNewKeyLabel("");
      setShowNewKeyForm(false);
      // Refresh the list
      await fetchApiKeys();
    } catch (err: any) {
      setKeysError(err.message ?? "创建失败");
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleDeleteKey(id: string) {
    setDeletingKey(id);
    try {
      await deleteApiKey(id);
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      setKeysError(err.message ?? "删除失败");
    } finally {
      setDeletingKey(null);
    }
  }

  function formatDate(dateStr?: string): string {
    if (!dateStr) return "--";
    try {
      return new Date(dateStr).toLocaleString("zh-CN");
    } catch {
      return dateStr;
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold">设置</h1>

        {/* ── Profile Section ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">用户信息</h2>
          </div>

          {profileLoading ? (
            <ProfileSkeleton />
          ) : profileError ? (
            <ErrorState message={profileError} onRetry={fetchProfile} />
          ) : !profile ? null : (
            <div className="border rounded-lg bg-card p-6 space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  用户名
                </label>
                {editing ? (
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 border rounded-md bg-muted/30 text-sm">
                    {profile.username}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="w-3 h-3" />
                  邮箱
                </label>
                {editing ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                ) : (
                  <div className="px-3 py-2 border rounded-md bg-muted/30 text-sm">
                    {profile.email || "未设置"}
                  </div>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  角色
                </label>
                <div className="px-3 py-2 border rounded-md bg-muted/30 text-sm">
                  {profile.role === "admin"
                    ? "管理员"
                    : profile.role === "user"
                      ? "普通用户"
                      : profile.role}
                </div>
              </div>

              {/* Created at */}
              {profile.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  注册时间: {formatDate(profile.created_at)}
                </div>
              )}

              {/* Save feedback */}
              {profileSaved && (
                <div className="flex items-center gap-1.5 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  已保存
                </div>
              )}
              {profileSaveError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {profileSaveError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {editing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          保存中...
                        </>
                      ) : (
                        "保存"
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditUsername(profile.username);
                        setEditEmail(profile.email);
                        setProfileSaveError(null);
                      }}
                      className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                  >
                    编辑
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ── Subscription & Usage Section ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
            <h2 className="text-lg font-semibold">订阅与用量</h2>
          </div>

          {subLoading ? (
            <div className="border rounded-lg bg-card p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg bg-card p-6 space-y-5">
              {/* Plan Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">当前套餐</p>
                  <p className="text-lg font-semibold mt-0.5">
                    {subscription
                      ? subscription.plan_type === "free"
                        ? "免费版"
                        : subscription.plan_type === "premium"
                          ? "高级版"
                          : subscription.plan_type === "pro"
                            ? "专业版"
                            : subscription.plan_type
                      : "免费版"}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    usage && usage.videos_quota > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {usage?.plan_type === "free" ? "免费用户" : "已订阅"}
                </span>
              </div>

              {/* Quota Ring — simplified progress bar */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">今日视频生成配额</span>
                    <span className="font-medium">
                      {usage.videos_used} / {usage.videos_quota}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usage.videos_quota > 0 && usage.videos_used / usage.videos_quota >= 0.9
                          ? "bg-orange-500"
                          : usage.videos_quota > 0 && usage.videos_used / usage.videos_quota >= 1
                            ? "bg-red-500"
                            : "bg-primary"
                      }`}
                      style={{
                        width:
                          usage.videos_quota > 0
                            ? `${Math.min((usage.videos_used / usage.videos_quota) * 100, 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    配额重置时间: {usage.reset_time ? new Date(usage.reset_time).toLocaleString("zh-CN") : "--"}
                  </p>
                </div>
              )}

              {/* Features */}
              {subscription && subscription.features.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">包含功能</p>
                  <ul className="space-y-1">
                    {subscription.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subscription dates */}
              {subscription?.start_date && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {subscription.end_date
                    ? `订阅期: ${new Date(subscription.start_date).toLocaleDateString("zh-CN")} - ${new Date(subscription.end_date).toLocaleDateString("zh-CN")}`
                    : `订阅开始: ${new Date(subscription.start_date).toLocaleDateString("zh-CN")}`}
                  {subscription.status === "active" && (
                    <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      活跃
                    </span>
                  )}
                </div>
              )}

              {/* Upgrade CTA */}
              {(!usage || usage.plan_type === "free") && (
                <button className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                  升级套餐 — 解锁更多视频配额
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Server Config Section ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">服务器配置</h2>
          </div>

          <div className="border rounded-lg bg-card p-6 space-y-4">
            {/* API URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Orchestrator API 地址
              </label>
              <input
                value={process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
                readOnly
                disabled
                className="w-full px-3 py-2 border rounded-md bg-muted/30 text-sm text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground/60">
                前端通过此地址与后端 orchestrator 通信
              </p>
            </div>

            {/* Connection Status - Mock */}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 font-medium">连接正常</span>
              <span className="text-muted-foreground text-xs ml-1">
                (延迟 12ms)
              </span>
            </div>

            {/* API Version - Mock */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                API 版本
              </label>
              <div className="px-3 py-2 border rounded-md bg-muted/30 text-sm">
                v1.0.0
              </div>
            </div>
          </div>
        </section>

        {/* ── API Keys Section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">API Key 管理</h2>
            </div>
            <button
              onClick={() => {
                setShowNewKeyForm(true);
                setNewlyCreatedKey(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              新建 Key
            </button>
          </div>

          {/* Newly created key — show once */}
          {newlyCreatedKey && (
            <div className="mb-4 p-4 border border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 className="w-4 h-4" />
                Key 创建成功
              </div>
              <p className="text-xs text-muted-foreground">
                请立即复制此 Key，关闭后将无法再次查看
              </p>
              <div className="flex items-center gap-2 p-2 bg-background border rounded-md">
                <code className="flex-1 text-xs font-mono break-all select-all">
                  {newlyCreatedKey}
                </code>
                <CopyButton text={newlyCreatedKey} />
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                关闭
              </button>
            </div>
          )}

          {/* New key form */}
          {showNewKeyForm && !newlyCreatedKey && (
            <div className="mb-4 p-4 border rounded-lg bg-card space-y-3">
              <label className="text-sm font-medium">标签</label>
              <input
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
                placeholder="例如: 开发环境, CI/CD"
                className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateKey();
                  if (e.key === "Escape") setShowNewKeyForm(false);
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateKey}
                  disabled={!newKeyLabel.trim() || creatingKey}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                >
                  {creatingKey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    "创建"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyForm(false);
                    setNewKeyLabel("");
                  }}
                  className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Key list */}
          {keysLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          ) : keysError ? (
            <ErrorState message={keysError} onRetry={fetchApiKeys} />
          ) : apiKeys.length === 0 && !showNewKeyForm ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card">
              <Key className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">暂无 API Key</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                创建 Key 用于第三方服务集成
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((key) => {
                const isShowing = showKey[key.id] ?? false;
                return (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-card"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{key.label}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <code className="text-xs font-mono text-muted-foreground">
                          {isShowing
                            ? key.key_preview
                            : `${key.key_preview.slice(0, 8)}...${key.key_preview.slice(-4)}`}
                        </code>
                        <button
                          onClick={() =>
                            setShowKey((prev) => ({
                              ...prev,
                              [key.id]: !isShowing,
                            }))
                          }
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                        >
                          {isShowing ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          创建于 {formatDate(key.created_at)}
                        </span>
                        {key.last_used_at && (
                          <span>
                            最近使用 {formatDate(key.last_used_at)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      disabled={deletingKey === key.id}
                      className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                      title="删除"
                    >
                      {deletingKey === key.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
