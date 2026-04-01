import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { ElementEditorFactory } from "../src/js/components/element-editor-factory.js";
import { HeadingEditor } from "../src/js/components/editors/heading-editor.js";
import { ImageEditor } from "../src/js/components/editors/image-editor.js";
import { ButtonEditor } from "../src/js/components/editors/button-editor.js";
import { LinkEditor } from "../src/js/components/editors/link-editor.js";
import { DividerEditor } from "../src/js/components/editors/divider-editor.js";
import { HtmlEditor } from "../src/js/components/editors/html-editor.js";
import { TextEditor } from "../src/js/components/editors/text-editor.js";
import { TableEditor } from "../src/js/components/editors/table-editor.js";
import { ListEditor } from "../src/js/components/editors/list-editor.js";
import { VideoEditor } from "../src/js/components/editors/video-editor.js";
import { SpacerEditor } from "../src/js/components/editors/spacer-editor.js";
import { ContainerEditor } from "../src/js/components/editors/container-editor.js";

// Register all custom elements needed by the factory
beforeAll(() => {
  const editors = {
    "heading-editor": HeadingEditor,
    "image-editor": ImageEditor,
    "button-editor": ButtonEditor,
    "link-editor": LinkEditor,
    "divider-editor": DividerEditor,
    "html-editor": HtmlEditor,
    "text-editor": TextEditor,
    "table-editor": TableEditor,
    "list-editor": ListEditor,
    "video-editor": VideoEditor,
    "spacer-editor": SpacerEditor,
    "container-editor": ContainerEditor,
  };
  Object.entries(editors).forEach(([name, cls]) => {
    if (!customElements.get(name)) {
      customElements.define(name, cls);
    }
  });
});

describe("ElementEditorFactory", () => {
  const supportedTypes = [
    "heading", "image", "button", "link", "divider",
    "html", "text", "table", "list", "video", "spacer", "container"
  ];

  describe("createEditor", () => {
    it.each(supportedTypes)("creates editor for '%s' type", (type) => {
      const editor = ElementEditorFactory.createEditor(type);
      expect(editor).toBeDefined();
      expect(editor).not.toBeNull();
    });

    it("returns null for 'row' type", () => {
      const editor = ElementEditorFactory.createEditor("row");
      expect(editor).toBeNull();
    });

    it("throws for unknown element type", () => {
      expect(() => ElementEditorFactory.createEditor("unknown")).toThrow(
        "No editor available for element type: unknown"
      );
    });

    it("throws for empty string type", () => {
      expect(() => ElementEditorFactory.createEditor("")).toThrow();
    });
  });

  describe("registry API", () => {
    it("has() returns true for registered types", () => {
      supportedTypes.forEach((type) => {
        expect(ElementEditorFactory.has(type)).toBe(true);
      });
    });

    it("has() returns false for unregistered types", () => {
      expect(ElementEditorFactory.has("nonexistent")).toBe(false);
    });

    it("getRegisteredTypes() returns all registered types with metadata", () => {
      const types = ElementEditorFactory.getRegisteredTypes();
      expect(types.length).toBeGreaterThanOrEqual(12);
      types.forEach((entry) => {
        expect(entry).toHaveProperty("type");
        expect(entry).toHaveProperty("category");
        expect(entry).toHaveProperty("label");
      });
    });

    it("register() adds a new type", () => {
      // Use a mock class for testing
      class MockEditor extends HTMLElement { constructor() { super(); } }
      if (!customElements.get("mock-editor")) {
        customElements.define("mock-editor", MockEditor);
      }

      ElementEditorFactory.register("mock", MockEditor, { category: "test", label: "Mock" });
      expect(ElementEditorFactory.has("mock")).toBe(true);

      const types = ElementEditorFactory.getRegisteredTypes();
      const mockEntry = types.find((t) => t.type === "mock");
      expect(mockEntry).toBeDefined();
      expect(mockEntry.category).toBe("test");
      expect(mockEntry.label).toBe("Mock");

      // Cleanup
      ElementEditorFactory.unregister("mock");
    });

    it("unregister() removes a type", () => {
      class TempEditor extends HTMLElement { constructor() { super(); } }
      if (!customElements.get("temp-editor")) {
        customElements.define("temp-editor", TempEditor);
      }

      ElementEditorFactory.register("temp", TempEditor);
      expect(ElementEditorFactory.has("temp")).toBe(true);

      ElementEditorFactory.unregister("temp");
      expect(ElementEditorFactory.has("temp")).toBe(false);
    });

    it("getRegisteredTypes() includes correct categories for built-in types", () => {
      const types = ElementEditorFactory.getRegisteredTypes();
      const imageEntry = types.find((t) => t.type === "image");
      expect(imageEntry.category).toBe("media");

      const dividerEntry = types.find((t) => t.type === "divider");
      expect(dividerEntry.category).toBe("layout");

      const headingEntry = types.find((t) => t.type === "heading");
      expect(headingEntry.category).toBe("basic");
    });
  });
});
