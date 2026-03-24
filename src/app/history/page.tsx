"use client";

import { useEffect, useState } from "react";
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
      <h2 className="text-2xl font-bold mb-6">生成履歴</h2>

      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">まだバナーが生成されていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <img
                src={b.imageDataUrl}
                alt={b.templateName}
                className="w-full object-contain bg-gray-50"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{b.templateName}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(b.createdAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {Object.entries(b.parameters)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" / ")}
                </div>
                <button
                  onClick={() => handleDownload(b)}
                  className="text-primary text-sm font-bold hover:underline"
                >
                  ダウンロード
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
