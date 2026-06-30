import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUploadZone from "./FileUploadZone";

// Mock the api module
vi.mock("@/lib/api", () => ({
  uploadFile: vi.fn(),
}));

import { uploadFile } from "@/lib/api";

function createMockFile(name: string, size: number, mime = "text/plain") {
  const file = new File(["test content"], name, { type: mime });
  if (size > 0) {
    Object.defineProperty(file, "size", { value: size });
  }
  return file;
}

async function selectFile(
  input: HTMLInputElement,
  file: File
): Promise<void> {
  Object.defineProperty(input, "files", { value: [file] });
  input.dispatchEvent(new Event("change", { bubbles: true }));
  // Wait a tick for state updates
  await new Promise((r) => setTimeout(r, 0));
}

describe("FileUploadZone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders upload area with drag-and-drop prompt", () => {
    render(<FileUploadZone />);
    expect(screen.getByText(/拖拽文件到此处/)).toBeTruthy();
  });

  it("has a hidden file input", () => {
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.className).toContain("hidden");
  });

  it("accepts .txt, .md, .markdown files", () => {
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(input.accept).toBe(".txt,.md,.markdown");
  });

  it("shows error for unsupported file type", async () => {
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.png", 1000));
    expect(screen.getByText(/不支持的文件类型/)).toBeTruthy();
  });

  it("shows error for files over 10MB", async () => {
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.txt", 11 * 1024 * 1024));
    expect(screen.getByText(/文件过大/)).toBeTruthy();
  });

  it("calls uploadFile on valid file upload", async () => {
    vi.mocked(uploadFile).mockResolvedValue({ article_id: "abc-123" });
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.md", 1000));
    expect(uploadFile).toHaveBeenCalled();
  });

  it("shows success message after upload", async () => {
    vi.mocked(uploadFile).mockResolvedValue({ article_id: "abc-123" });
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.md", 1000));
    // Wait for state
    await vi.waitFor(() => {
      expect(screen.getByText(/上传成功/)).toBeTruthy();
    });
  });

  it("shows error message on upload failure", async () => {
    vi.mocked(uploadFile).mockRejectedValue(new Error("Network error"));
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.md", 1000));
    await vi.waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeTruthy();
    });
  });

  it("calls onUploadComplete callback on success", async () => {
    const onComplete = vi.fn();
    vi.mocked(uploadFile).mockResolvedValue({ article_id: "abc-123" });
    render(<FileUploadZone onUploadComplete={onComplete} />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.md", 1000));
    await vi.waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith("abc-123");
    });
  });

  it("shows uploading state", async () => {
    // Never resolve to keep uploading state
    vi.mocked(uploadFile).mockImplementation(
      () => new Promise(() => {}) // never resolves
    );
    render(<FileUploadZone />);
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await selectFile(input, createMockFile("test.md", 1000));
    // Uploading indicator should appear
    await vi.waitFor(() => {
      expect(screen.getByText(/正在上传/)).toBeTruthy();
    });
  });
});
