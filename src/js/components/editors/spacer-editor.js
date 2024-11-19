// spacer-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class SpacerEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Espacio</h3>
          <div class="form-group">
            <label>Altura (px)</label>
            <input type="number" 
              data-property="height" 
              value="${parseInt(this.currentElement.styles?.height) || 20}"
              min="1" max="500">
          </div>
          <div class="form-group">
            <label>Color de fondo</label>
            <input type="color" 
              data-property="backgroundColor" 
              value="${
                this.currentElement.styles?.backgroundColor || "#ffffff"
              }">
          </div>
          <div class="form-group">
            <label>¿Mostrar en móvil?</label>
            <select data-property="mobileVisibility">
              <option value="show" ${
                !this.currentElement.styles?.mobileHide ? "selected" : ""
              }>Mostrar</option>
              <option value="hide" ${
                this.currentElement.styles?.mobileHide ? "selected" : ""
              }>Ocultar</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define("spacer-editor", SpacerEditor);
