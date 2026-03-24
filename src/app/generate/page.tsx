"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Template } from "@/lib/types";
import { getTemplates, getTemplate, saveGeneratedBanner } from "@/lib/storage";
import { BannerPreview } from "@/components/BannerPreview";

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = getTemplates();
    setTemplates(all);
    const urlId = searchParams.get("template");
    if (urlId && all.find((t) => t.id === urlId)) {
      setSelectedId(urlId);
    } else if (all.length > 0) {
      setSelectedId(all[0].id);
    }
  }, [searchParams]);

  const template = selectedId ? getTemplate(selectedId) : undefined;

  const handleValueChange = (fieldName: string, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [fieldName]: value };
      // Auto-calc discounted price
      if (fieldName === "通常価格" || fieldName === "割引率") {
        const price = parseInt(
          fieldName === "通常価格" ? value : prev["通常価格"] || "0",
          10
        );
        const rate = parseInt(
          fieldName === "割引率" ? value : prev["割引率"] || "0",
          10
        );
        if (!isNaN(price) && !isNaN(rate) && rate > 0 && rate < 100) {
          next["割引後価格"] = String(Math.floor(price * (1 - rate / 100)));
        }
      }
      return next;
    });
    setGeneratedUrl(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!previewRef.current || !template) return;
    setGenerating(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(previewRef.current, {
        width: template.width,
        height: template.height,
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const dataUrl = canvas.toDataURL("image/png");
      setGeneratedUrl(dataUrl);
      saveGeneratedBanner({
        id: uuidv4(),
        templateId: template.id,
        templateName: template.name,
        parameters: { ...values },
        imageDataUrl: dataUrl,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Banner generation failed:", err);
      alert("バナー生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }, [template, values]);

  const handleDownload = () => {
    if (!generatedUrl || !template) return;
    const a = document.createElement("a");
    a.href = generatedUrl;
    a.download = `${template.name}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  const renderInputField = (field: Template["fields"][0]) => {
    if (field.fieldType === "period") {
      return (
        <div key={field.id} className="space-y-2">
          <label className="block text-xs text-gray-500 font-bold">
            {field.fieldName}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400">開始日</label>
              <input
                type="date"
                value={values["startDate"] || ""}
                onChange={(e) => handleValueChange("startDate", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">開始時間</label>
              <input
                type="time"
                value={values["startTime"] || ""}
                onChange={(e) => handleValueChange("startTime", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">終了日</label>
              <input
                type="date"
                value={values["endDate"] || ""}
                onChange={(e) => handleValueChange("endDate", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400">終了時間</label>
              <input
                type="time"
                value={values["endTime"] || ""}
                onChange={(e) => handleValueChange("endTime", e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    const isAutoCalc =
      field.fieldName === "割引後価格" &&
      template?.fields.some((f) => f.fieldName === "通常価格") &&
      template?.fields.some((f) => f.fieldName === "割引率");

    return (
      <div key={field.id}>
        <label className="block text-xs text-gray-500 font-bold mb-1">
          {field.fieldName}
          {field.fieldType === "price" && "（数値）"}
          {field.fieldType === "percent" && "（%）"}
        </label>
        {isAutoCalc ? (
          <div className="border border-gray-200 bg-gray-50 rounded px-2 py-1 text-sm text-gray-600">
            {values["割引後価格"]
              ? Number(values["割引後価格"]).toLocaleString() + "円"
              : "自動計算"}
            <span className="text-xs text-gray-400 ml-2">（自動計算）</span>
          </div>
        ) : (
          <input
            type={
              field.fieldType === "price" || field.fieldType === "percent"
                ? "number"
                : "text"
            }
            value={values[field.fieldName] || ""}
            onChange={(e) => handleValueChange(field.fieldName, e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder={
              field.fieldType === "price"
                ? "例：3580"
                : field.fieldType === "percent"
                  ? "例：20"
                  : ""
            }
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">バナー生成</h2>

      {templates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            テンプレートがありません。先にテンプレートを作成してください。
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1">
              テンプレート選択
            </label>
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setValues({});
                setGeneratedUrl(null);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}（{t.width}×{t.height}）
                </option>
              ))}
            </select>
          </div>

          {template && (
            <div className="grid grid-cols-[1fr,320px] gap-6">
              {/* Left: preview */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-bold mb-2">
                    リアルタイムプレビュー
                  </h3>
                  <div
                    className="border border-gray-200 overflow-auto"
                    style={{ maxWidth: "100%" }}
                  >
                    <div
                      style={{
                        transform: `scale(${Math.min(1, 700 / template.width)})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <BannerPreview
                        ref={previewRef}
                        template={template}
                        values={values}
                      />
                    </div>
                  </div>
                </div>

                {generatedUrl && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="text-sm font-bold mb-2">生成結果</h3>
                    <img
                      src={generatedUrl}
                      alt="Generated banner"
                      className="max-w-full border border-gray-200"
                    />
                    <button
                      onClick={handleDownload}
                      className="mt-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      ダウンロード
                    </button>
                  </div>
                )}
              </div>

              {/* Right: form */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-bold mb-3">入力項目</h3>
                <div className="space-y-4">
                  {template.fields
                    .slice()
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map(renderInputField)}
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                  >
                    {generating ? "生成中..." : "生成"}
                  </button>
                  {generatedUrl && (
                    <button
                      onClick={handleDownload}
                      className="bg-white text-primary border border-primary px-4 py-2 rounded-lg text-sm font-bold"
                    >
                      DL
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense>
      <GeneratePageInner />
    </Suspense>
  );
}
