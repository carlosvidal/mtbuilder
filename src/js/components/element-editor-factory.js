import { HeadingEditor } from "./editors/heading-editor.js";
import { ImageEditor } from "./editors/image-editor.js";
import { ButtonEditor } from "./editors/button-editor.js";
import { LinkEditor } from "./editors/link-editor.js";
import { DividerEditor } from "./editors/divider-editor.js";
import { HtmlEditor } from "./editors/html-editor.js";
import { TextEditor } from "./editors/text-editor.js";
import { TableEditor } from "./editors/table-editor.js";
import { ListEditor } from "./editors/list-editor.js";
import { VideoEditor } from "./editors/video-editor.js";
import { SpacerEditor } from "./editors/spacer-editor.js";
import { ContainerEditor } from "./editors/container-editor.js";

// Registry of element types: type → { editorClass, icon, label, category }
const registry = new Map();

export class ElementEditorFactory {
  static register(type, editorClass, meta = {}) {
    registry.set(type, { editorClass, ...meta });
  }

  static unregister(type) {
    registry.delete(type);
  }

  static createEditor(elementType) {
    if (elementType === "row") return null;

    const entry = registry.get(elementType);
    if (!entry) {
      throw new Error(`No editor available for element type: ${elementType}`);
    }
    return new entry.editorClass();
  }

  static getRegisteredTypes() {
    return Array.from(registry.entries()).map(([type, meta]) => ({
      type,
      icon: meta.icon || null,
      label: meta.label || type,
      category: meta.category || "basic",
    }));
  }

  static has(type) {
    return registry.has(type);
  }

  static clear() {
    registry.clear();
  }
}

// Register built-in editors
ElementEditorFactory.register("heading", HeadingEditor, { category: "basic" });
ElementEditorFactory.register("text", TextEditor, { category: "basic" });
ElementEditorFactory.register("image", ImageEditor, { category: "media" });
ElementEditorFactory.register("button", ButtonEditor, { category: "basic" });
ElementEditorFactory.register("link", LinkEditor, { category: "basic" });
ElementEditorFactory.register("divider", DividerEditor, { category: "layout" });
ElementEditorFactory.register("html", HtmlEditor, { category: "advanced" });
ElementEditorFactory.register("table", TableEditor, { category: "basic" });
ElementEditorFactory.register("list", ListEditor, { category: "basic" });
ElementEditorFactory.register("video", VideoEditor, { category: "media" });
ElementEditorFactory.register("spacer", SpacerEditor, { category: "layout" });
ElementEditorFactory.register("container", ContainerEditor, { category: "layout" });
