// element-editor.js
import { ElementEditorFactory } from "./element-editor-factory.js";

class ElementEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentElement = null;
    this.currentEditor = null;
  }

  setElement(element) {
    this.currentElement = element;
    this.render();
  }

  render() {
    if (!this.currentElement) {
      this.shadowRoot.innerHTML = `
        <style>

          * {
            box-sizing: border-box;
          }
            
          .no-selection {
            padding: 2rem;
            text-align: center;
            color: #666;
          }
        </style>
        <div class="no-selection">Selecciona un elemento para editar</div>
      `;
      return;
    }

    try {

      if (this.currentEditor) {
        this.shadowRoot.removeChild(this.currentEditor);
      }

      this.currentEditor = ElementEditorFactory.createEditor(
        this.currentElement.type
      );

      if (!this.currentEditor) {
        // No editor for this element type (e.g., nested rows)
        return;
      }

      this.currentEditor.setElement(this.currentElement);

      this.shadowRoot.appendChild(this.currentEditor);
    } catch (error) {
      console.error("Error creating editor:", error);
      console.error("Stack trace:", error.stack);
      this.shadowRoot.innerHTML = `
        <div class="no-selection">
          No se pudo crear el editor para el tipo: ${this.currentElement.type}
        </div>
      `;
    }
  }
}

customElements.define("element-editor", ElementEditor);
export { ElementEditor };
