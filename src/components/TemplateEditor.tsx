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
        // SVGの場合、テキストからviewBox/width/heightを解析
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
        <h2 className="text-2xl font-bold">
          {templateId ? "テンプレート編集" : "テンプレート作成"}
        </h2>
        <button
          onClick={handleSave}
          className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary-dark transition-colors"
        >
          保存
        </button>
      </div>

      <div className="grid grid-cols-[1fr,300px] gap-6">
        {/* Left: Canvas area */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  テンプレート名
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：カードリーダー"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  背景画像
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleImageUpload}
                  className="text-sm"
                />
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
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
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
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview canvas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold">プレビュー</span>
              <button
                onClick={addField}
                className="bg-primary text-white px-3 py-1 rounded text-xs font-bold"
              >
                + テキストエリア追加
              </button>
            </div>
            <div
              ref={canvasRef}
              className="relative border border-gray-300 overflow-hidden select-none"
              style={{ aspectRatio: `${width}/${height}` }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {bgImage && (
                <img
                  src={bgImage}
                  alt="背景"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />
              )}
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
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`absolute cursor-move whitespace-nowrap ${
                      selectedFieldId === field.id
                        ? "outline outline-2 outline-primary outline-offset-2"
                        : ""
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
                    }}
                  >
                    {sampleVal || field.fieldName}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Properties panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-bold text-sm mb-3">テキストエリア一覧</h3>
            {fields.length === 0 ? (
              <p className="text-xs text-gray-400">
                テキストエリアを追加してください
              </p>
            ) : (
              <ul className="space-y-1">
                {fields.map((f) => (
                  <li
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-2 py-1 rounded text-sm cursor-pointer ${
                      selectedFieldId === f.id
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {f.fieldName}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedField && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold text-sm mb-3">プロパティ</h3>
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
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="price">price（価格）</option>
                    <option value="percent">percent（割引率）</option>
                    <option value="period">period（期間）</option>
                    <option value="text">text（テキスト）</option>
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
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
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
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value={400}>400（通常）</option>
                    <option value={700}>700（太字）</option>
                    <option value={900}>900（極太）</option>
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
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    寄せ
                  </label>
                  <select
                    value={selectedField.textAlign}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        textAlign: e.target.value as "left" | "center" | "right",
                      })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="left">左寄せ</option>
                    <option value="center">中央</option>
                    <option value="right">右寄せ</option>
                  </select>
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
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="w-full text-red-500 border border-red-300 rounded px-2 py-1 text-sm hover:bg-red-50"
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
