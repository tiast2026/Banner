"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Template, SheetConfig } from "@/lib/types";
import {
  getTemplates,
  getSheetConfigs,
  getSheetConfig,
  saveSheetConfig,
  deleteSheetConfig,
} from "@/lib/storage";
import { extractSpreadsheetId, fetchSheetData } from "@/lib/sheets";

export default function SettingsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [configs, setConfigs] = useState<SheetConfig[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    setTemplates(getTemplates());
    setConfigs(getSheetConfigs());
  }, []);

  const startEdit = (templateId: string) => {
    setEditingTemplateId(templateId);
    const existing = getSheetConfig(templateId);
    if (existing) {
      setUrl(existing.spreadsheetUrl);
      setSheetName(existing.sheetName);
      setMapping(existing.fieldMapping);
    } else {
      setUrl("");
      setSheetName("");
      setMapping({});
    }
    setSheetHeaders([]);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    if (!url) return;
    setTesting(true);
    setTestResult(null);
    try {
      const { headers, rows } = await fetchSheetData(url, sheetName || undefined);
      setSheetHeaders(headers);
      setTestResult({
        ok: true,
        message: `接続成功: ${headers.length}列 × ${rows.length}行のデータを取得しました`,
      });
      // Auto-map matching field names
      if (editingTemplateId) {
        const template = templates.find((t) => t.id === editingTemplateId);
        if (template) {
          const autoMap: Record<string, string> = { ...mapping };
          template.fields.forEach((f) => {
            if (!autoMap[f.fieldName]) {
              const match = headers.find(
                (h) => h === f.fieldName || h.includes(f.fieldName) || f.fieldName.includes(h)
              );
              if (match) {
                autoMap[f.fieldName] = match;
              }
            }
          });
          // period fields
          const periodField = template.fields.find(
            (f) => f.fieldType === "period"
          );
          if (periodField) {
            ["startDate", "startTime", "endDate", "endTime"].forEach((key) => {
              if (!autoMap[key]) {
                const match = headers.find(
                  (h) => h === key || h.includes(key)
                );
                if (match) autoMap[key] = match;
              }
            });
          }
          setMapping(autoMap);
        }
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : "接続に失敗しました",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!editingTemplateId || !url) return;
    const template = templates.find((t) => t.id === editingTemplateId);
    if (!template) return;

    const existing = getSheetConfig(editingTemplateId);
    const config: SheetConfig = {
      id: existing?.id || uuidv4(),
      templateId: editingTemplateId,
      templateName: template.name,
      spreadsheetUrl: url,
      sheetName: sheetName || "",
      fieldMapping: mapping,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveSheetConfig(config);
    setConfigs(getSheetConfigs());
    setEditingTemplateId(null);
    setTestResult(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("この連携設定を削除しますか？")) return;
    deleteSheetConfig(id);
    setConfigs(getSheetConfigs());
  };

  const editingTemplate = editingTemplateId
    ? templates.find((t) => t.id === editingTemplateId)
    : null;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">スプレッドシート連携</h2>
        <p className="text-sm text-gray-400 mt-1">
          テンプレートごとにGoogle
          スプレッドシートを紐付けて、一括バナー生成ができます
        </p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-bold text-blue-800 mb-1">設定手順</h3>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>
            Google スプレッドシートの共有設定を「リンクを知っている全員が閲覧可」に変更
          </li>
          <li>テンプレートを選択し、スプレッドシートのURLを貼り付け</li>
          <li>「接続テスト」でデータを確認し、列名とフィールドを対応付け</li>
          <li>
            保存後、「一括生成」ページからスプレッドシートのデータで一括バナー生成
          </li>
        </ol>
      </div>

      {/* Existing configs */}
      {configs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            設定済みの連携（{configs.length}件）
          </h3>
          <div className="space-y-2">
            {configs.map((c) => {
              const spreadsheetId = extractSpreadsheetId(c.spreadsheetUrl);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm">{c.templateName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Sheet ID: {spreadsheetId?.slice(0, 20)}...
                      {c.sheetName && ` / シート: ${c.sheetName}`}
                    </div>
                    <div className="text-[10px] text-gray-300 mt-0.5">
                      更新: {new Date(c.updatedAt).toLocaleString("ja-JP")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(c.templateId)}
                      className="text-primary text-sm font-bold hover:underline"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-gray-400 hover:text-red-500 text-sm transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template selector */}
      {!editingTemplateId && (
        <div>
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            新しい連携を追加
          </h3>
          {templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-400">
                テンプレートがありません。先にテンプレートを作成してください。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {templates.map((t) => {
                const hasConfig = configs.some(
                  (c) => c.templateId === t.id
                );
                return (
                  <button
                    key={t.id}
                    onClick={() => startEdit(t.id)}
                    className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-primary hover:shadow-sm transition-all"
                  >
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {t.width}×{t.height} ・ {t.fields.length}フィールド
                    </div>
                    {hasConfig && (
                      <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                        連携済み
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit panel */}
      {editingTemplateId && editingTemplate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">
              {editingTemplate.name} のスプレッドシート連携
            </h3>
            <button
              onClick={() => {
                setEditingTemplateId(null);
                setTestResult(null);
              }}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              キャンセル
            </button>
          </div>

          {/* URL input */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 font-bold mb-1">
              スプレッドシートURL <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 font-bold mb-1">
              シート名
              <span className="text-xs font-normal text-gray-400 ml-1">
                （空欄で最初のシート）
              </span>
            </label>
            <input
              type="text"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Sheet1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          {/* Test connection */}
          <div className="mb-4">
            <button
              onClick={handleTestConnection}
              disabled={!url || testing}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {testing ? "接続中..." : "接続テスト"}
            </button>
          </div>

          {testResult && (
            <div
              className={`rounded-lg p-3 mb-4 text-sm ${
                testResult.ok
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {testResult.message}
            </div>
          )}

          {/* Field mapping */}
          {sheetHeaders.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-500 mb-2">
                フィールド対応付け
              </h4>
              <p className="text-[10px] text-gray-400 mb-3">
                テンプレートの各フィールドに、スプレッドシートのどの列を割り当てるか選択してください
              </p>
              <div className="space-y-2">
                {editingTemplate.fields.map((field) => {
                  if (field.fieldType === "period") {
                    return (
                      <div key={field.id} className="space-y-1">
                        <div className="text-xs font-bold text-gray-600">
                          {field.fieldName}（期間）
                        </div>
                        {[
                          { key: "startDate", label: "開始日" },
                          { key: "startTime", label: "開始時間" },
                          { key: "endDate", label: "終了日" },
                          { key: "endTime", label: "終了時間" },
                        ].map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center gap-2 ml-4"
                          >
                            <span className="text-xs text-gray-500 w-16">
                              {label}
                            </span>
                            <select
                              value={mapping[key] || ""}
                              onChange={(e) =>
                                setMapping((prev) => ({
                                  ...prev,
                                  [key]: e.target.value,
                                }))
                              }
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                            >
                              <option value="">-- 未設定 --</option>
                              {sheetHeaders.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div key={field.id} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-bold w-28 truncate">
                        {field.fieldName}
                      </span>
                      <span className="text-gray-300">→</span>
                      <select
                        value={mapping[field.fieldName] || ""}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [field.fieldName]: e.target.value,
                          }))
                        }
                        className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:border-primary outline-none"
                      >
                        <option value="">-- 未設定 --</option>
                        {sheetHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save */}
          <div className="flex gap-2 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={!url}
              className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              保存
            </button>
            <button
              onClick={() => {
                setEditingTemplateId(null);
                setTestResult(null);
              }}
              className="text-gray-500 px-4 py-2 text-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
