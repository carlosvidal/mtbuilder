import { describe, it, expect } from "vitest";
import { ExportUtils } from "../src/js/utils/export-utils.js";

describe("ExportUtils", () => {
  describe("generateStyleString", () => {
    it("converts camelCase to kebab-case", () => {
      const result = ExportUtils.generateStyleString({ fontSize: "16px", backgroundColor: "#fff" });
      expect(result).toBe("font-size: 16px; background-color: #fff");
    });

    it("appends px to numeric values", () => {
      const result = ExportUtils.generateStyleString({ marginTop: 10, padding: 20 });
      expect(result).toBe("margin-top: 10px; padding: 20px");
    });

    it("does not append px to zero", () => {
      const result = ExportUtils.generateStyleString({ margin: 0 });
      expect(result).toBe("margin: 0");
    });

    it("does not append px to opacity", () => {
      const result = ExportUtils.generateStyleString({ opacity: 0.5 });
      expect(result).toBe("opacity: 0.5");
    });

    it("does not append px to flex", () => {
      const result = ExportUtils.generateStyleString({ flex: 1 });
      expect(result).toBe("flex: 1");
    });

    it("does not append px to font-weight", () => {
      const result = ExportUtils.generateStyleString({ fontWeight: 700 });
      expect(result).toBe("font-weight: 700");
    });

    it("returns empty string for empty object", () => {
      expect(ExportUtils.generateStyleString({})).toBe("");
    });

    it("returns empty string for null/undefined", () => {
      expect(ExportUtils.generateStyleString(null)).toBe("");
      expect(ExportUtils.generateStyleString(undefined)).toBe("");
    });
  });

  describe("generateHTML", () => {
    it("returns empty string for null data", () => {
      expect(ExportUtils.generateHTML(null)).toBe("");
      expect(ExportUtils.generateHTML({})).toBe("");
    });

    it("renders a heading element", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{ id: "e1", type: "heading", tag: "h1", content: "Hello", styles: {} }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("<h1");
      expect(html).toContain("Hello");
      expect(html).toContain("</h1>");
    });

    it("renders a text element", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{ id: "e1", type: "text", content: "Some text", styles: {} }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("Some text");
      expect(html).toContain("<div");
    });

    it("renders an image element with attributes", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "image",
              attributes: { src: "img.jpg", alt: "test" },
              styles: {}
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain('src="img.jpg"');
      expect(html).toContain('alt="test"');
      expect(html).toContain("max-width: 100%");
    });

    it("renders a button element as a link", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "button", content: "Click me",
              attributes: { href: "https://example.com", target: "_blank" },
              styles: {}
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain("Click me");
    });

    it("renders a video element with iframe", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "video",
              attributes: { src: "https://youtube.com/embed/123" },
              styles: {}
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("<iframe");
      expect(html).toContain("youtube.com/embed/123");
      expect(html).toContain("allowfullscreen");
    });

    it("renders a divider as hr", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{ id: "e1", type: "divider", styles: { borderColor: "red" } }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("<hr");
      expect(html).toContain("border-color: red");
    });

    it("renders a list element", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "list", tag: "ol", content: "Item 1\nItem 2",
              styles: {}
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("<ol");
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
    });

    it("renders html element with sanitization", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "html",
              content: '<p>Safe</p><script>alert("xss")</script>',
              styles: {}
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("<p>Safe</p>");
      expect(html).not.toContain("<script>");
    });

    it("wraps element with wrapperStyles", () => {
      const data = {
        rows: [{
          id: "r1",
          columns: [{
            id: "c1",
            elements: [{
              id: "e1", type: "text", content: "Wrapped",
              styles: {},
              wrapperStyles: { justifyContent: "center" }
            }]
          }],
          styles: {}
        }]
      };
      const html = ExportUtils.generateHTML(data);
      expect(html).toContain("justify-content: center");
    });
  });

  describe("generateExportableHTML", () => {
    it("generates a full HTML document", () => {
      const data = {
        rows: [],
        globalSettings: { maxWidth: "800px", fontFamily: "Arial" }
      };
      const html = ExportUtils.generateExportableHTML(data);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("max-width: 800px");
      expect(html).toContain("font-family: Arial");
    });

    it("uses default global settings when not provided", () => {
      const html = ExportUtils.generateExportableHTML({ rows: [] });
      expect(html).toContain("max-width: 1200px");
      expect(html).toContain("system-ui");
    });
  });

  describe("generatePreviewHTML", () => {
    it("returns empty for null data", () => {
      expect(ExportUtils.generatePreviewHTML(null)).toBe("");
    });

    it("generates wrapper div with global styles", () => {
      const data = {
        rows: [],
        globalSettings: { backgroundColor: "#f0f0f0" }
      };
      const html = ExportUtils.generatePreviewHTML(data);
      expect(html).toContain("background-color: #f0f0f0");
    });
  });

  describe("generateResponsiveStyles", () => {
    it("returns empty for rows without responsive config", () => {
      const rows = [{ id: "r1", columns: [{ elements: [] }] }];
      expect(ExportUtils.generateResponsiveStyles(rows)).toBe("");
    });

    it("returns empty when desktop equals mobile", () => {
      const rows = [{ id: "r1", responsive: { desktop: 1, mobile: 1 }, columns: [{ elements: [] }] }];
      expect(ExportUtils.generateResponsiveStyles(rows)).toBe("");
    });

    it("generates media query for responsive rows", () => {
      const rows = [{
        id: "r1",
        responsive: { desktop: 2, mobile: 1 },
        columns: [{ elements: [] }, { elements: [] }]
      }];
      const css = ExportUtils.generateResponsiveStyles(rows);
      expect(css).toContain("@media (max-width: 768px)");
      expect(css).toContain(".mt-row-d2-m1");
      expect(css).toContain("100.0000%");
    });

    it("collects classes from nested row elements", () => {
      const rows = [{
        id: "r1",
        columns: [{
          elements: [{
            id: "nested",
            type: "row",
            responsive: { desktop: 3, mobile: 1 },
            columns: [{ elements: [] }]
          }]
        }]
      }];
      const css = ExportUtils.generateResponsiveStyles(rows);
      expect(css).toContain(".mt-row-d3-m1");
    });
  });

  describe("formatHTML", () => {
    it("indents nested tags", () => {
      const html = "<div><p>Hello</p></div>";
      const formatted = ExportUtils.formatHTML(html);
      expect(formatted).toContain("  <p>");
    });

    it("handles self-closing tags", () => {
      const html = "<div><img src='test.jpg'><br></div>";
      const formatted = ExportUtils.formatHTML(html);
      expect(formatted).toContain("<img");
    });
  });
});
