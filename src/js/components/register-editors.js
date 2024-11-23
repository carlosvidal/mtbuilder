// register-editors.js
import { ElementEditor } from "./element-editor.js";
import { HeadingEditor } from "./editors/heading-editor.js";
import { ImageEditor } from "./editors/image-editor.js";
import { ButtonEditor } from "./editors/button-editor.js";
import { DividerEditor } from "./editors/divider-editor.js";
import { HtmlEditor } from "./editors/html-editor.js";
import { TextEditor } from "./editors/text-editor.js";
import { TableEditor } from "./editors/table-editor.js";
import { ListEditor } from "./editors/list-editor.js";
import { VideoEditor } from "./editors/video-editor.js";
import { SpacerEditor } from "./editors/spacer-editor.js";

export function registerEditors() {
  const editors = {
    "element-editor": ElementEditor,
    "heading-editor": HeadingEditor,
    "image-editor": ImageEditor,
    "button-editor": ButtonEditor,
    "divider-editor": DividerEditor,
    "html-editor": HtmlEditor,
    "text-editor": TextEditor,
    "table-editor": TableEditor,
    "list-editor": ListEditor,
    "video-editor": VideoEditor,
    "spacer-editor": SpacerEditor,
  };

  Object.entries(editors).forEach(([name, EditorClass]) => {
    if (!customElements.get(name)) {
      customElements.define(name, EditorClass);
    }
  });
}
