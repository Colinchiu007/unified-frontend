import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// Mock Chart.js entirely
vi.mock("chart.js", () => ({
  Chart: class {
    static register() {}
    destroy() {}
  },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  ArcElement: class {},
  Tooltip: class {},
  Legend: class {},
  Filler: class {},
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  AlertCircle: () => <div data-testid="alert-circle" />,
  RefreshCw: () => <div data-testid="refresh-cw" />,
  BarChart3: () => <div data-testid="bar-chart3" />,
}));

// Mock the API
const mockGetJobStats = vi.fn();
vi.mock("@/lib/api", () => ({
  getJobStats: (...args: any[]) => mockGetJobStats(...args),
  type: {},
}));

import DashboardCharts from "@/components/DashboardCharts";

describe("DashboardCharts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton initially", () => {
    // Never resolve the promise
    mockGetJobStats.mockReturnValue(new Promise(() => {}));
    const { container } = render(<DashboardCharts />);
    // Should render skeleton
    const skeletons = container.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state when API fails", async () => {
    mockGetJobStats.mockRejectedValue(new Error("Network error"));
    render(<DashboardCharts />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders chart container on successful load", async () => {
    const mockData = {
      daily: [
        { date: "2026-06-24", completed: 5, processing: 2, pending: 1, failed: 0 },
        { date: "2026-06-25", completed: 3, processing: 1, pending: 0, failed: 1 },
        { date: "2026-06-26", completed: 7, processing: 0, pending: 2, failed: 0 },
        { date: "2026-06-27", completed: 4, processing: 3, pending: 0, failed: 0 },
        { date: "2026-06-28", completed: 6, processing: 1, pending: 1, failed: 1 },
        { date: "2026-06-29", completed: 8, processing: 2, pending: 0, failed: 0 },
        { date: "2026-06-30", completed: 2, processing: 0, pending: 1, failed: 0 },
      ],
      totals: { completed: 35, processing: 9, pending: 5, failed: 2 },
    };
    mockGetJobStats.mockResolvedValue(mockData);
    render(<DashboardCharts />);

    await waitFor(() => {
      expect(screen.getByText("任务趋势（近 7 天）")).toBeInTheDocument();
    });
  });
});
