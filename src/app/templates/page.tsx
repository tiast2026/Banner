"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Template } from "@/lib/types";
import { getTemplates, deleteTemplate } from "@/lib/storage";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    deleteTemplate(id);
    setTemplates(getTemplates());
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">テンプレート一覧</h2>
          <p className="text-sm text-gray-400 mt-1">
            バナーの雛形を管理します（{templates.length}件）
          </p>
        </div>
        <Link
          href="/templates/new"
          className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
        >
          + 新規作成
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📐</div>
          <p className="text-gray-600 font-bold mb-2">
            テンプレートがまだありません
          </p>
          <p className="text-sm text-gray-400 mb-6">
            背景画像とテキストエリアを組み合わせて、バナーの雛形を作成しましょう
          </p>
          <Link
            href="/templates/new"
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            最初のテンプレートを作成する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative bg-gray-50">
                {t.backgroundImageDataUrl ? (
                  <img
                    src={t.backgroundImageDataUrl}
                    alt={t.name}
                    className="w-full object-contain max-h-48"
                  />
                ) : (
                  <div className="h-32 flex items-center justify-center text-gray-300 text-sm">
                    画像なし
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {t.width} × {t.height}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  テキストエリア {t.fields.length}個 ・ 更新{" "}
                  {new Date(t.updatedAt).toLocaleDateString("ja-JP")}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <Link
                    href={`/templates/edit?id=${t.id}`}
                    className="text-gray-500 hover:text-primary text-sm font-bold transition-colors"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                  >
                    削除
                  </button>
                  <Link
                    href={`/generate?template=${t.id}`}
                    className="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    バナー生成 →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
