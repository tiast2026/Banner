import { describe, it, expect, beforeEach } from "vitest";
import {
  getTemplates,
  saveTemplate,
  getTemplate,
  deleteTemplate,
  getGeneratedBanners,
  saveGeneratedBanner,
  getPresets,
  savePreset,
  deletePreset,
} from "@/lib/storage";
import { Template, GeneratedBanner, Preset } from "@/lib/types";

beforeEach(() => {
  localStorage.clear();
});

const makeTemplate = (id: string, name: string): Template => ({
  id,
  name,
  width: 1080,
  height: 210,
  backgroundImageDataUrl: "data:image/png;base64,test",
  fields: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("Template storage", () => {
  it("starts empty", () => {
    expect(getTemplates()).toEqual([]);
  });

  it("saves and retrieves a template", () => {
    const t = makeTemplate("t1", "Test Template");
    saveTemplate(t);
    expect(getTemplates()).toHaveLength(1);
    expect(getTemplate("t1")?.name).toBe("Test Template");
  });

  it("updates existing template", () => {
    const t = makeTemplate("t1", "Original");
    saveTemplate(t);
    saveTemplate({ ...t, name: "Updated" });
    expect(getTemplates()).toHaveLength(1);
    expect(getTemplate("t1")?.name).toBe("Updated");
  });

  it("deletes a template", () => {
    saveTemplate(makeTemplate("t1", "A"));
    saveTemplate(makeTemplate("t2", "B"));
    deleteTemplate("t1");
    expect(getTemplates()).toHaveLength(1);
    expect(getTemplate("t1")).toBeUndefined();
  });
});

describe("Generated banner storage", () => {
  it("saves banners in reverse order", () => {
    const b1: GeneratedBanner = {
      id: "b1",
      templateId: "t1",
      templateName: "T1",
      parameters: {},
      imageDataUrl: "data:image/png;base64,1",
      createdAt: "2025-01-01T00:00:00Z",
    };
    const b2: GeneratedBanner = {
      id: "b2",
      templateId: "t1",
      templateName: "T1",
      parameters: {},
      imageDataUrl: "data:image/png;base64,2",
      createdAt: "2025-01-02T00:00:00Z",
    };
    saveGeneratedBanner(b1);
    saveGeneratedBanner(b2);
    const banners = getGeneratedBanners();
    expect(banners).toHaveLength(2);
    expect(banners[0].id).toBe("b2");
  });
});

describe("Preset storage", () => {
  it("saves and filters presets by templateId", () => {
    const p1: Preset = { id: "p1", templateId: "t1", name: "Preset A", parameters: {} };
    const p2: Preset = { id: "p2", templateId: "t2", name: "Preset B", parameters: {} };
    savePreset(p1);
    savePreset(p2);
    expect(getPresets("t1")).toHaveLength(1);
    expect(getPresets()).toHaveLength(2);
  });

  it("deletes a preset", () => {
    const p: Preset = { id: "p1", templateId: "t1", name: "Preset", parameters: {} };
    savePreset(p);
    deletePreset("p1");
    expect(getPresets()).toHaveLength(0);
  });
});
