import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL
// These are needed by api.ts exportArticle / exportJobs functions
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn(() => "blob:mock");
}
if (typeof URL.revokeObjectURL === "undefined") {
  URL.revokeObjectURL = vi.fn();
}

// jsdom doesn't implement window.matchMedia
// Needed by ThemeProvider.getInitialTheme()
if (typeof window.matchMedia === "undefined") {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
