import { BaseElementEditor } from "./base-element-editor.js";
import { sanitizeHTML } from "../../utils/sanitize.js";

export class HtmlEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <div class="editor-container">
          <div class="editor-section">
            <h3>HTML Personalizado</h3>
            <div class="form-group">
              <label>Código HTML</label>
              <textarea 
                data-property="content" 
                rows="10" 
                placeholder="<div>Tu código HTML aquí</div>"
              >${this.currentElement.content || ""}</textarea>
            </div>
            <div class="form-group">
              <label>Vista previa</label>
              <div class="preview-container" style="padding: 1rem; border: 1px solid #ddd; border-radius: 4px; margin-top: 0.5rem;">
                ${sanitizeHTML(this.currentElement.content) || "<em>Sin contenido</em>"}
              </div>
            </div>
          </div>
          ${this.renderSpacingEditor()}
          ${this.renderBorderEditor()}
        </div>
      `;
  }

  setupEventListeners() {
    super.setupEventListeners();

    // Actualizar la vista previa cuando se modifica el HTML
    const textarea = this.shadowRoot.querySelector(
      'textarea[data-property="content"]'
    );
    const previewContainer =
      this.shadowRoot.querySelector(".preview-container");

    if (textarea && previewContainer) {
      textarea.addEventListener("input", (e) => {
        previewContainer.innerHTML = sanitizeHTML(e.target.value) || "<em>Sin contenido</em>";
      });
    }
  }
}
customElements.define("html-editor", HtmlEditor);
