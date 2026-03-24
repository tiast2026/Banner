import { Template, GeneratedBanner, Preset, SheetConfig } from "./types";

const TEMPLATES_KEY = "banner_templates";
const BANNERS_KEY = "banner_generated";
const PRESETS_KEY = "banner_presets";

function getItem<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

function setItem<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Templates
export function getTemplates(): Template[] {
  return getItem<Template>(TEMPLATES_KEY);
}

export function getTemplate(id: string): Template | undefined {
  return getTemplates().find((t) => t.id === id);
}

export function saveTemplate(template: Template): void {
  const templates = getTemplates();
  const idx = templates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    templates[idx] = template;
  } else {
    templates.push(template);
  }
  setItem(TEMPLATES_KEY, templates);
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter((t) => t.id !== id);
  setItem(TEMPLATES_KEY, templates);
}

// Generated banners
export function getGeneratedBanners(): GeneratedBanner[] {
  return getItem<GeneratedBanner>(BANNERS_KEY);
}

export function saveGeneratedBanner(banner: GeneratedBanner): void {
  const banners = getGeneratedBanners();
  banners.unshift(banner);
  // Keep last 100
  setItem(BANNERS_KEY, banners.slice(0, 100));
}

export function deleteGeneratedBanner(id: string): void {
  const banners = getGeneratedBanners().filter((b) => b.id !== id);
  setItem(BANNERS_KEY, banners);
}

export function clearGeneratedBanners(): void {
  setItem(BANNERS_KEY, []);
}

// Presets
export function getPresets(templateId?: string): Preset[] {
  const all = getItem<Preset>(PRESETS_KEY);
  if (templateId) return all.filter((p) => p.templateId === templateId);
  return all;
}

export function savePreset(preset: Preset): void {
  const presets = getItem<Preset>(PRESETS_KEY);
  presets.push(preset);
  setItem(PRESETS_KEY, presets);
}

export function deletePreset(id: string): void {
  const presets = getItem<Preset>(PRESETS_KEY).filter((p) => p.id !== id);
  setItem(PRESETS_KEY, presets);
}

// Sheet configs
const SHEET_CONFIGS_KEY = "banner_sheet_configs";

export function getSheetConfigs(): SheetConfig[] {
  return getItem<SheetConfig>(SHEET_CONFIGS_KEY);
}

export function getSheetConfig(templateId: string): SheetConfig | undefined {
  return getSheetConfigs().find((c) => c.templateId === templateId);
}

export function saveSheetConfig(config: SheetConfig): void {
  const configs = getSheetConfigs();
  const idx = configs.findIndex((c) => c.id === config.id);
  if (idx >= 0) {
    configs[idx] = config;
  } else {
    configs.push(config);
  }
  setItem(SHEET_CONFIGS_KEY, configs);
}

export function deleteSheetConfig(id: string): void {
  const configs = getSheetConfigs().filter((c) => c.id !== id);
  setItem(SHEET_CONFIGS_KEY, configs);
}
