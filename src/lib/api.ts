/// Orchestrator API client

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    // Try to extract a human-readable message from FastAPI 422
    let message = `${res.status}: ${res.statusText}`;
    try {
      const json = JSON.parse(body);
      if (json.detail) {
        if (Array.isArray(json.detail)) {
          // FastAPI validation error: pick the first msg
          const first = json.detail[0];
          message = first.msg ?? first.message ?? message;
        } else {
          message = json.detail;
        }
      } else if (json.message) {
        message = json.message;
      }
    } catch {
      // Not JSON — use the raw body if short enough
      if (body.length < 200) message = body;
    }
    throw new Error(message);
  }
  return res.json();
}

// ─── Data Types ───

export interface DailyJobCounts {
  date: string;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface JobStatsResponse {
  daily: DailyJobCounts[];
  totals: { pending: number; processing: number; completed: number; failed: number };
}

export interface DashboardData {
  trending: {
    title: string;
    platform_code: string;
    hot_score: number;
    url: string;
  }[];
  today_stats: { processing: number; done: number; failed: number };
  user: { id: string; username: string; role: string };
}

export interface GenerateOptions {
  voices: { id: string; label: string }[];
  video_ratios: { id: string; label: string }[];
  prompt_platforms: { id: string; label: string }[];
  content_sources: {
    id: string;
    title?: string;
    source_url: string;
    word_count_original: number;
    status: string;
    created_at?: string;
  }[];
}

export interface GenerateRequest {
  article_id: string;
  voice?: string;
  video_ratio?: string;
  prompt_platform?: string;
  publish_platforms?: string[];
}

export interface JobStatus {
  id: string;
  job_type?: string;
  status: string;
  progress?: number;
  result_url?: string;
  error?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  input_data?: Record<string, unknown>;
  output_data?: Record<string, unknown>;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface ApiKey {
  id: string;
  label: string;
  key_preview: string;
  created_at: string;
  last_used_at?: string;
}

// ─── Auth ───

export function login(username: string, password: string) {
  return request<{
    access_token: string;
    refresh_token?: string;
    token_type: string;
  }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function register(data: {
  username: string;
  email?: string;
  password: string;
}) {
  return request<{ access_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Dashboard ───

export function getJobStats(days: number = 7) {
  return request<JobStatsResponse>(`/api/jobs/stats?days=${days}`);
}

export function getDashboard() {
  return request<DashboardData>("/api/v1/aggregator/dashboard");
}

// ─── Generate ───

export function getGenerateOptions() {
  return request<GenerateOptions>("/api/v1/aggregator/generate-options");
}

export function submitGenerate(data: GenerateRequest) {
  return request<{ job_id: string; status: string }>(
    "/api/v1/aggregator/generate",
    { method: "POST", body: JSON.stringify(data) },
  );
}

// ── Batch Generate ──

export interface BatchGenerateRequest {
  article_ids: string[];
  voice?: string;
  video_ratio?: string;
  prompt_platform?: string;
}

export interface BatchJobResult {
  job_id: string;
  article_id: string;
  status: string;
}

export interface BatchGenerateResponse {
  results: BatchJobResult[];
  total: number;
  missing: string[] | null;
}

export function batchGenerate(data: BatchGenerateRequest) {
  return request<BatchGenerateResponse>(
    "/api/v1/aggregator/batch-generate",
    { method: "POST", body: JSON.stringify(data) },
  );
}

// ─── Jobs ───

export function getJobs(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return request<{ items: JobStatus[]; total: number }>(`/api/jobs${qs}`);
}

export function getJobDetail(jobId: string) {
  return request<JobStatus>(`/api/jobs/${jobId}`);
}

export function retryJob(jobId: string) {
  return request<{ status: string }>(`/api/jobs/${jobId}/retry`, {
    method: "POST",
  });
}

// ─── Settings: Profile ───

export function getProfile() {
  return request<UserProfile>("/api/settings/profile");
}

export function updateProfile(data: Partial<Pick<UserProfile, "username" | "email">>) {
  return request<UserProfile>("/api/settings/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ─── Settings: API Keys ───

export function getApiKeys() {
  return request<{ items: ApiKey[] }>("/api/settings/api-keys");
}

export function createApiKey(label: string) {
  return request<{ id: string; label: string; key: string }>(
    "/api/settings/api-keys",
    { method: "POST", body: JSON.stringify({ label }) },
  );
}

export function deleteApiKey(id: string) {
  return request<void>(`/api/settings/api-keys/${id}`, { method: "DELETE" });
}

// ─── Admin: Provider Config ───

export interface ProviderConfig {
  name: string;
  provider_type: string;
  display_name: string;
  base_url: string;
  api_key?: string;
  models: string[];
  config: Record<string, unknown>;
  enabled: boolean;
  min_tier: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderRequest {
  name: string;
  provider_type: string;
  display_name: string;
  base_url: string;
  api_key: string;
  models: string[];
  config?: Record<string, unknown>;
  enabled?: boolean;
  min_tier?: number;
}

export interface UpdateProviderRequest {
  provider_type?: string;
  display_name?: string;
  base_url?: string;
  api_key?: string;
  models?: string[];
  config?: Record<string, unknown>;
  enabled?: boolean;
  min_tier?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export function getAdminProviders() {
  return request<ProviderConfig[]>("/api/admin/providers");
}

export function getAdminProvider(name: string) {
  return request<ProviderConfig>(`/api/admin/providers/${encodeURIComponent(name)}`);
}

export function createAdminProvider(data: CreateProviderRequest) {
  return request<ProviderConfig>("/api/admin/providers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminProvider(name: string, data: UpdateProviderRequest) {
  return request<ProviderConfig>(`/api/admin/providers/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAdminProvider(name: string) {
  return request<{ message: string }>(`/api/admin/providers/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export function testAdminProviderConnection(name: string) {
  return request<TestConnectionResult>(`/api/admin/providers/${encodeURIComponent(name)}/test`, {
    method: "POST",
  });
}

// ─── User: Providers ───

export function getUserProviders() {
  return request<ProviderConfig[]>("/api/user/providers");
}

export function getUserProvider(name: string) {
  return request<ProviderConfig>(`/api/user/providers/${encodeURIComponent(name)}`);
}

export function setUserProviderKey(name: string, api_key: string, base_url?: string) {
  return request<{ message: string }>(`/api/user/providers/${encodeURIComponent(name)}/key`, {
    method: "PUT",
    body: JSON.stringify({ api_key, base_url }),
  });
}

export function deleteUserProviderKey(name: string) {
  return request<{ message: string }>(`/api/user/providers/${encodeURIComponent(name)}/key`, {
    method: "DELETE",
  });
}

// ─── User: Subscription & Usage ───

export interface UserUsage {
  videos_used: number;
  videos_quota: number;
  reset_time: string;
  plan_type: string;
  date: string;
}

export interface UserSubscription {
  plan_type: string;
  features: string[];
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export function getUserUsage() {
  return request<UserUsage>("/api/user/usage");
}

export function getUserSubscription() {
  return request<UserSubscription>("/api/auth/subscription");
}


// ─── Admin: Users ───

export interface AdminUser {
  uuid: string;
  username: string;
  email: string;
  subscription_type: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUserDetail extends AdminUser {
  subscription: {
    plan_type: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    auto_renew: boolean;
  } | null;
  usage: Array<{
    date: string;
    videos_created: number;
    videos_quota: number;
  }>;
}

export function getAdminUsers(params: { page?: number; page_size?: number; subscription_type?: string; is_active?: string; search?: string }): Promise<PaginatedUsers> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.subscription_type) qs.set("subscription_type", params.subscription_type);
  if (params.is_active) qs.set("is_active", params.is_active);
  if (params.search) qs.set("search", params.search);
  const query = qs.toString();
  return request<PaginatedUsers>(`/api/admin/users${query ? "?" + query : ""}`);
}

export function getAdminUser(uuid: string): Promise<AdminUserDetail> {
  return request<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(uuid)}`);
}

export function toggleUserStatus(uuid: string, is_active: boolean): Promise<{ uuid: string; is_active: boolean }> {
  return request<{ uuid: string; is_active: boolean }>(`/api/admin/users/${encodeURIComponent(uuid)}/status`, {
    method: "PUT",
    body: JSON.stringify({ is_active }),
  });
}


// ─── Upload ───

export async function uploadFile(file: File): Promise<{
  article_id: string;
  filename: string;
  word_count: number;
  status: string;
}> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/aggregator/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload failed: ${res.status} ${body}`);
  }
  return res.json();
}

// ─── Export helpers ───

function triggerDownload(content: Blob, filename: string) {
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportArticles(format: "csv" | "json") {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}/api/articles/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  triggerDownload(blob, `articles_export.${format}`);
}

export async function exportJobs(format: "csv" | "json") {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${API_BASE}/api/jobs/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  triggerDownload(blob, `jobs_export.${format}`);
}