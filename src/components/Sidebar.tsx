"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: "🏠", desc: "概要を確認" },
  { href: "/templates", label: "テンプレート", icon: "📐", desc: "テンプレート管理" },
  { href: "/generate", label: "バナー生成", icon: "🖼", desc: "バナーを作成" },
  { href: "/history", label: "生成履歴", icon: "📋", desc: "過去の生成結果" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shadow-sm">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary">Banner Generator</h1>
        <p className="text-[10px] text-gray-400 mt-0.5">ECバナー自動生成ツール</p>
      </div>
      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <div className="leading-tight">{item.label}</div>
                {active && (
                  <div className="text-[10px] font-normal text-primary/60 leading-tight">
                    {item.desc}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="text-[10px] text-gray-300 text-center">v1.0</div>
      </div>
    </aside>
  );
}
