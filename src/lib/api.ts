/// Orchestrator API client

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

// ─── Data Types ───

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
  email: string;
  password: string;
}) {
  return request<{ access_token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Dashboard ───

export function getDashboard() {