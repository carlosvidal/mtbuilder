// register-editors.js
function ensureElementIsDefined(name, elementClass) {
  if (!customElements.get(name)) {
    customElements.define(name, elementClass);
  }
}

export function registerEditors() {
  import("./editors/base-element-editor.js").then(() => {
    Promise.all([
      import("./element-editor.js"),
      import("./editors/heading-editor.js"),
      import("./editors/image-editor.js"),
      import("./editors/button-editor.js"),
      import("./editors/divider-editor.js"),
      import("./editors/html-editor.js"),
      import("./editors/text-editor.js"),
    ]).then(
      ([
        { ElementEditor },
        { HeadingEditor },
        { ImageEditor },
        { ButtonEditor },
        { DividerEditor },
        { HtmlEditor },
        { TextEditor },
      ]) => {
        ensureElementIsDefined("element-editor", ElementEditor);
        ensureElementIsDefined("heading-editor", HeadingEditor);
        ensureElementIsDefined("image-editor", ImageEditor);
        ensureElementIsDefined("button-editor", ButtonEditor);
        ensureElementIsDefined("divider-editor", DividerEditor);
        ensureElementIsDefined("html-editor", HtmlEditor);
        ensureElementIsDefined("text-editor", TextEditor);
      }
    );
  });
}
