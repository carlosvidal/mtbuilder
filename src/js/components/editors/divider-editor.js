import { BaseElementEditor } from "./base-element-editor.js";
export class DividerEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <div class="editor-container">
          <div class="editor-section">
            <h3>Divisor</h3>
            <div class="form-group">
              <label>Estilo de línea</label>
              <select data-property="borderStyle">
                <option value="solid" ${
                  this.currentElement.styles.borderStyle === "solid"
                    ? "selected"
                    : ""
                }>Sólida</option>
                <option value="dashed" ${
                  this.currentElement.styles.borderStyle === "dashed"
                    ? "selected"
                    : ""
                }>Guiones</option>
                <option value="dotted" ${
                  this.currentElement.styles.borderStyle === "dotted"
                    ? "selected"
                    : ""
                }>Puntos</option>
                <option value="double" ${
                  this.currentElement.styles.borderStyle === "double"
                    ? "selected"
                    : ""
                }>Doble</option>
              </select>
            </div>
            <div class="form-group">
              <label>Color</label>
              <input type="color" 
                data-property="borderColor" 
                value="${this.currentElement.styles.borderColor || "#000000"}">
            </div>
            <div class="form-group">
              <label>Grosor (px)</label>
              <input type="number" 
                data-property="borderWidth" 
                value="${parseInt(this.currentElement.styles.borderWidth) || 1}"
                min="1" 
                max="20">
            </div>
            <div class="form-group">
              <label>Ancho (%)</label>
              <input type="number" 
                data-property="width" 
                value="${parseInt(this.currentElement.styles.width) || 100}"
                min="1" 
                max="100">
            </div>
          </div>
          ${this.renderSpacingEditor()}
        </div>
      `;
  }
}
customElements.define("divider-editor", DividerEditor);
