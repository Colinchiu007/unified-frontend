import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    <a href={href}>{children}</a>,
}));

// Mock the translations provider
vi.mock("@/i18n/TranslationsProvider", () => ({
  useTranslations: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "login.title": "TrendScope",
        "login.subtitle": "All-in-One Video Generation Platform",
        "login.username_label": "Username / Email",
        "login.password_label": "Password",
        "login.submit": "Login",
        "login.no_account": "Don't have an account?",
        "login.register_link": "Register",
      };
      return map[key] ?? key;
    },
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

// Mock the API
vi.mock("@/lib/api", () => ({
  login: vi.fn(),
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  it("renders login form with translated labels", () => {
    render(<LoginPage />);
    expect(screen.getByText("TrendScope")).toBeInTheDocument();
    expect(screen.getByText("Username / Email")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("renders register link", () => {
    render(<LoginPage />);
    const registerLink = screen.getByText("Register");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("renders subtitle", () => {
    render(<LoginPage />);
    expect(screen.getByText("All-in-One Video Generation Platform")).toBeInTheDocument();
  });
});
