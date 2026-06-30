"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import { ErrorState, EmptyState } from "@/components/ui";
import {
  getAdminProviders,
  createAdminProvider,
  updateAdminProvider,
  deleteAdminProvider,
  testAdminProviderConnection,
  type ProviderConfig,
  type CreateProviderRequest,
  type UpdateProviderRequest,
  type TestConnectionResult,
} from "@/lib/api";
import {
  Plus,
  Edit3,
  Trash2,
  Play,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Shield,
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
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Type Options ──

const TYPE_OPTIONS = [
  { value: "llm", label: "LLM" },
  { value: "tts", label: "TTS" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

const TYPE_BADGE: Record<string, string> = {
  llm: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  tts: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  image: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  video: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

// ── Main Page ──

export default function AdminProvidersPage() {
  const router = useRouter();

  // Data state
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<CreateProviderRequest>({
    name: "",
    provider_type: "llm",
    display_name: "",
    base_url: "",
    api_key: "",
    models: [],
    enabled: true,
    min_tier: 1,
  });
  const [addFormModels, setAddFormModels] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit state
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateProviderRequest>({});
  const [editFormModels, setEditFormModels] = useState("");

  // Delete state
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // Test state
  const [testingName, setTestingName] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ name: string; result: TestConnectionResult } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof window !== "undefined" && !localStorage.getItem("token")) {
        router.push("/login");
        return;
      }
      const data = await getAdminProviders();
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

  // ── Add ──

  function resetAddForm() {
    setAddForm({ name: "", provider_type: "llm", display_name: "", base_url: "", api_key: "", models: [], enabled: true, min_tier: 1 });
    setAddFormModels("");
    setFormError(null);
  }

  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.display_name.trim() || !addForm.base_url.trim() || !addForm.api_key.trim()) {
      setFormError("请填写所有必填项（名称、展示名、Base URL、API Key）");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const data = { ...addForm, models: addFormModels.split(",").map((s) => s.trim()).filter(Boolean) };
      await createAdminProvider(data);
      setShowAddForm(false);
      resetAddForm();
      await fetchData();
    } catch (err: any) {
      setFormError(err.message ?? "创建失败");
    } finally {
      setSaving(false);
    }
  }

  // ── Edit ──

  function startEdit(p: ProviderConfig) {
    setEditingName(p.name);
    setEditForm({
      provider_type: p.provider_type,
      display_name: p.display_name,
      base_url: p.base_url,
      models: p.models,
      enabled: p.enabled,
      min_tier: p.min_tier,
      config: p.config,
    });
    setEditFormModels(p.models.join(", "));
    setFormError(null);
  }

  async function handleEdit(name: string) {
    setSaving(true);
    setFormError(null);
    try {
      const data: UpdateProviderRequest = { ...editForm };
      if (editFormModels) {
        data.models = editFormModels.split(",").map((s) => s.trim()).filter(Boolean);
      }
      // Remove empty api_key
      if (data.api_key === "") delete data.api_key;
      await updateAdminProvider(name, data);
      setEditingName(null);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message ?? "更新失败");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditingName(null);
    setFormError(null);
  }

  // ── Delete ──

  async function handleDelete(name: string) {
    if (!window.confirm(`确定要删除 Provider「${name}」吗？此操作不可恢复。`)) return;
    setDeletingName(name);
    try {
      await deleteAdminProvider(name);
      setProviders((prev) => prev.filter((p) => p.name !== name));
    } catch (err: any) {
      setError(err.message ?? "删除失败");
    } finally {
      setDeletingName(null);
    }
  }

  // ── Test ──

  async function handleTest(name: string) {
    setTestingName(name);
    setTestResult(null);
    try {
      const result = await testAdminProviderConnection(name);
      setTestResult({ name, result });
    } catch (err: any) {
      setTestResult({ name, result: { success: false, message: err.message ?? "测试失败" } });
    } finally {
      setTestingName(null);
    }
  }

  // ── Render ──

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-6">
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

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Provider 管理
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              管理所有 LLM / TTS / Image / Video 提供商的 API 配置
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingName(null);
              resetAddForm();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            新增 Provider
          </button>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              testResult.result.success
                ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-950/20"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            {testResult.result.success ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="flex-1">{testResult.result.message}</span>
            <button
              onClick={() => setTestResult(null)}
              className="p-0.5 rounded hover:bg-black/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Form error */}
        {formError && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {formError}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="border rounded-lg bg-card p-6 space-y-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              新增 Provider
            </h3>
            <ProviderFormFields
              data={addForm}
              models={addFormModels}
              onChange={(d) => setAddForm(d as CreateProviderRequest)}
              onModelsChange={setAddFormModels}
              showName
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 创建中...</> : "创建"}
              </button>
              <button
                onClick={() => { setShowAddForm(false); resetAddForm(); }}
                disabled={saving}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Provider Table or Empty State */}
        {providers.length === 0 && !showAddForm ? (
          <EmptyState
            icon={Server}
            title="暂无 Provider 配置"
            description="添加第一个 LLM 提供商来开始使用"
            action={{ label: "新增 Provider", onClick: () => { setShowAddForm(true); resetAddForm(); } }}
          />
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-2">名称</div>
              <div className="col-span-1">类型</div>
              <div className="col-span-2">展示名</div>
              <div className="col-span-2">Base URL</div>
              <div className="col-span-2">模型</div>
              <div className="col-span-1">Tier</div>
              <div className="col-span-1">状态</div>
              <div className="col-span-1">操作</div>
            </div>

            {/* Table Rows */}
            {providers.map((p) => (
              <div key={p.name}>
                {/* Edit form inline */}
                {editingName === p.name ? (
                  <div className="p-5 border-b space-y-4 bg-muted/20">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-primary" />
                      编辑: {p.name}
                    </h4>
                    <ProviderFormFields
                      data={editForm}
                      models={editFormModels}
                      onChange={(d) => setEditForm(d)}
                      onModelsChange={setEditFormModels}
                      showName={false}
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleEdit(p.name)}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                      >
                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : "保存"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Data row */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-3 md:px-5 py-3 md:py-3.5 border-b last:border-b-0 md:items-center text-sm hover:bg-muted/20 transition-colors">
                    <div className="col-span-2 font-medium truncate" title={p.name}>{p.name}</div>
                    <div className="col-span-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[p.provider_type] ?? "bg-gray-100 text-gray-700"}`}>
                        {p.provider_type.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-2 truncate" title={p.display_name}>{p.display_name}</div>
                    <div className="col-span-2 truncate text-muted-foreground font-mono text-xs" title={p.base_url}>{p.base_url}</div>
                    <div className="col-span-2 truncate text-xs text-muted-foreground" title={p.models.join(", ")}>
                      {p.models.slice(0, 3).join(", ")}{p.models.length > 3 ? ` +${p.models.length - 3}` : ""}
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">T{p.min_tier}</span>
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        p.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {p.enabled ? "启用" : "禁用"}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center gap-1">
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTest(p.name)}
                        disabled={testingName === p.name}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
                        title="测试连接"
                      >
                        {testingName === p.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(p.name)}
                        disabled={deletingName === p.name}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                        title="删除"
                      >
                        {deletingName === p.name ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <p className="text-xs text-muted-foreground">
          共 {providers.length} 个 Provider
          {providers.filter((p) => p.enabled).length > 0 && (
            <>，其中 {providers.filter((p) => p.enabled).length} 个已启用</>
          )}
        </p>
      </div>
    </AppLayout>
  );
}

// ── Provider Form Fields (shared between Add and Edit) ──

function ProviderFormFields({
  data,
  models,
  onChange,
  onModelsChange,
  showName,
}: {
  data: Record<string, any>;
  models: string;
  onChange: (data: Record<string, any>) => void;
  onModelsChange: (val: string) => void;
  showName: boolean;
}) {
  function set<K extends keyof typeof data>(key: K, val: (typeof data)[K]) {
    onChange({ ...data, [key]: val });
  }

  const inputClass = "w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
  const labelClass = "text-xs font-medium text-muted-foreground";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {showName && (
        <div className="space-y-1.5">
          <label className={labelClass}>名称 *</label>
          <input value={data.name ?? ""} onChange={(e) => set("name", e.target.value)} className={inputClass} placeholder="openai" />
        </div>
      )}
      <div className="space-y-1.5">
        <label className={labelClass}>类型 *</label>
        <select value={data.provider_type ?? "llm"} onChange={(e) => set("provider_type", e.target.value)} className={inputClass}>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>展示名 *</label>
        <input value={data.display_name ?? ""} onChange={(e) => set("display_name", e.target.value)} className={inputClass} placeholder="OpenAI GPT-4o" />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Base URL *</label>
        <input value={data.base_url ?? ""} onChange={(e) => set("base_url", e.target.value)} className={inputClass} placeholder="https://api.openai.com/v1" />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>API Key {showName ? "*" : "(留空不修改)"}</label>
        <input type="password" value={data.api_key ?? ""} onChange={(e) => set("api_key", e.target.value)} className={inputClass} placeholder="sk-..." />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>模型列表（逗号分隔）</label>
        <input value={models} onChange={(e) => onModelsChange(e.target.value)} className={inputClass} placeholder="gpt-4o, gpt-4o-mini" />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>最低可用 Tier</label>
        <input type="number" min={1} max={5} value={data.min_tier ?? 1} onChange={(e) => set("min_tier", parseInt(e.target.value) || 1)} className={inputClass} />
      </div>
      <div className="space-y-1.5 flex items-end pb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={data.enabled ?? true} onChange={(e) => set("enabled", e.target.checked)} className="rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm">启用</span>
        </label>
      </div>
    </div>
  );
}
