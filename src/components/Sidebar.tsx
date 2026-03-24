"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: "🏠" },
  { href: "/templates", label: "テンプレート", icon: "📐" },
  { href: "/generate", label: "バナー生成", icon: "🖼" },
  { href: "/history", label: "生成履歴", icon: "📋" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary">Banner Generator</h1>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
