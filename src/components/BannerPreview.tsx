"use client";

import { forwardRef } from "react";
import { Template } from "@/lib/types";
import { formatFieldValue } from "@/lib/format";

interface Props {
  template: Template;
  values: Record<string, string>;
}

export const BannerPreview = forwardRef<HTMLDivElement, Props>(
  function BannerPreview({ template, values }, ref) {
    return (
      <div
        ref={ref}
        style={{
          position: "relative",
          width: template.width,
          height: template.height,
          overflow: "hidden",
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        {template.backgroundImageDataUrl && (
          <img
            src={template.backgroundImageDataUrl}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: template.width,
              height: template.height,
            }}
            crossOrigin="anonymous"
          />
        )}
        {template.fields.map((field) => {
          const raw = values[field.fieldName] || "";
          const display = formatFieldValue(
            field.fieldType,
            raw,
            field.suffix,
            values
          );
          return (
            <div
              key={field.id}
              style={{
                position: "absolute",
                left: field.xPosition,
                top: field.yPosition,
                fontSize: field.fontSize,
                fontWeight: field.fontWeight,
                color: field.fontColor,
                textAlign: field.textAlign,
                whiteSpace: "nowrap",
                lineHeight: 1,
                letterSpacing: `${field.letterSpacing ?? 0}px`,
                fontFamily: "'Noto Sans JP', sans-serif",
              }}
            >
              {display}
            </div>
          );
        })}
      </div>
    );
  }
);
