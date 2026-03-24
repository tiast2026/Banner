"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { Template, SheetConfig } from "@/lib/types";
import {
  getTemplates,
  getTemplate,
  getSheetConfigs,
  getSheetConfig,
  saveGeneratedBanner,
} from "@/lib/storage";
import { fetchSheetData } from "@/lib/sheets";
import { BannerPreview } from "@/components/BannerPreview";

export default function BatchPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const allTemplates = getTemplates();
    const allConfigs = getSheetConfigs();
    setTemplates(allTemplates);
    setConfigs(allConfigs);
    // Auto-select first configured template
    const firstConfigured = allConfigs[0];
    if (firstConfigured) {
      setSelectedTemplateId(firstConfigured.templateId);
    }
  }, []);

  const template = selectedTemplateId
    ? getTemplate(selectedTemplateId)
    : undefined;
  const config = selectedTemplateId
    ? getSheetConfig(selectedTemplateId)
    : undefined;

  const configuredTemplates = templates.filter((t) =>
    configs.some((c) => c.templateId === t.id)
  );

  /** スプレッドシートからデータ取得 */
  const handleFetch = async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    setRows([]);
    setSelectedRows(new Set());
    try {
      const { rows: fetchedRows } = await fetchSheetData(
        config.spreadsheetUrl,
        config.sheetName || undefined
      );
      // Map sheet columns to template field names
      const mapped = fetchedRows.map((row) => {
        const values: Record<string, string> = {};
        Object.entries(config.fieldMapping).forEach(
          ([fieldName, columnName]) => {
            if (columnName && row[columnName] !== undefined) {
              values[fieldName] = row[columnName];
            }
          }
        );
        return values;
      });
      setRows(mapped);
      // Select all by default
      setSelectedRows(new Set(mapped.map((_, i) => i)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  /** 行の選択/解除 */
  const toggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

  /** 一括生成 */
  const handleBatchGenerate = useCallback(async () => {
    if (!template || selectedRows.size === 0) return;
    setGenerating(true);
    const selected = Array.from(selectedRows).sort((a, b) => a - b);
    setProgress({ current: 0, total: selected.length });

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();

    for (let i = 0; i < selected.length; i++) {
      const rowIndex = selected[i];
      const values = rows[rowIndex];
      setProgress({ current: i + 1, total: selected.length });

      // Render banner off-screen
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);

      // Create React root and render
      const { createRoot } = await import("react-dom/client");
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          <BannerPreview template={template} values={values} />
        );
        // Wait for render + image/font load
        setTimeout(resolve, 500);
      });

      // Ensure fonts are loaded
      await document.fonts.ready;
      await Promise.all([
        document.fonts.load("400 16px 'Noto Sans JP'"),
        document.fonts.load("700 16px 'Noto Sans JP'"),
        document.fonts.load("900 16px 'Noto Sans JP'"),
      ]);
      await new Promise((r) => setTimeout(r, 200));

      try {
        const { default: html2canvas } = await import("html2canvas-pro");
        const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
          width: template.width,
          height: template.height,
          scale: 1,
          useCORS: true,
          backgroundColor: null,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          windowWidth: template.width,
          windowHeight: template.height,
        });

        const dataUrl = canvas.toDataURL("image/png");

        // Save to history
        saveGeneratedBanner({
          id: uuidv4(),
          templateId: template.id,
          templateName: template.name,
          parameters: { ...values },
          imageDataUrl: dataUrl,
          createdAt: new Date().toISOString(),
        });

        // Add to ZIP
        const base64 = dataUrl.split(",")[1];
        const label =
          values[template.fields[0]?.fieldName] || `row_${rowIndex + 1}`;
        const safeName = label.replace(/[/\\?%*:|"<>]/g, "_");
        zip.file(`${safeName}_${rowIndex + 1}.png`, base64, { base64: true });
      } catch (err) {
        console.error(`Row ${rowIndex + 1} generation failed:`, err);
      } finally {
        root.unmount();
        document.body.removeChild(container);
      }
    }

    // Download ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.name}_batch_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
  }, [template, rows, selectedRows]);

  /** フィールド名の一覧（テーブルヘッダー用） */
  const fieldNames = template
    ? template.fields
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .flatMap((f) =>
          f.fieldType === "period"
            ? ["startDate", "startTime", "endDate", "endTime"]
            : [f.fieldName]
        )
    : [];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">一括生成</h2>
        <p className="text-sm text-gray-400 mt-1">
          スプレッドシートのデータから複数バナーを一括生成し、ZIPでダウンロード
        </p>
      </div>

      {configuredTemplates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-600 font-bold mb-2">
            スプレッドシート連携が未設定です
          </p>
          <p className="text-sm text-gray-400 mb-6">
            まず設定ページでテンプレートとスプレッドシートを紐付けてください
          </p>
          <Link
            href="/settings"
            className="inline-block bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            設定ページへ
          </Link>
        </div>
      ) : (
        <>
          {/* Template selector */}
          <div className="flex items-end gap-4 mb-6">
            <div>
              <label className="block text-xs text-gray-500 font-bold mb-1.5">
                テンプレート選択
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  setSelectedTemplateId(e.target.value);
                  setRows([]);
                  setSelectedRows(new Set());
                  setError(null);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[280px] focus:border-primary outline-none"
              >
                {configuredTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.width}×{t.height}）
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleFetch}
              disabled={!config || loading}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "取得中..." : "スプレッドシートからデータ取得"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Data table */}
          {rows.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm">
                    取得データ（{rows.length}行）
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    {selectedRows.size}行選択中
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAll}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    {selectedRows.size === rows.length
                      ? "すべて解除"
                      : "すべて選択"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-3 py-2 text-left w-10">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === rows.length}
                          onChange={toggleAll}
                          className="accent-primary"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs text-gray-400 w-10">
                        #
                      </th>
                      {fieldNames.map((name) => (
                        <th
                          key={name}
                          className="px-3 py-2 text-left text-xs text-gray-500 font-bold"
                        >
                          {name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                          selectedRows.has(i) ? "bg-primary/5" : ""
                        }`}
                        onClick={() => toggleRow(i)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(i)}
                            onChange={() => toggleRow(i)}
                            className="accent-primary"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-300">
                          {i + 1}
                        </td>
                        {fieldNames.map((name) => (
                          <td
                            key={name}
                            className="px-3 py-2 text-xs text-gray-600"
                          >
                            {row[name] || (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview + Generate */}
          {rows.length > 0 && template && (
            <div className="space-y-4">
              {/* Preview of first selected row */}
              {selectedRows.size > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-xs font-bold text-gray-500 mb-3">
                    プレビュー（1行目のデータ）
                  </h3>
                  {(() => {
                    const firstIdx = Array.from(selectedRows).sort(
                      (a, b) => a - b
                    )[0];
                    const previewValues = rows[firstIdx];
                    const scale = Math.min(1, 700 / template.width);
                    return (
                      <div
                        className="border border-gray-100 rounded overflow-hidden bg-gray-50 inline-block"
                        style={{
                          width: template.width * scale,
                          height: template.height * scale,
                        }}
                      >
                        <div
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <BannerPreview
                            ref={previewRef}
                            template={template}
                            values={previewValues}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Generate button */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBatchGenerate}
                  disabled={generating || selectedRows.size === 0}
                  className="bg-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {generating
                    ? `生成中... (${progress.current}/${progress.total})`
                    : `${selectedRows.size}件のバナーを一括生成 (ZIP)`}
                </button>
                {generating && (
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{
                          width: `${
                            progress.total > 0
                              ? (progress.current / progress.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                      {progress.current}/{progress.total} 完了
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
