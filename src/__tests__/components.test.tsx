import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BannerPreview } from "@/components/BannerPreview";
import { Template } from "@/lib/types";

const mockTemplate: Template = {
  id: "t1",
  name: "Test",
  width: 500,
  height: 100,
  backgroundImageDataUrl: "",
  fields: [
    {
      id: "f1",
      fieldName: "通常価格",
      fieldType: "price",
      xPosition: 10,
      yPosition: 20,
      fontSize: 24,
      fontWeight: 700,
      fontColor: "#333333",
      textAlign: "left",
      suffix: "円",
      sortOrder: 0,
    },
    {
      id: "f2",
      fieldName: "割引率",
      fieldType: "percent",
      xPosition: 100,
      yPosition: 20,
      fontSize: 48,
      fontWeight: 900,
      fontColor: "#2ca6e0",
      textAlign: "left",
      suffix: "",
      sortOrder: 1,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("BannerPreview", () => {
  it("renders formatted price", () => {
    render(
      <BannerPreview template={mockTemplate} values={{ "通常価格": "3580", "割引率": "20" }} />
    );
    expect(screen.getByText("3,580円")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders empty when no values", () => {
    const { container } = render(
      <BannerPreview template={mockTemplate} values={{}} />
    );
    // Fields exist but with empty/default content
    expect(container.querySelector("div")).toBeTruthy();
  });
});
