import { Template } from "./types";
import { formatFieldValue } from "./format";

/**
 * Canvas API でバナーを直接描画し、data URL を返す。
 * html2canvas を使わないため、配置やフォントが正確に再現される。
 */
export async function renderBannerToDataUrl(
  template: Template,
  values: Record<string, string>
): Promise<string> {
  // Ensure fonts are loaded
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load("400 16px 'Noto Sans JP'"),
    document.fonts.load("700 16px 'Noto Sans JP'"),
    document.fonts.load("900 16px 'Noto Sans JP'"),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const ctx = canvas.getContext("2d")!;

  // Draw background image
  if (template.backgroundImageDataUrl) {
    const img = await loadImage(template.backgroundImageDataUrl);
    ctx.drawImage(img, 0, 0, template.width, template.height);
  }

  // Draw each text field
  for (const field of template.fields) {
    const raw = values[field.fieldName] || "";
    const display = formatFieldValue(field.fieldType, raw, field.suffix, values);
    if (!display) continue;

    const weight = field.fontWeight;
    const size = field.fontSize;
    ctx.font = `${weight} ${size}px 'Noto Sans JP', sans-serif`;
    ctx.fillStyle = field.fontColor;
    ctx.textBaseline = "top";

    // Apply letter spacing by drawing character by character if non-zero
    const spacing = field.letterSpacing ?? 0;
    let x = field.xPosition;
    const y = field.yPosition;

    if (field.textAlign === "center" || field.textAlign === "right") {
      const totalWidth = measureTextWidth(ctx, display, spacing);
      if (field.textAlign === "center") {
        x -= totalWidth / 2;
      } else {
        x -= totalWidth;
      }
    }

    if (spacing === 0) {
      ctx.fillText(display, x, y);
    } else {
      // Draw each character with custom spacing
      for (const char of display) {
        ctx.fillText(char, x, y);
        x += ctx.measureText(char).width + spacing;
      }
    }
  }

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function measureTextWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  spacing: number
): number {
  if (spacing === 0) {
    return ctx.measureText(text).width;
  }
  let width = 0;
  for (const char of text) {
    width += ctx.measureText(char).width + spacing;
  }
  // Remove the trailing spacing
  return width - spacing;
}
