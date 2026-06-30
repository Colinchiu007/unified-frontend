import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider, useTheme } from "../providers/ThemeProvider";

function ThemeConsumer() {
  const { theme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>
        Toggle
      </button>
      <button data-testid="dark-btn" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button data-testid="light-btn" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders children", () => {
    render(
      <ThemeProvider>
        <div>child</div>
      </ThemeProvider>
    );
    expect(screen.getByText("child")).toBeTruthy();
  });

  it("provides default theme as 'light' during SSR", () => {
    // ThemeProvider defaults to 'light' before mount (SSR phase)
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    // After mount, default is 'light' (no localStorage, no matchMedia)
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
  });

  it("reads theme from localStorage on mount", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  it("toggles theme from light to dark", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
    await user.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
  });

  it("toggles theme from dark to light", async () => {
    localStorage.setItem("theme", "dark");
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-value").textContent).toBe("dark");
    await user.click(screen.getByTestId("toggle-btn"));
    expect(screen.getByTestId("theme-value").textContent).toBe("light");
  });

  it("setTheme('dark') updates data-theme attribute on html", async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    screen.getByTestId("dark-btn").click();
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute("data-theme")
      ).toBe("dark");
    });
  });

  it("setTheme('light') removes data-theme attribute", async () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    screen.getByTestId("light-btn").click();
    await waitFor(() => {
      expect(
        document.documentElement.getAttribute("data-theme")
      ).toBeNull();
    });
  });

  it("persists theme to localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );
    screen.getByTestId("dark-btn").click();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("useTheme throws error when used outside provider", () => {
    const TestComponent = () => {
      useTheme();
      return null;
    };
    expect(() => render(<TestComponent />)).toThrow(
      "useTheme must be used within a ThemeProvider"
    );
  });
});
