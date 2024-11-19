// list-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class ListEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Lista</h3>
          <div class="form-group">
            <label>Tipo de lista</label>
            <select data-property="listType">
              <option value="ul" ${
                this.currentElement.tag === "ul" ? "selected" : ""
              }>Lista sin orden</option>
              <option value="ol" ${
                this.currentElement.tag === "ol" ? "selected" : ""
              }>Lista ordenada</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estilo de marcador</label>
            <select data-property="listStyleType">
              ${[
                "disc",
                "circle",
                "square",
                "decimal",
                "decimal-leading-zero",
                "lower-alpha",
                "upper-alpha",
                "lower-roman",
                "upper-roman",
              ]
                .map(
                  (style) => `
                  <option value="${style}" ${
                    this.currentElement.styles?.listStyleType === style
                      ? "selected"
                      : ""
                  }>
                    ${style}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Elementos de la lista</label>
            <textarea 
              data-property="content" 
              rows="6" 
              placeholder="Un elemento por línea"
            >${this.currentElement.content || ""}</textarea>
          </div>
        </div>
        ${this.renderTextStylesEditor()}
        ${this.renderSpacingEditor()}
      </div>
    `;
  }
}
customElements.define("list-editor", ListEditor);
