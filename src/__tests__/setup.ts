import "@testing-library/jest-dom";

// URL.createObjectURL is not implemented in jsdom
if (typeof globalThis.URL.createObjectURL === "undefined") {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
}

// URL.revokeObjectURL also needed by cleanup
if (typeof globalThis.URL.revokeObjectURL === "undefined") {
  globalThis.URL.revokeObjectURL = vi.fn();
}
