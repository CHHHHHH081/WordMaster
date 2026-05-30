"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: "🏠" },
  { href: "/study", label: "学习", icon: "📖" },
  { href: "/review", label: "复习", icon: "🔄" },
  { href: "/words", label: "词库", icon: "📚" },
  { href: "/stats", label: "统计", icon: "📊" },
  { href: "/wrong-book", label: "错题本", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-700">
        <Link href="/" className="text-lg font-bold tracking-tight">
          📖 WordMaster
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User area */}
      <div className="px-5 py-4 border-t border-slate-700">
        <Link
          href="/auth/settings"
          className="flex items-center gap-3 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <span>⚙️</span>
          <span>设置</span>
        </Link>
      </div>
    </aside>
  );
}
