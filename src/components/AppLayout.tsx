"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Play,
  Send,
  FolderOpen,
  Settings,
  LogOut,
  Server,
  Users,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/generate", label: "生成视频", icon: Play },
  { href: "/publish", label: "发布管理", icon: Send },
  { href: "/content", label: "内容库", icon: FolderOpen },
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/admin/providers", label: "Provider 管理", icon: Server },
  { href: "/admin/users", label: "用户管理", icon: Users },
];

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen">
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card lg:p-4 lg:gap-2">
        <div className="text-xl font-bold mb-6 px-3">TrendScope</div>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
        <div className="flex-1" />
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          {theme === "dark" ? "浅色模式" : "深色模式"}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          退出
        </button>
      </aside>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r p-4 flex flex-col gap-2 lg:hidden">
            <div className="flex items-center justify-between mb-6 px-3">
              <div className="text-xl font-bold">TrendScope</div>
              <button
                onClick={closeSidebar}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            ))}
            <div className="flex-1" />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 shrink-0" />
              )}
              {theme === "dark" ? "浅色模式" : "深色模式"}
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              退出
            </button>
          </aside>
        </>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-md hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-lg font-bold">TrendScope</div>
          <button
            onClick={toggleTheme}
            className="p-2 -mr-2 rounded-md hover:bg-muted transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
