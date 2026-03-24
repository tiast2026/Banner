export interface TemplateField {
  id: string;
  fieldName: string;
  fieldType: "price" | "percent" | "period" | "text";
  xPosition: number;
  yPosition: number;
  fontSize: number;
  fontWeight: 400 | 700 | 900;
  fontColor: string;
  textAlign: "left" | "center" | "right";
  letterSpacing: number;
  suffix: string;
  sortOrder: number;
}

export interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundImageDataUrl: string;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedBanner {
  id: string;
  templateId: string;
  templateName: string;
  parameters: Record<string, string>;
  imageDataUrl: string;
  createdAt: string;
}

export interface Preset {
  id: string;
  templateId: string;
  name: string;
  parameters: Record<string, string>;
}

export interface SheetConfig {
  id: string;
  templateId: string;
  templateName: string;
  spreadsheetUrl: string;
  sheetName: string;
  fieldMapping: Record<string, string>; // templateFieldName -> sheetColumnName
  createdAt: string;
  updatedAt: string;
}
