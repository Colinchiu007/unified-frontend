import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockRouter = { push: mockPush };
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
}));

const mockT = vi.fn((key: string, params?: Record<string, string>) => {
  const map: Record<string, string> = {
    "dashboard.title": "Hello, {username}",
    "dashboard.subtitle": "Your video dashboard",
    "dashboard.processing": "Processing",
    "dashboard.completed": "Completed",
    "dashboard.failed": "Failed",
    "dashboard.trending": "Trending Now",
    "dashboard.no_trending": "No trending yet",
    "dashboard.no_trending_desc": "Data will appear once content is aggregated",
    "dashboard.loading_failed": "Failed to load",
    "dashboard.retry": "Retry",
  };
  let val = map[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, v);
    }
  }
  return val;
});
vi.mock("@/i18n/TranslationsProvider", () => ({
  useTranslations: () => ({ t: mockT }),
}));

vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

const mockGetDashboard = vi.fn();
vi.mock("@/lib/api", () => ({
  getDashboard: (...args: any[]) => mockGetDashboard(...args),
}));

vi.mock("@/components/DashboardCharts", () => ({
  default: () => <div data-testid="mock-charts" />,
}));

import DashboardPage from "@/app/page";

function mockDashboardData(overrides?: Record<string, unknown>) {
  return {
    trending: [
      { title: "Hot Topic", platform_code: "weibo", hot_score: 100000, url: "https://weibo.com/1" },
      { title: "Viral News", platform_code: "douyin", hot_score: 50000, url: "https://douyin.com/2" },
    ],
    today_stats: { processing: 3, done: 15, failed: 1 },
    user: { id: "u1", username: "testuser", role: "user" },
    ...overrides,
  };
}

function mockLocalStorage(token?: string) {
  const store: Record<string, string> = {};
  if (token) store.token = token;
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: () => null,
  });
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
    mockLocalStorage("valid-token");
  });

  it("shows skeleton while loading", () => {
    mockGetDashboard.mockReturnValue(new Promise(() => {}));
    const { container } = render(<DashboardPage />);
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error UI when API call fails", async () => {
    mockGetDashboard.mockRejectedValue(new Error("Network error"));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("does NOT crash when API returns null — shows error instead", async () => {
    mockGetDashboard.mockResolvedValue(null);
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("handles empty trending list gracefully", async () => {
    mockGetDashboard.mockResolvedValue(
      mockDashboardData({ trending: [], today_stats: { processing: 0, done: 0, failed: 0 } })
    );
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("No trending yet")).toBeInTheDocument();
    });
  });

  it("renders stats and trending on success", async () => {
    mockGetDashboard.mockResolvedValue(mockDashboardData());
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Hello, testuser")).toBeInTheDocument();
    });
    // Verify stats: "Processing", "Completed", "Failed" labels are present
    // (stat VALUES "3", "15", "1" share the page with trending ranks,
    //  so scope queries within stat card containers)
    expect(screen.getByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    // Trending section
    expect(screen.getByText("Trending Now")).toBeInTheDocument();
    expect(screen.getByText("Hot Topic")).toBeInTheDocument();
    expect(screen.getByText("Viral News")).toBeInTheDocument();
    // Chart placeholder
    expect(screen.getByTestId("mock-charts")).toBeInTheDocument();
  });

  it("redirects to /login when 401", async () => {
    mockGetDashboard.mockRejectedValue(new Error("401: Unauthorized"));
    render(<DashboardPage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  it("redirects to /login when no token", async () => {
    mockLocalStorage();
    render(<DashboardPage />);
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("retry button re-fetches dashboard after error", async () => {
    mockGetDashboard.mockRejectedValueOnce(new Error("Temp error"));
    mockGetDashboard.mockResolvedValueOnce(mockDashboardData());
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
    const user = userEvent.setup();
    await user.click(screen.getByText("Retry"));
    await waitFor(() => {
      expect(screen.getByText("Hello, testuser")).toBeInTheDocument();
    });
    expect(mockGetDashboard).toHaveBeenCalledTimes(2);
  });
});
