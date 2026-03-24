"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GeneratedBanner } from "@/lib/types";
import { getGeneratedBanners } from "@/lib/storage";

export default function HistoryPage() {
  const [banners, setBanners] = useState<GeneratedBanner[]>([]);

  useEffect(() => {
    setBanners(getGeneratedBanners());
  }, []);

  const handleDownload = (banner: GeneratedBanner) => {
    const a = document.createElement("a");
    a.href = banner.imageDataUrl;
    a.download = `${banner.templateName}_${banner.createdAt.slice(0, 10)}.png`;
    a.click();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">生成履歴</h2>
        <p className="text-sm text-gray-400 mt-1">
          過去に生成したバナーの一覧です（{banners.length}件）
        </p>
      </div>

      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-600 font-bold mb-2">
            まだバナーが生成されていません
          </p>
          <p className="text-sm text-gray-400 mb-6">
            テンプレートを選んでバナーを生成すると、ここに履歴が表示されます
          </p>
          <Link
            href="/generate"
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            バナーを生成する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
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
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{b.templateName}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(b.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                {Object.entries(b.parameters).filter(([, v]) => v).length >
                  0 && (
                  <div className="text-xs text-gray-400 mb-3 bg-gray-50 rounded-lg px-2 py-1.5">
                    {Object.entries(b.parameters)
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <span key={k} className="inline-block mr-3">
                          <span className="text-gray-500">{k}:</span> {v}
                        </span>
                      ))}
                  </div>
                )}
                <button
                  onClick={() => handleDownload(b)}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  PNGダウンロード
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
