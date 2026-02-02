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

export class ElementEditorFactory {
  static createEditor(elementType) {
    switch (elementType) {
      case "heading":
        return new HeadingEditor();
      case "image":
        return new ImageEditor();
      case "button":
        return new ButtonEditor();
      case "link":
        return new LinkEditor();
      case "divider":
        return new DividerEditor();
      case "html":
        return new HtmlEditor();
      case "text":
        return new TextEditor();
      case "table":
        return new TableEditor();
      case "list":
        return new ListEditor();
      case "video":
        return new VideoEditor();
      case "spacer":
        return new SpacerEditor();
      case "container":
        return new ContainerEditor();
      case "row":
        return null;
      default:
        throw new Error(`No editor available for element type: ${elementType}`);
    }
  }
}
