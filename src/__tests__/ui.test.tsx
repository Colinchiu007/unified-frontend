import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  CardSkeleton,
  ListSkeleton,
  PageSkeleton,
  EmptyState,
  ErrorState,
  StatusBadge,
} from "@/components/ui";

// ── CardSkeleton ──
describe("CardSkeleton", () => {
  it("renders default count of cards", () => {
    const { container } = render(<CardSkeleton />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it("renders specified count", () => {
    const { container } = render(<CardSkeleton count={5} />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards.length).toBeGreaterThanOrEqual(5);
  });
});

// ── ListSkeleton ──
describe("ListSkeleton", () => {
  it("renders default 5 rows", () => {
    const { container } = render(<ListSkeleton />);
    const rows = container.querySelectorAll(".animate-pulse");
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("renders specified row count", () => {
    const { container } = render(<ListSkeleton rows={3} />);
    const rows = container.querySelectorAll(".animate-pulse");
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});

// ── PageSkeleton ──
describe("PageSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<PageSkeleton />);
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });
});

// ── EmptyState ──
describe("EmptyState", () => {
  it("renders title and description", () => {
    render(<EmptyState title="No items" description="Nothing to show" />);
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show")).toBeInTheDocument();
  });

  it("renders action button when provided", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        description="No data"
        action={{ label: "Add Item", onClick }}
      />
    );
    const btn = screen.getByText("Add Item");
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders without action", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});

// ── ErrorState ──
describe("ErrorState", () => {
  it("renders error message", () => {
    render(<ErrorState message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("renders retry button and handles click", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Error" onRetry={onRetry} />);
    const btn = screen.getByText("重试");
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders without retry", () => {
    render(<ErrorState message="Error" />);
    expect(screen.queryByText("重试")).not.toBeInTheDocument();
  });
});

// ── StatusBadge ──
describe("StatusBadge", () => {
  it("renders completed status", () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });

  it("renders failed status", () => {
    render(<StatusBadge status="failed" />);
    expect(screen.getByText("失败")).toBeInTheDocument();
  });

  it("renders processing status", () => {
    render(<StatusBadge status="processing" />);
    expect(screen.getByText("处理中")).toBeInTheDocument();
  });

  it("renders pending status", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("排队中")).toBeInTheDocument();
  });

  it("handles unknown status", () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("is case insensitive", () => {
    render(<StatusBadge status="Done" />);
    expect(screen.getByText("已完成")).toBeInTheDocument();
  });
});
