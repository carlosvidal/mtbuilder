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
    console.log("Setting element:", element);
    this.currentElement = element;
    this.render();
  }

  render() {
    if (!this.currentElement) {
      this.shadowRoot.innerHTML = `
        <style>
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
      console.log("Creating editor for type:", this.currentElement.type);

      if (this.currentEditor) {
        console.log("Removing previous editor");
        this.shadowRoot.removeChild(this.currentEditor);
      }

      this.currentEditor = ElementEditorFactory.createEditor(
        this.currentElement.type
      );
      console.log("Created editor:", this.currentEditor);

      this.currentEditor.setElement(this.currentElement);
      console.log("Editor element set");

      this.shadowRoot.appendChild(this.currentEditor);
      console.log("Editor appended to shadow root");
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
