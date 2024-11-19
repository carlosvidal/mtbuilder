import { BaseElementEditor } from "./base-element-editor.js";

export class ImageEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <div class="editor-container">
          <div class="editor-section">
            <h3>Imagen</h3>
            <div class="form-group">
              <label>URL de la imagen</label>
              <input type="text" 
                data-property="src" 
                value="${this.currentElement.attributes?.src || ""}"
                placeholder="https://ejemplo.com/imagen.jpg">
            </div>
            <div class="form-group">
              <label>Texto alternativo</label>
              <input type="text" 
                data-property="alt" 
                value="${this.currentElement.attributes?.alt || ""}"
                placeholder="Descripción de la imagen">
            </div>
            <div class="form-group">
              <label>Ajuste</label>
              <select data-property="objectFit">
                <option value="cover" ${
                  this.currentElement.styles.objectFit === "cover"
                    ? "selected"
                    : ""
                }>Cubrir</option>
                <option value="contain" ${
                  this.currentElement.styles.objectFit === "contain"
                    ? "selected"
                    : ""
                }>Contener</option>
                <option value="fill" ${
                  this.currentElement.styles.objectFit === "fill"
                    ? "selected"
                    : ""
                }>Llenar</option>
              </select>
            </div>
          </div>
          ${this.renderSpacingEditor()}
          ${this.renderBorderEditor()}
        </div>
      `;
  }
}
customElements.define("image-editor", ImageEditor);
