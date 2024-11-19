import { BaseElementEditor } from "./base-element-editor.js";

export class HeadingEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Encabezado</h3>
          <div class="form-group">
            <label>Nivel del encabezado</label>
            <select data-property="tag">
              ${["h1", "h2", "h3", "h4", "h5", "h6"]
                .map(
                  (tag) => `
                  <option value="${tag}" ${
                    this.currentElement.tag === tag ? "selected" : ""
                  }>
                    ${tag.toUpperCase()}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Texto del encabezado</label>
            <input type="text" 
              data-property="content" 
              value="${this.currentElement.content || ""}"
              placeholder="Texto del encabezado">
          </div>
        </div>
        ${this.renderTextStylesEditor()}
        ${this.renderBackgroundEditor()}
        ${this.renderSpacingEditor()}
      </div>
    `;
  }
}
customElements.define("heading-editor", HeadingEditor);
