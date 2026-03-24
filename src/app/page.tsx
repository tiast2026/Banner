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
      <div className="mb-8">
        <h2 className="text-2xl font-bold">ダッシュボード</h2>
        <p className="text-sm text-gray-400 mt-1">
          バナー生成の状況を確認できます
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-xs text-gray-400 mb-2">テンプレート数</div>
          <div className="text-3xl font-bold text-primary">
            {templates.length}
          </div>
          <Link
            href="/templates"
            className="text-xs text-primary/70 hover:text-primary mt-2 inline-block"
          >
            一覧を見る →
          </Link>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-xs text-gray-400 mb-2">生成済みバナー</div>
          <div className="text-3xl font-bold text-primary">
            {banners.length}
          </div>
          <Link
            href="/history"
            className="text-xs text-primary/70 hover:text-primary mt-2 inline-block"
          >
            履歴を見る →
          </Link>
        </div>
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl p-6 text-white flex flex-col justify-between">
          <div className="text-xs text-white/70 mb-2">クイックアクション</div>
          <div className="space-y-2">
            <Link
              href="/generate"
              className="block bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 text-sm font-bold text-center transition-colors"
            >
              バナーを生成する
            </Link>
            <Link
              href="/templates/new"
              className="block bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-xs text-center transition-colors"
            >
              + テンプレート作成
            </Link>
          </div>
        </div>
      </div>

      {/* Getting started guide (shown when no templates) */}
      {templates.length === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-3">はじめかた</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                1
              </div>
              <div>
                <div className="text-sm font-bold text-gray-700">テンプレート作成</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  背景画像をアップロードし、テキストエリアを配置
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                2
              </div>
              <div>
                <div className="text-sm font-bold text-gray-700">値を入力</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  価格・期間・テキストなどを入力
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                3
              </div>
              <div>
                <div className="text-sm font-bold text-gray-700">バナー生成</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  PNGでダウンロード
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent banners */}
      {banners.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">最近の生成</h3>
            <Link
              href="/history"
              className="text-xs text-primary hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50">
                  <img
                    src={b.imageDataUrl}
                    alt={b.templateName}
                    className="w-full object-contain"
                  />
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold">{b.templateName}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleString("ja-JP")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
