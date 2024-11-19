import { BaseElementEditor } from "./base-element-editor.js";

export class TextEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <div class="editor-container">
          <div class="editor-section">
            <h3>Texto</h3>
            <div class="form-group">
              <label>Contenido</label>
              <textarea 
                data-property="content" 
                rows="4" 
                placeholder="Escribe tu texto aquí"
              >${this.currentElement.content || ""}</textarea>
            </div>
          </div>
          ${this.renderTextStylesEditor()}
          ${this.renderBackgroundEditor()}
          ${this.renderSpacingEditor()}
          ${this.renderBorderEditor()}
        </div>
      `;
  }
}
customElements.define("text-editor", TextEditor);
