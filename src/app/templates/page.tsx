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
        <h2 className="text-2xl font-bold">テンプレート一覧</h2>
        <Link
          href="/templates/new"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
        >
          + 新規作成
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">
            テンプレートがまだありません
          </p>
          <Link
            href="/templates/new"
            className="text-primary font-bold hover:underline"
          >
            最初のテンプレートを作成する →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="relative bg-gray-100">
                <img
                  src={t.backgroundImageDataUrl}
                  alt={t.name}
                  className="w-full object-contain max-h-48"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg">{t.name}</h3>
                <p className="text-sm text-gray-500">
                  {t.width} × {t.height}px ・ {t.fields.length}個のテキストエリア
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/templates/${t.id}/edit`}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    編集
                  </Link>
                  <button
                    onClick={() => handleDelete(t.id, t.name)}
                    className="text-red-500 text-sm font-bold hover:underline"
                  >
                    削除
                  </button>
                  <Link
                    href={`/generate?template=${t.id}`}
                    className="text-primary text-sm font-bold hover:underline ml-auto"
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
