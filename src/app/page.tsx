"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Template, GeneratedBanner } from "@/lib/types";
import { getTemplates } from "@/lib/storage";
import { getGeneratedBanners } from "@/lib/storage";

export default function Dashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [banners, setBanners] = useState<GeneratedBanner[]>([]);

  useEffect(() => {
    setTemplates(getTemplates());
    setBanners(getGeneratedBanners().slice(0, 6));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">ダッシュボード</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-primary">
            {templates.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">テンプレート数</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-primary">
            {banners.length}
          </div>
          <div className="text-sm text-gray-500 mt-1">生成済みバナー</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <Link
            href="/generate"
            className="text-primary font-bold hover:underline"
          >
            バナーを生成する →
          </Link>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Link
          href="/templates/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
        >
          + テンプレート作成
        </Link>
        <Link
          href="/generate"
          className="bg-white text-primary border border-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/5 transition-colors"
        >
          バナー生成
        </Link>
      </div>

      {banners.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">最近の生成</h3>
          <div className="grid grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <img
                  src={b.imageDataUrl}
                  alt={b.templateName}
                  className="w-full object-contain"
                />
                <div className="p-3">
                  <div className="text-xs text-gray-500">
                    {new Date(b.createdAt).toLocaleString("ja-JP")}
                  </div>
                  <div className="text-sm font-bold">{b.templateName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
