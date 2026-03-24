"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Template, TemplateField } from "@/lib/types";
import { saveTemplate, getTemplate } from "@/lib/storage";
import { formatFieldValue } from "@/lib/format";

const SAMPLE_VALUES: Record<string, string> = {
  startDate: "2025-03-04",
  startTime: "20:00",
  endDate: "2025-03-11",
  endTime: "01:59",
};

function getSampleValue(field: TemplateField): string {
  switch (field.fieldType) {
    case "price":
      return "3580";
    case "percent":
      return "20";
    case "period":
      return "";
    case "text":
      return "サンプル";
    default:
      return "サンプル";
  }
}

interface Props {
  templateId?: string;
}

export function TemplateEditor({ templateId }: Props) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(210);
  const [bgImage, setBgImage] = useState("");
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (templateId) {
      const t = getTemplate(templateId);
      if (t) {
        setName(t.name);
        setWidth(t.width);
        setHeight(t.height);
        setBgImage(t.backgroundImageDataUrl);
        setFields(t.fields);
      }
    }
  }, [templateId]);

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setBgImage(dataUrl);

      if (file.type === "image/svg+xml") {
        const textReader = new FileReader();
        textReader.onload = (te) => {
          const svgText = te.target?.result as string;
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgText, "image/svg+xml");
          const svg = doc.querySelector("svg");
          if (svg) {
            const vb = svg.getAttribute("viewBox");
            const w = svg.getAttribute("width");
            const h = svg.getAttribute("height");
            if (w && h) {
              setWidth(parseInt(w, 10) || 1080);
              setHeight(parseInt(h, 10) || 210);
            } else if (vb) {
              const parts = vb.split(/[\s,]+/);
              setWidth(parseInt(parts[2], 10) || 1080);
              setHeight(parseInt(parts[3], 10) || 210);
            }
          }
        };
        textReader.readAsText(file);
      } else {
        const img = new Image();
        img.onload = () => {
          setWidth(img.naturalWidth);
          setHeight(img.naturalHeight);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const addField = () => {
    const newField: TemplateField = {
      id: uuidv4(),
      fieldName: `エリア${fields.length + 1}`,
      fieldType: "text",
      xPosition: 50,
      yPosition: 50,
      fontSize: 24,
      fontWeight: 700,
      fontColor: "#333333",
      textAlign: "left",
      letterSpacing: 0,
      suffix: "",
      sortOrder: fields.length,
    };
    setFields([...fields, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("テンプレート名を入力してください");
      return;
    }
    if (!bgImage) {
      alert("背景画像をアップロードしてください");
      return;
    }
    const template: Template = {
      id: templateId || uuidv4(),
      name,
      width,
      height,
      backgroundImageDataUrl: bgImage,
      fields,
      createdAt: templateId
        ? getTemplate(templateId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveTemplate(template);
    router.push("/templates");
  };

  const getScaleFactor = useCallback(() => {
    if (!canvasRef.current) return 1;
    const containerWidth = canvasRef.current.clientWidth;
    return containerWidth / width;
  }, [width]);

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setDragging(fieldId);
    const scale = getScaleFactor();
    const field = fields.find((f) => f.id === fieldId)!;
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - field.xPosition * scale,
      y: e.clientY - rect.top - field.yPosition * scale,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !canvasRef.current) return;
      const scale = getScaleFactor();
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.round((e.clientX - rect.left - dragOffset.x) / scale);
      const y = Math.round((e.clientY - rect.top - dragOffset.y) / scale);
      updateField(dragging, {
        xPosition: Math.max(0, Math.min(x, width)),
        yPosition: Math.max(0, Math.min(y, height)),
      });
    },
    [dragging, dragOffset, width, height, getScaleFactor]
  );

  const handleMouseUp = () => {
    setDragging(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {templateId ? "テンプレート編集" : "テンプレート作成"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            背景画像にテキストエリアを配置して、バナーの雛形を作成します
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/templates")}
            className="bg-white text-gray-500 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-sm"
          >
            保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr,300px] gap-6">
        {/* Left: Canvas area */}
        <div>
          {/* Step 1: Basic info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="text-xs font-bold text-primary mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                1
              </span>
              基本情報
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  テンプレート名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：カードリーダー"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  背景画像 <span className="text-red-400">*</span>
                </label>
                <label className="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-primary text-sm text-gray-600 hover:text-primary px-3 py-2 rounded-lg cursor-pointer transition-colors">
                  {bgImage ? "画像を変更" : "画像を選択"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {bgImage && (
                  <span className="text-[10px] text-green-500 ml-2">
                    設定済み
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  幅 (px)
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  高さ (px)
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
                />
              </div>
              <div className="flex items-end">
                <span className="text-[10px] text-gray-300 pb-2.5">
                  PNG/JPEG/SVG対応
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Preview canvas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                テキストエリアを配置
                <span className="text-[10px] text-gray-400 font-normal ml-2">
                  ドラッグで位置調整
                </span>
              </div>
              <button
                onClick={addField}
                className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors"
              >
                + テキストエリア追加
              </button>
            </div>
            {!bgImage ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center py-20 text-gray-300">
                <div className="text-center">
                  <div className="text-3xl mb-2">🖼</div>
                  <div className="text-sm">
                    まず背景画像をアップロードしてください
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={canvasRef}
                className="relative border border-gray-200 rounded overflow-hidden select-none"
                style={{ aspectRatio: `${width}/${height}` }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={() => setSelectedFieldId(null)}
              >
                <img
                  src={bgImage}
                  alt="背景"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
                {fields.map((field) => {
                  const scale = canvasRef.current
                    ? canvasRef.current.clientWidth / width
                    : 1;
                  const sampleVal =
                    field.fieldType === "period"
                      ? formatFieldValue(
                          field.fieldType,
                          "",
                          field.suffix,
                          SAMPLE_VALUES
                        )
                      : formatFieldValue(
                          field.fieldType,
                          getSampleValue(field),
                          field.suffix
                        );
                  return (
                    <div
                      key={field.id}
                      onMouseDown={(e) => handleMouseDown(e, field.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFieldId(field.id);
                      }}
                      className={`absolute cursor-move whitespace-nowrap ${
                        selectedFieldId === field.id
                          ? "outline outline-2 outline-primary outline-offset-2 ring-4 ring-primary/10"
                          : "hover:outline hover:outline-1 hover:outline-primary/40"
                      }`}
                      style={{
                        left: `${(field.xPosition / width) * 100}%`,
                        top: `${(field.yPosition / height) * 100}%`,
                        fontSize: `${field.fontSize * scale}px`,
                        fontWeight: field.fontWeight,
                        color: field.fontColor,
                        textAlign: field.textAlign,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        lineHeight: 1,
                        letterSpacing: `${field.letterSpacing ?? 0}px`,
                      }}
                    >
                      {sampleVal || field.fieldName}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-sm mb-3">テキストエリア一覧</h3>
            {fields.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-400">
                  「+ テキストエリア追加」で
                </p>
                <p className="text-xs text-gray-400">エリアを作成してください</p>
              </div>
            ) : (
              <ul className="space-y-1">
                {fields.map((f, i) => (
                  <li
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
                      selectedFieldId === f.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="text-[10px] text-gray-300 w-4 text-right">
                      {i + 1}
                    </span>
                    <span className="truncate">{f.fieldName}</span>
                    <span className="text-[10px] text-gray-300 ml-auto">
                      {f.fieldType}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedField && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-sm mb-3">
                プロパティ
                <span className="text-xs font-normal text-gray-400 ml-1">
                  - {selectedField.fieldName}
                </span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    エリア名
                  </label>
                  <input
                    type="text"
                    value={selectedField.fieldName}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        fieldName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    種類
                  </label>
                  <select
                    value={selectedField.fieldType}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        fieldType: e.target.value as TemplateField["fieldType"],
                        suffix:
                          e.target.value === "price" ? "円" : selectedField.suffix,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  >
                    <option value="price">価格（¥3,580）</option>
                    <option value="percent">割引率（20%OFF）</option>
                    <option value="period">期間（3/4 20:00〜）</option>
                    <option value="text">テキスト（自由入力）</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      X (px)
                    </label>
                    <input
                      type="number"
                      value={selectedField.xPosition}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          xPosition: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Y (px)
                    </label>
                    <input
                      type="number"
                      value={selectedField.yPosition}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          yPosition: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    フォントサイズ (px)
                  </label>
                  <input
                    type="number"
                    value={selectedField.fontSize}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    太さ
                  </label>
                  <select
                    value={selectedField.fontWeight}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        fontWeight: Number(e.target.value) as 400 | 700 | 900,
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  >
                    <option value={400}>通常 (400)</option>
                    <option value={700}>太字 (700)</option>
                    <option value={900}>極太 (900)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    フォントカラー
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={selectedField.fontColor}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          fontColor: e.target.value,
                        })
                      }
                      className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedField.fontColor}
                      onChange={(e) =>
                        updateField(selectedField.id, {
                          fontColor: e.target.value,
                        })
                      }
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    寄せ
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() =>
                          updateField(selectedField.id, { textAlign: align })
                        }
                        className={`py-1 rounded text-xs transition-colors ${
                          selectedField.textAlign === align
                            ? "bg-primary text-white font-bold"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {align === "left" ? "左" : align === "center" ? "中央" : "右"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    文字間隔 (px)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={selectedField.letterSpacing ?? 0}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        letterSpacing: Number(e.target.value),
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  />
                  <span className="text-[10px] text-gray-300">
                    マイナス値で詰め、プラス値で広げる
                  </span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    接尾辞
                  </label>
                  <input
                    type="text"
                    value={selectedField.suffix}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        suffix: e.target.value,
                      })
                    }
                    placeholder="例：円"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:border-primary outline-none"
                  />
                </div>
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="w-full text-red-400 border border-red-200 rounded-lg px-2 py-1.5 text-xs hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  このエリアを削除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
