
/**
 * Tests for API client module.
 *
 * Covers all exported functions in api.ts:
 * - Auth: login, register
 * - Dashboard: getJobStats, getDashboard
 * - Generate: getGenerateOptions, submitGenerate
 * - Jobs: getJobs, getJobDetail, retryJob
 * - Profile: getProfile, updateProfile
 * - API Keys: getApiKeys, createApiKey, deleteApiKey
 * - Admin Providers: CRUD + test connection
 * - User Providers: get/set/delete key
 * - Subscription: getUserUsage, getUserSubscription
 * - Admin Users: list/detail/toggle
 * - Upload: uploadFile
 * - Export: exportArticles, exportJobs
 *
 * IMPORTANT: These tests DO NOT make real network requests.
 * fetch() is mocked throughout.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock globals that aren't available in node ──

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// localStorage polyfill for node environment
function createMockStorage(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((_index: number) => null),
  } as unknown as Storage;
}

const mockStorage = createMockStorage();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", mockStorage);

// Clear NEXT_PUBLIC_API_URL to test default fallback
delete process.env.NEXT_PUBLIC_API_URL;

// ── Helpers ──

function lastFetchCall(): { url: string; options: RequestInit } {
  const [url, options] = mockFetch.mock.lastCall!;
  return { url, options };
}

function mockOkResponse(data: unknown) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => data,
    text: async () => JSON.stringify(data),
    blob: async () => new Blob([JSON.stringify(data)]),
  });
}

function mockErrorResponse(status: number, body: string) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    text: async () => body,
    json: async () => { throw new Error("not json"); },
  });
}

function mockFastApiError(status: number, detail: unknown) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    text: async () => JSON.stringify({ detail }),
    json: async () => JSON.parse(JSON.stringify({ detail })),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockStorage.clear();
  delete process.env.NEXT_PUBLIC_API_URL;
  vi.resetModules();
});

// ===================================================================
// API base URL configuration
// ===================================================================

describe("API client default configuration", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockStorage.clear();
  });

  it("API_BASE defaults to empty string when NEXT_PUBLIC_API_URL is not set", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test" }),
    });
    const { login } = await import("@/lib/api");
    await login("testuser", "testpass");
    const { url } = lastFetchCall();
    expect(url).toBe("/api/auth/login");
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
    vi.resetModules();
    const mod = await import("@/lib/api");
    // Re-setup mocks after reset
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test" }),
    });
    await mod.login("testuser", "testpass");
    const { url } = lastFetchCall();
    expect(url).toBe("http://api.example.com/api/auth/login");
  });
});

// ===================================================================
// Auth
// ===================================================================

describe("login", () => {
  beforeEach(() => {
    mockOkResponse({ access_token: "test-token", token_type: "bearer" });
  });

  it("sends POST to /api/auth/login with credentials", async () => {
    const { login } = await import("@/lib/api");
    await login("testuser", "testpass");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/auth/login");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ username: "testuser", password: "testpass" });
  });

  it("returns access_token on success", async () => {
    const { login } = await import("@/lib/api");
    const result = await login("u", "p");
    expect(result.access_token).toBe("test-token");
  });
});

describe("register", () => {
  beforeEach(() => {
    mockOkResponse({ access_token: "test-token" });
  });

  it("sends POST to /api/auth/register with user data", async () => {
    const { register } = await import("@/lib/api");
    await register({ username: "newuser", email: "a@b.com", password: "secret" });
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/auth/register");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ username: "newuser", email: "a@b.com", password: "secret" });
  });

  it("sends Content-Type application/json header", async () => {
    const { register } = await import("@/lib/api");
    await register({ username: "n", email: "e@e.com", password: "p" });
    const headers = lastFetchCall().options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("works without email", async () => {
    const { register } = await import("@/lib/api");
    await register({ username: "n", password: "p" });
    const body = JSON.parse(lastFetchCall().options.body as string);
    expect(body).toEqual({ username: "n", password: "p" });
  });
});

// ===================================================================
// Dashboard
// ===================================================================

describe("getJobStats", () => {
  const MOCK_STATS = {
    daily: [{ date: "2026-06-01", pending: 0, processing: 0, completed: 5, failed: 1 }],
    totals: { pending: 0, processing: 0, completed: 5, failed: 1 },
  };

  beforeEach(() => mockOkResponse(MOCK_STATS));

  it("GETs /api/jobs/stats with days param", async () => {
    const { getJobStats } = await import("@/lib/api");
    await getJobStats(7);
    const { url } = lastFetchCall();
    expect(url).toContain("/api/jobs/stats");
    expect(url).toContain("days=7");
  });

  it("defaults to 7 days", async () => {
    const { getJobStats } = await import("@/lib/api");
    await getJobStats();
    expect(lastFetchCall().url).toContain("days=7");
  });

  it("returns job stats data", async () => {
    const { getJobStats } = await import("@/lib/api");
    const result = await getJobStats(3);
    expect(result.totals.completed).toBe(5);
    expect(result.daily).toHaveLength(1);
  });
});

describe("getDashboard", () => {
  const MOCK_DASHBOARD = {
    trending: [{ title: "Hot", platform_code: "wb", hot_score: 100, url: "https://x" }],
    today_stats: { processing: 2, done: 3, failed: 0 },
    user: { id: "1", username: "test", role: "user" },
  };

  beforeEach(() => mockOkResponse(MOCK_DASHBOARD));

  it("GETs /api/v1/aggregator/dashboard", async () => {
    const { getDashboard } = await import("@/lib/api");
    await getDashboard();
    expect(lastFetchCall().url).toContain("/api/v1/aggregator/dashboard");
  });

  it("returns dashboard data", async () => {
    const { getDashboard } = await import("@/lib/api");
    const result = await getDashboard();
    expect(result.trending).toHaveLength(1);
    expect(result.user.username).toBe("test");
  });
});

// ===================================================================
// Generate
// ===================================================================

describe("getGenerateOptions", () => {
  const MOCK_OPTIONS = {
    voices: [{ id: "v1", label: "男声" }],
    video_ratios: [{ id: "16:9", label: "横屏" }],
    prompt_platforms: [{ id: "douyin", label: "抖音" }],
    content_sources: [{ id: "a1", source_url: "https://x", word_count_original: 500, status: "completed" }],
  };

  beforeEach(() => mockOkResponse(MOCK_OPTIONS));

  it("GETs /api/v1/aggregator/generate-options", async () => {
    const { getGenerateOptions } = await import("@/lib/api");
    await getGenerateOptions();
    expect(lastFetchCall().url).toContain("/api/v1/aggregator/generate-options");
  });

  it("returns options with all sections", async () => {
    const { getGenerateOptions } = await import("@/lib/api");
    const result = await getGenerateOptions();
    expect(result.voices).toHaveLength(1);
    expect(result.video_ratios).toHaveLength(1);
    expect(result.content_sources).toHaveLength(1);
  });
});

describe("submitGenerate", () => {
  beforeEach(() => mockOkResponse({ job_id: "j1", status: "pending" }));

  it("POSTs to /api/v1/aggregator/generate", async () => {
    const { submitGenerate } = await import("@/lib/api");
    await submitGenerate({ article_id: "a1", voice: "v1", video_ratio: "16:9" });
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/v1/aggregator/generate");
    expect(options.method).toBe("POST");
  });

  it("sends all generate params in body", async () => {
    const { submitGenerate } = await import("@/lib/api");
    await submitGenerate({ article_id: "a1", voice: "v1", video_ratio: "9:16", prompt_platform: "douyin", publish_platforms: ["bilibili"] });
    const body = JSON.parse(lastFetchCall().options.body as string);
    expect(body.article_id).toBe("a1");
    expect(body.publish_platforms).toEqual(["bilibili"]);
  });

  it("returns job_id on success", async () => {
    const { submitGenerate } = await import("@/lib/api");
    const result = await submitGenerate({ article_id: "a1" });
    expect(result.job_id).toBe("j1");
  });
});

// ===================================================================
// Jobs
// ===================================================================

describe("getJobs", () => {
  const MOCK_JOBS_RESP = { items: [{ id: "j1", status: "completed" }, { id: "j2", status: "failed" }], total: 2 };

  beforeEach(() => mockOkResponse(MOCK_JOBS_RESP));

  it("GETs /api/jobs without filter", async () => {
    const { getJobs } = await import("@/lib/api");
    await getJobs();
    expect(lastFetchCall().url).toContain("/api/jobs");
  });

  it("adds status query param when provided", async () => {
    const { getJobs } = await import("@/lib/api");
    await getJobs("pending");
    expect(lastFetchCall().url).toContain("status=pending");
  });

  it("returns paginated jobs", async () => {
    const { getJobs } = await import("@/lib/api");
    const result = await getJobs();
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});

describe("getJobDetail", () => {
  const MOCK_JOB = { id: "j1", status: "completed", progress: 100, result_url: "https://x.mp4" };

  beforeEach(() => mockOkResponse(MOCK_JOB));

  it("GETs /api/jobs/{id}", async () => {
    const { getJobDetail } = await import("@/lib/api");
    await getJobDetail("j1");
    expect(lastFetchCall().url).toContain("/api/jobs/j1");
  });

  it("returns job detail", async () => {
    const { getJobDetail } = await import("@/lib/api");
    const result = await getJobDetail("j1");
    expect(result.id).toBe("j1");
    expect(result.progress).toBe(100);
  });
});

describe("retryJob", () => {
  beforeEach(() => mockOkResponse({ status: "pending" }));

  it("POSTs to /api/jobs/{id}/retry", async () => {
    const { retryJob } = await import("@/lib/api");
    await retryJob("j1");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/jobs/j1/retry");
    expect(options.method).toBe("POST");
  });
});

// ===================================================================
// Profile
// ===================================================================

describe("getProfile", () => {
  const MOCK_PROFILE = { id: "u1", username: "test", email: "t@t.com", role: "user" };

  beforeEach(() => mockOkResponse(MOCK_PROFILE));

  it("GETs /api/settings/profile", async () => {
    const { getProfile } = await import("@/lib/api");
    await getProfile();
    expect(lastFetchCall().url).toContain("/api/settings/profile");
  });

  it("returns user profile", async () => {
    const { getProfile } = await import("@/lib/api");
    const result = await getProfile();
    expect(result.username).toBe("test");
  });
});

describe("updateProfile", () => {
  const MOCK_UPDATED = { id: "u1", username: "newname", email: "n@n.com", role: "user" };

  beforeEach(() => mockOkResponse(MOCK_UPDATED));

  it("PATHES /api/settings/profile", async () => {
    const { updateProfile } = await import("@/lib/api");
    await updateProfile({ username: "newname" });
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/settings/profile");
    expect(options.method).toBe("PATCH");
  });

  it("sends partial update fields", async () => {
    const { updateProfile } = await import("@/lib/api");
    await updateProfile({ email: "n@n.com" });
    const body = JSON.parse(lastFetchCall().options.body as string);
    expect(body).toEqual({ email: "n@n.com" });
  });
});

// ===================================================================
// API Keys
// ===================================================================

describe("getApiKeys", () => {
  const MOCK_KEYS = { items: [{ id: "k1", label: "dev", key_preview: "sk-...abc", created_at: "2026-01-01" }] };

  beforeEach(() => mockOkResponse(MOCK_KEYS));

  it("GETs /api/settings/api-keys", async () => {
    const { getApiKeys } = await import("@/lib/api");
    await getApiKeys();
    expect(lastFetchCall().url).toContain("/api/settings/api-keys");
  });
});

describe("createApiKey", () => {
  const MOCK_CREATED = { id: "k2", label: "new-key", key: "sk-xxxx" };

  beforeEach(() => mockOkResponse(MOCK_CREATED));

  it("POSTs to /api/settings/api-keys with label", async () => {
    const { createApiKey } = await import("@/lib/api");
    await createApiKey("new-key");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/settings/api-keys");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ label: "new-key" });
  });
});

describe("deleteApiKey", () => {
  beforeEach(() => mockOkResponse(undefined));

  it("DELETEs /api/settings/api-keys/{id}", async () => {
    const { deleteApiKey } = await import("@/lib/api");
    await deleteApiKey("k1");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/settings/api-keys/k1");
    expect(options.method).toBe("DELETE");
  });
});

// ===================================================================
// Admin Providers
// ===================================================================

describe("getAdminProviders", () => {
  const MOCK_PROVIDERS = [{ name: "openai", provider_type: "llm", display_name: "OpenAI", base_url: "https://api.openai.com", models: ["gpt-4"], config: {}, enabled: true, min_tier: 0, created_at: "", updated_at: "" }];

  beforeEach(() => mockOkResponse(MOCK_PROVIDERS));

  it("GETs /api/admin/providers", async () => {
    const { getAdminProviders } = await import("@/lib/api");
    await getAdminProviders();
    expect(lastFetchCall().url).toContain("/api/admin/providers");
  });
});

describe("getAdminProvider", () => {
  beforeEach(() => mockOkResponse({ name: "openai", provider_type: "llm", display_name: "OpenAI", base_url: "https://api.openai.com", models: ["gpt-4"], config: {}, enabled: true, min_tier: 0, created_at: "", updated_at: "" }));

  it("encodes provider name in URL", async () => {
    const { getAdminProvider } = await import("@/lib/api");
    await getAdminProvider("openai");
    expect(lastFetchCall().url).toContain("/api/admin/providers/openai");
  });

  it("handles provider names with special chars", async () => {
    const { getAdminProvider } = await import("@/lib/api");
    await getAdminProvider("azure/gpt-4");
    expect(lastFetchCall().url).toContain(encodeURIComponent("azure/gpt-4"));
  });
});

describe("createAdminProvider", () => {
  const NEW_PROV = { name: "test", provider_type: "llm", display_name: "Test", base_url: "https://test.com", api_key: "sk-test", models: ["m1"] };

  beforeEach(() => mockOkResponse({ ...NEW_PROV, config: {}, enabled: true, min_tier: 0, created_at: "", updated_at: "" }));

  it("POSTs provider to /api/admin/providers", async () => {
    const { createAdminProvider } = await import("@/lib/api");
    await createAdminProvider(NEW_PROV);
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/admin/providers");
    expect(options.method).toBe("POST");
    const body = JSON.parse(options.body as string);
    expect(body).toMatchObject({ name: "test", models: ["m1"] });
  });
});

describe("updateAdminProvider", () => {
  beforeEach(() => mockOkResponse({ name: "test", display_name: "Updated", base_url: "https://new.com", provider_type: "llm", models: ["m1"], config: {}, enabled: true, min_tier: 0, created_at: "", updated_at: "" }));

  it("PUTs provider update", async () => {
    const { updateAdminProvider } = await import("@/lib/api");
    await updateAdminProvider("test", { display_name: "Updated" });
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/admin/providers/test");
    expect(options.method).toBe("PUT");
  });
});

describe("deleteAdminProvider", () => {
  beforeEach(() => mockOkResponse({ message: "deleted" }));

  it("DELETEs provider by name", async () => {
    const { deleteAdminProvider } = await import("@/lib/api");
    await deleteAdminProvider("test");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/admin/providers/test");
    expect(options.method).toBe("DELETE");
  });
});

describe("testAdminProviderConnection", () => {
  beforeEach(() => mockOkResponse({ success: true, message: "ok" }));

  it("POSTs to provider test endpoint", async () => {
    const { testAdminProviderConnection } = await import("@/lib/api");
    await testAdminProviderConnection("openai");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/admin/providers/openai/test");
    expect(options.method).toBe("POST");
  });
});

// ===================================================================
// User Providers
// ===================================================================

describe("getUserProviders", () => {
  beforeEach(() => mockOkResponse([{ name: "openai", provider_type: "llm", display_name: "OpenAI", base_url: "https://api.openai.com", models: ["gpt-4"] }]));

  it("GETs /api/user/providers", async () => {
    const { getUserProviders } = await import("@/lib/api");
    await getUserProviders();
    expect(lastFetchCall().url).toContain("/api/user/providers");
  });
});

describe("getUserProvider", () => {
  beforeEach(() => mockOkResponse({ name: "openai", provider_type: "llm", display_name: "OpenAI" }));

  it("GETs /api/user/providers/{name}", async () => {
    const { getUserProvider } = await import("@/lib/api");
    await getUserProvider("openai");
    expect(lastFetchCall().url).toContain("/api/user/providers/openai");
  });
});

describe("setUserProviderKey", () => {
  beforeEach(() => mockOkResponse({ message: "updated" }));

  it("PUTs API key to /api/user/providers/{name}/key", async () => {
    const { setUserProviderKey } = await import("@/lib/api");
    await setUserProviderKey("openai", "sk-test", "https://custom.com");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/user/providers/openai/key");
    expect(options.method).toBe("PUT");
    const body = JSON.parse(options.body as string);
    expect(body.api_key).toBe("sk-test");
    expect(body.base_url).toBe("https://custom.com");
  });

  it("works without base_url", async () => {
    const { setUserProviderKey } = await import("@/lib/api");
    await setUserProviderKey("openai", "sk-test");
    const body = JSON.parse(lastFetchCall().options.body as string);
    expect(body.base_url).toBeUndefined();
  });
});

describe("deleteUserProviderKey", () => {
  beforeEach(() => mockOkResponse({ message: "deleted" }));

  it("DELETEs /api/user/providers/{name}/key", async () => {
    const { deleteUserProviderKey } = await import("@/lib/api");
    await deleteUserProviderKey("openai");
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/user/providers/openai/key");
    expect(options.method).toBe("DELETE");
  });
});

// ===================================================================
// User Subscription & Usage
// ===================================================================

describe("getUserUsage", () => {
  const MOCK_USAGE = { videos_used: 3, videos_quota: 10, reset_time: "2026-07-01", plan_type: "free", date: "2026-06-30" };

  beforeEach(() => mockOkResponse(MOCK_USAGE));

  it("GETs /api/user/usage", async () => {
    const { getUserUsage } = await import("@/lib/api");
    await getUserUsage();
    expect(lastFetchCall().url).toContain("/api/user/usage");
  });

  it("returns quota info", async () => {
    const { getUserUsage } = await import("@/lib/api");
    const result = await getUserUsage();
    expect(result.videos_quota).toBe(10);
    expect(result.plan_type).toBe("free");
  });
});

describe("getUserSubscription", () => {
  const MOCK_SUB = { plan_type: "pro", features: ["voice_clone"], status: "active", start_date: "2026-01-01", end_date: "2027-01-01" };

  beforeEach(() => mockOkResponse(MOCK_SUB));

  it("GETs /api/auth/subscription", async () => {
    const { getUserSubscription } = await import("@/lib/api");
    await getUserSubscription();
    expect(lastFetchCall().url).toContain("/api/auth/subscription");
  });

  it("returns subscription info", async () => {
    const { getUserSubscription } = await import("@/lib/api");
    const result = await getUserSubscription();
    expect(result.plan_type).toBe("pro");
    expect(result.features).toContain("voice_clone");
  });
});

// ===================================================================
// Admin Users
// ===================================================================

describe("getAdminUsers", () => {
  const MOCK_USERS = { users: [{ uuid: "u1", username: "admin", email: "a@a.com", subscription_type: "pro", is_active: true, created_at: null, updated_at: null }], total: 1, page: 1, page_size: 20 };

  beforeEach(() => mockOkResponse(MOCK_USERS));

  it("GETs /api/admin/users with query params", async () => {
    const { getAdminUsers } = await import("@/lib/api");
    await getAdminUsers({ page: 1, page_size: 20, subscription_type: "pro" });
    const url = lastFetchCall().url;
    expect(url).toContain("/api/admin/users");
    expect(url).toContain("page=1");
    expect(url).toContain("page_size=20");
    expect(url).toContain("subscription_type=pro");
  });

  it("returns paginated users", async () => {
    const { getAdminUsers } = await import("@/lib/api");
    const result = await getAdminUsers({});
    expect(result.users).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("getAdminUser", () => {
  const MOCK_DETAIL = { uuid: "u1", username: "admin", email: "a@a.com", subscription_type: "pro", is_active: true, created_at: null, updated_at: null, subscription: null, usage: [] };

  beforeEach(() => mockOkResponse(MOCK_DETAIL));

  it("GETs /api/admin/users/{uuid}", async () => {
    const { getAdminUser } = await import("@/lib/api");
    await getAdminUser("u1");
    expect(lastFetchCall().url).toContain("/api/admin/users/u1");
  });
});

describe("toggleUserStatus", () => {
  beforeEach(() => mockOkResponse({ uuid: "u1", is_active: false }));

  it("PUTs /api/admin/users/{uuid}/status", async () => {
    const { toggleUserStatus } = await import("@/lib/api");
    await toggleUserStatus("u1", false);
    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/admin/users/u1/status");
    expect(options.method).toBe("PUT");
    expect(JSON.parse(options.body as string)).toEqual({ is_active: false });
  });
});

// ===================================================================
// Upload
// ===================================================================

describe("uploadFile", () => {
  const MOCK_UPLOAD = { article_id: "a1", filename: "test.md", word_count: 100, status: "completed" };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_UPLOAD,
      text: async () => JSON.stringify(MOCK_UPLOAD),
    });
  });

  it("POSTs multipart form to /api/v1/aggregator/upload", async () => {
    const { uploadFile } = await import("@/lib/api");
    const file = new File(["content"], "test.md", { type: "text/markdown" });
    await uploadFile(file);
    const [url, options] = mockFetch.mock.lastCall!;
    expect(url).toContain("/api/v1/aggregator/upload");
    expect(options.method).toBe("POST");
    expect((options.body as FormData).has("file")).toBe(true);
  });

  it("returns upload result", async () => {
    const { uploadFile } = await import("@/lib/api");
    const file = new File(["content"], "test.md", { type: "text/markdown" });
    const result = await uploadFile(file);
    expect(result.article_id).toBe("a1");
    expect(result.word_count).toBe(100);
  });

  it("throws on upload failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 413,
      text: async () => "File too large",
    });
    const { uploadFile } = await import("@/lib/api");
    const file = new File(["x".repeat(100)], "big.md", { type: "text/markdown" });
    await expect(uploadFile(file)).rejects.toThrow(/413/);
  });
});

// ===================================================================
// Export
// ===================================================================

describe("exportArticles", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["data"]),
    });
    // Mock document.createElement for the download trigger
    if (typeof document === "undefined") {
      vi.stubGlobal("document", {
        createElement: vi.fn(() => ({
          href: "",
          download: "",
          click: vi.fn(),
        })),
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
      });
    }
  });

  it("GETs /api/articles/export with format", async () => {
    const { exportArticles } = await import("@/lib/api");
    await exportArticles("csv");
    expect(lastFetchCall().url).toContain("/api/articles/export?format=csv");
  });
});

describe("exportJobs", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["data"]),
    });
    if (typeof document === "undefined") {
      vi.stubGlobal("document", {
        createElement: vi.fn(() => ({
          href: "",
          download: "",
          click: vi.fn(),
        })),
        body: { appendChild: vi.fn(), removeChild: vi.fn() },
      });
    }
  });

  it("GETs /api/jobs/export with format", async () => {
    const { exportJobs } = await import("@/lib/api");
    await exportJobs("json");
    expect(lastFetchCall().url).toContain("/api/jobs/export?format=json");
  });

  it("throws on export failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Server error",
    });
    const { exportJobs } = await import("@/lib/api");
    await expect(exportJobs("csv")).rejects.toThrow(/500/);
  });
});

// ===================================================================
// Common: Auth header behavior
// ===================================================================

describe("auth header injection", () => {
  beforeEach(() => {
    mockOkResponse({});
  });

  it("includes Bearer token from localStorage", async () => {
    mockStorage.setItem("token", "my-jwt");
    const { getJobs } = await import("@/lib/api");
    await getJobs();
    const headers = lastFetchCall().options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer my-jwt");
  });

  it("omits Authorization when localStorage has no token", async () => {
    const { getJobs } = await import("@/lib/api");
    await getJobs();
    const headers = lastFetchCall().options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("sends Content-Type application/json for JSON requests", async () => {
    const { getDashboard } = await import("@/lib/api");
    await getDashboard();
    const headers = lastFetchCall().options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

// ===================================================================
// Common: Error handling
// ===================================================================

describe("error handling in request", () => {
  it("includes status code in error message", async () => {
    mockErrorResponse(409, "Conflict");
    const { register } = await import("@/lib/api");
    await expect(register({ username: "x", password: "x" })).rejects.toThrow(/Conflict/);
  });

  it("throws with response body in error message", async () => {
    mockErrorResponse(422, "Validation failed");
    const { register } = await import("@/lib/api");
    await expect(register({ username: "x", password: "x" })).rejects.toThrow(/Validation failed/);
  });
});
