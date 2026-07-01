import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
}));

// Mock providers
vi.mock("@/i18n/TranslationsProvider", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "app.name": "TrendScope",
        "nav.dashboard": "Dashboard",
        "nav.generate": "Generate",
        "nav.publish": "Publish",
        "nav.content": "Content",
        "nav.settings": "Settings",
        "nav.admin_providers": "Providers",
        "nav.admin_users": "Users",
        "nav.light_mode": "Light Mode",
        "nav.dark_mode": "Dark Mode",
        "nav.logout": "Logout",
      };
      return map[key] ?? key;
    },
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

vi.mock("@/providers/ThemeProvider", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

import AppLayout from "@/components/AppLayout";

describe("AppLayout", () => {
  it("renders navigation links", () => {
    render(
      <AppLayout>
        <div>child content</div>
      </AppLayout>
    );
    // Should render dashboard link with translated text
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText("Publish")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <AppLayout>
        <div>child content</div>
      </AppLayout>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("renders app name", () => {
    render(
      <AppLayout>
        <div>content</div>
      </AppLayout>
    );
    expect(screen.getAllByText("TrendScope").length).toBeGreaterThanOrEqual(1);
  });

  it("renders theme toggle button text", () => {
    render(
      <AppLayout>
        <div>content</div>
      </AppLayout>
    );
    // When theme is "light", the button shows "Dark Mode" (toggle to dark)
    expect(screen.getByText("Dark Mode")).toBeInTheDocument();
  });
});
