import { BaseElementEditor } from "./base-element-editor.js";

export class ButtonEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <div class="editor-container">
          <div class="editor-section">
            <h3>Botón</h3>
            <div class="form-group">
              <label>Texto del botón</label>
              <input type="text" 
                data-property="content" 
                value="${this.currentElement.content || ""}"
                placeholder="Texto del botón">
            </div>
            <div class="form-group">
              <label>Enlace</label>
              <input type="text" 
                data-property="href" 
                value="${this.currentElement.attributes?.href || ""}"
                placeholder="https://ejemplo.com">
            </div>
            <div class="form-group">
              <label>Tipo de botón</label>
              <select data-property="type">
                <option value="button" ${
                  this.currentElement.attributes?.type === "button"
                    ? "selected"
                    : ""
                }>Normal</option>
                <option value="submit" ${
                  this.currentElement.attributes?.type === "submit"
                    ? "selected"
                    : ""
                }>Enviar</option>
              </select>
            </div>
          </div>
          ${this.renderTextStylesEditor()}
          ${this.renderBackgroundEditor()}
          ${this.renderWrapperEditor()}
          ${this.renderBorderEditor()}
          ${this.renderSpacingEditor()}
        </div>
      `;
  }
}
customElements.define("button-editor", ButtonEditor);
