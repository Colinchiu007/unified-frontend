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
  Languages,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useTranslations } from "@/i18n/TranslationsProvider";
import type { Locale } from "@/i18n/useTranslations";

const NAV_ITEMS: { href: string; labelKey: string; icon: any }[] = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/generate", labelKey: "nav.generate", icon: Play },
  { href: "/publish", labelKey: "nav.publish", icon: Send },
  { href: "/content", labelKey: "nav.content", icon: FolderOpen },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
  { href: "/admin/providers", labelKey: "nav.admin_providers", icon: Server },
  { href: "/admin/users", labelKey: "nav.admin_users", icon: Users },
];

const LOCALES: { code: Locale; label: string }[] = [
  { code: "zh-CN", label: "中文" },
  { code: "en-US", label: "English" },
];

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { t, locale, setLocale } = useTranslations();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function NavItems({ closeNav }: { closeNav?: () => void }) {
    return (
      <>
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={closeNav}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {t(labelKey)}
          </Link>
        ))}
      </>
    );
  }

  return (
    <div className="flex h-screen">
      {/* ── Desktop sidebar (lg+) ── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card lg:p-4 lg:gap-2">
        <div className="text-xl font-bold mb-6 px-3">{t("app.name")}</div>
        <NavItems />
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
          {theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}
        </button>
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md w-full"
          >
            <Languages className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left">{locale === "zh-CN" ? "中文" : "English"}</span>
          </button>
          {langOpen && (
            <div className="absolute left-0 bottom-full mb-1 bg-card border rounded-md shadow-md py-1 min-w-[120px]">
              {LOCALES.map(({ code, label }) => (
                <button
                  key={code}
                  onClick={() => { setLocale(code); setLangOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                    locale === code ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {t("nav.logout")}
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
              <div className="text-xl font-bold">{t("app.name")}</div>
              <button
                onClick={closeSidebar}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavItems closeNav={closeSidebar} />
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
              {theme === "dark" ? t("nav.light_mode") : t("nav.dark_mode")}
            </button>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
            >
              <Languages className="w-4 h-4 shrink-0" />
              <span>{locale === "zh-CN" ? "中文" : "English"}</span>
            </button>
            {langOpen && (
              <div className="bg-card border rounded-md shadow-md py-1">
                {LOCALES.map(({ code, label }) => (
                  <button
                    key={code}
                    onClick={() => { setLocale(code); setLangOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      locale === code ? "text-primary font-medium" : "text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {t("nav.logout")}
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
          <div className="text-lg font-bold">{t("app.name")}</div>
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
