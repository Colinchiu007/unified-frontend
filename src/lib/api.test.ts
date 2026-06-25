/**
 * Tests for API client module.
 *
 * These tests verify:
 * 1. API_BASE defaults to empty string (not localhost:8000)
 * 2. Request URLs are constructed correctly
 * 3. Register/login functions send correct payloads
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
// Make api.ts see "typeof window !== 'undefined'" as true
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", mockStorage);

// Clear NEXT_PUBLIC_API_URL to test default fallback
delete process.env.NEXT_PUBLIC_API_URL;

// ── Import after mocks are set up ──

import { register, login } from "@/lib/api";

// ── Helpers ──

function lastFetchCall(): { url: string; options: RequestInit } {
  const [url, options] = mockFetch.mock.lastCall!;
  return { url, options };
}

describe("API client default configuration", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockStorage.clear();
  });

  it("API_BASE defaults to empty string when NEXT_PUBLIC_API_URL is not set", async () => {
    // If API_BASE were "http://localhost:8000", fetch would be called with
    // "http://localhost:8000/api/auth/login" — but we expect "/api/auth/login"
    // (relative, going through nginx proxy)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test" }),
    });

    await login("testuser", "testpass");

    const { url } = lastFetchCall();
    expect(url).toBe("/api/auth/login");
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";

    // Clear module cache so api.ts re-evaluates API_BASE
    vi.resetModules();
    const mod = await import("@/lib/api");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test" }),
    });

    await mod.login("testuser", "testpass");

    const { url } = lastFetchCall();
    expect(url).toBe("http://api.example.com/api/auth/login");
  });
});

describe("register", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test-token" }),
    });
  });

  it("sends POST to /api/auth/register", async () => {
    await register({
      username: "newuser",
      email: "new@example.com",
      password: "secret123",
    });

    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/auth/register");
    expect(options.method).toBe("POST");
  });

  it("sends username, email, password in JSON body", async () => {
    await register({
      username: "newuser",
      email: "new@example.com",
      password: "secret123",
    });

    const { options } = lastFetchCall();
    const body = JSON.parse(options.body as string);
    expect(body).toEqual({
      username: "newuser",
      email: "new@example.com",
      password: "secret123",
    });
  });

  it("sends Content-Type application/json header", async () => {
    await register({
      username: "newuser",
      email: "new@example.com",
      password: "secret123",
    });

    const { options } = lastFetchCall();
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

describe("login", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "test-token" }),
    });
  });

  it("sends POST to /api/auth/login with username and password", async () => {
    await login("testuser", "testpass");

    const { url, options } = lastFetchCall();
    expect(url).toContain("/api/auth/login");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string);
    expect(body).toEqual({ username: "testuser", password: "testpass" });
  });
});

describe("error handling in request", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("throws an error when response is not ok", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => '{"detail": "validation error"}',
    });

    await expect(
      register({
        username: "bad",
        email: "bad",
        password: "12",
      })
    ).rejects.toThrow(/422/);
  });

  it("includes response body in error message", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => "Username already exists",
    });

    await expect(
      register({
        username: "existing",
        email: "existing@test.com",
        password: "test123456",
      })
    ).rejects.toThrow(/409.*already exists/);
  });
});

describe("auth header", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
  });

  it("includes Authorization header when token is in localStorage", async () => {
    mockStorage.setItem("token", "test-jwt-token");

    const { getDashboard } = await import("@/lib/api");
    await getDashboard();

    const { options } = lastFetchCall();
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-jwt-token");
  });

  it("omits Authorization header when no token", async () => {
    mockStorage.removeItem("token");

    const { getDashboard } = await import("@/lib/api");
    await getDashboard();

    const { options } = lastFetchCall();
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });
});
