// table-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class TableEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Tabla</h3>
          <div class="form-group">
            <label>Filas</label>
            <input type="number" 
              data-property="rows" 
              value="${this.currentElement.attributes?.rows || 2}"
              min="1" max="20">
          </div>
          <div class="form-group">
            <label>Columnas</label>
            <input type="number" 
              data-property="columns" 
              value="${this.currentElement.attributes?.columns || 2}"
              min="1" max="10">
          </div>
          <div class="form-group">
            <label>Borde de la tabla</label>
            <input type="number" 
              data-property="borderWidth" 
              value="${parseInt(this.currentElement.styles?.borderWidth) || 1}"
              min="0" max="10">
          </div>
          <div class="form-group">
            <label>Color del borde</label>
            <input type="color" 
              data-property="borderColor" 
              value="${this.currentElement.styles?.borderColor || "#dddddd"}">
          </div>
          <div class="form-group">
            <label>Padding de celdas (px)</label>
            <input type="number" 
              data-property="cellPadding" 
              value="${parseInt(this.currentElement.styles?.cellPadding) || 8}"
              min="0" max="40">
          </div>
          <div class="form-group">  
            <label>Estilo de cabecera</label>
            <select data-property="headerStyle">
              <option value="none" ${
                !this.currentElement.attributes?.headerStyle ? "selected" : ""
              }>Sin cabecera</option>
              <option value="top" ${
                this.currentElement.attributes?.headerStyle === "top"
                  ? "selected"
                  : ""
              }>Primera fila</option>
              <option value="left" ${
                this.currentElement.attributes?.headerStyle === "left"
                  ? "selected"
                  : ""
              }>Primera columna</option>
              <option value="both" ${
                this.currentElement.attributes?.headerStyle === "both"
                  ? "selected"
                  : ""
              }>Ambos</option>
            </select>
          </div>
        </div>
        ${this.renderTextStylesEditor()}
        ${this.renderBackgroundEditor()}
        ${this.renderSpacingEditor()}
      </div>
    `;
  }
}
customElements.define("table-editor", TableEditor);
