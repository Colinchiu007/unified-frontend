"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  Send,
  FolderOpen,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/generate", label: "生成视频", icon: Play },
  { href: "/publish", label: "发布管理", icon: Send },
  { href: "/content", label: "内容库", icon: FolderOpen },
  { href: "/settings", label: "设置", icon: Settings },
];

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 flex flex-col gap-2">
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
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
        <div className="flex-1" />
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
        >
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}