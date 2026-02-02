// base-element-editor.js
import { eventBus } from "../../utils/event-bus.js";

export class BaseElementEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentElement = null;
    this._debounceTimers = new Map();
  }

  setElement(element) {
    this.currentElement = element;
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot
      .querySelectorAll("input, select, textarea")
      .forEach((input) => {
        const property = input.dataset.property;
        const isAttributeField = ["src", "alt", "href", "target", "type", "aspectRatio", "controls", "autoplay"].includes(property);

        const updateHandler = (e) => {
          if (!this.currentElement) return;

          const prop = e.target.dataset.property;
          const value =
            e.target.type === "checkbox"
              ? e.target.checked
              : e.target.type === "number"
                ? parseFloat(e.target.value)
                : e.target.value;

          this.updateElementProperty(prop, value);
          this.emitUpdateEvent();
        };

        const debouncedUpdateHandler = (e) => {
          if (!this.currentElement) return;

          const prop = e.target.dataset.property;
          const value = e.target.value;

          // Update the local model immediately (no visual lag)
          this.updateElementProperty(prop, value);

          // Debounce the event emission to avoid excessive re-renders
          if (this._debounceTimers.has(prop)) {
            clearTimeout(this._debounceTimers.get(prop));
          }
          this._debounceTimers.set(prop, setTimeout(() => {
            this._debounceTimers.delete(prop);
            this.emitUpdateEvent();
          }, 300));
        };

        if (input.type === "color" || input.type === "range") {
          input.addEventListener("input", updateHandler);
        } else if (input.type === "text" && isAttributeField) {
          // Debounce text inputs for attribute fields (src, alt, href, etc.)
          input.addEventListener("input", debouncedUpdateHandler);
        } else if (input.type === "text") {
          input.addEventListener("input", updateHandler);
        } else {
          input.addEventListener("change", updateHandler);
        }
      });
  }

  updateElementProperty(property, value) {
    if (property === "tag") {
      this.currentElement.tag = value;
    } else if (["src", "alt", "href", "target", "type", "aspectRatio", "controls", "autoplay"].includes(property)) {
      this.currentElement.attributes = {
        ...this.currentElement.attributes,
        [property]: value,
      };
    } else if (property === "content") {
      this.currentElement.content = value;
    } else {
      this.currentElement.styles = {
        ...this.currentElement.styles,
        [property]: value,
      };
    }
  }

  emitUpdateEvent() {
    eventBus.emit("elementUpdated", {
      elementId: this.currentElement.id,
      styles: this.currentElement.styles,
      attributes: this.currentElement.attributes,
      content: this.currentElement.content,
      tag: this.currentElement.tag,
    });
  }

  // Métodos comunes para renderizar secciones de editor
  renderSpacingEditor() {
    return `
        <div class="editor-section">
          <h3>Espaciado</h3>
          <div class="form-group">
            <label>Padding (px)</label>
            <div class="grid-2">
              <input type="number" data-property="paddingTop" placeholder="Top"
                value="${parseInt(this.currentElement.styles.paddingTop) || 0}">
              <input type="number" data-property="paddingRight" placeholder="Right"
                value="${
                  parseInt(this.currentElement.styles.paddingRight) || 0
                }">
              <input type="number" data-property="paddingBottom" placeholder="Bottom"
                value="${
                  parseInt(this.currentElement.styles.paddingBottom) || 0
                }">
              <input type="number" data-property="paddingLeft" placeholder="Left"
                value="${
                  parseInt(this.currentElement.styles.paddingLeft) || 0
                }">
            </div>
          </div>
          <div class="form-group">
            <label>Margin (px)</label>
            <div class="grid-2">
              <input type="number" data-property="marginTop" placeholder="Top"
                value="${parseInt(this.currentElement.styles.marginTop) || 0}">
              <input type="number" data-property="marginRight" placeholder="Right"
                value="${
                  parseInt(this.currentElement.styles.marginRight) || 0
                }">
              <input type="number" data-property="marginBottom" placeholder="Bottom"
                value="${
                  parseInt(this.currentElement.styles.marginBottom) || 0
                }">
              <input type="number" data-property="marginLeft" placeholder="Left"
                value="${parseInt(this.currentElement.styles.marginLeft) || 0}">
            </div>
          </div>
        </div>
      `;
  }

  renderBackgroundEditor() {
    return `
        <div class="editor-section">
          <h3>Fondo</h3>
          <div class="form-group">
            <label>Color de fondo</label>
            <input type="color" 
              data-property="backgroundColor" 
              value="${
                this.currentElement.styles.backgroundColor || "#ffffff"
              }">
          </div>
          <div class="form-group">
            <label>Opacidad</label>
            <input type="range" 
              data-property="opacity" 
              min="0" 
              max="1" 
              step="0.1" 
              value="${this.currentElement.styles.opacity || 1}">
          </div>
        </div>
      `;
  }

  renderBorderEditor() {
    return `
        <div class="editor-section">
          <h3>Borde</h3>
          <div class="form-group">
            <label>Ancho (px)</label>
            <input type="number" 
              data-property="borderWidth" 
              value="${parseInt(this.currentElement.styles.borderWidth) || 0}"
              min="0">
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="color" 
              data-property="borderColor" 
              value="${this.currentElement.styles.borderColor || "#000000"}">
          </div>
          <div class="form-group">
            <label>Estilo</label>
            <select data-property="borderStyle">
              ${["none", "solid", "dashed", "dotted"]
                .map(
                  (style) => `
                  <option value="${style}" ${
                    this.currentElement.styles.borderStyle === style
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
            <label>Radio (px)</label>
            <input type="number" 
              data-property="borderRadius" 
              value="${parseInt(this.currentElement.styles.borderRadius) || 0}"
              min="0">
          </div>
        </div>
      `;
  }

  renderTextStylesEditor() {
    return `
        <div class="editor-section">
          <h3>Estilos de texto</h3>
          <div class="form-group">
            <label>Color</label>
            <input type="color" 
              data-property="color" 
              value="${this.currentElement.styles.color || "#000000"}">
          </div>
          <div class="form-group">
            <label>Tamaño (px)</label>
            <input type="number" 
              data-property="fontSize" 
              value="${parseInt(this.currentElement.styles.fontSize) || 16}"
              min="8" 
              max="72">
          </div>
          <div class="form-group">
            <label>Peso</label>
            <select data-property="fontWeight">
              ${[
                "normal",
                "bold",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
              ]
                .map(
                  (weight) => `
                  <option value="${weight}" ${
                    this.currentElement.styles.fontWeight === weight
                      ? "selected"
                      : ""
                  }>
                    ${weight}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Alineación</label>
            <select data-property="textAlign">
              ${["left", "center", "right", "justify"]
                .map(
                  (align) => `
                  <option value="${align}" ${
                    this.currentElement.styles.textAlign === align
                      ? "selected"
                      : ""
                  }>
                    ${align.charAt(0).toUpperCase() + align.slice(1)}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
        </div>
      `;
  }

  getCommonStyles() {
    return `
        <style>
          :host {
            display: block;
            background: white;
            font-family: system-ui, -apple-system, sans-serif;
          }

          * {
            box-sizing: border-box;
          }
  
          .editor-section {
            margin-bottom: 1.5rem;
            padding: 0 1rem;
          }
  
          .editor-section h3 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            color: #333;
          }
  
          .form-group {
            margin-bottom: 1rem;
          }
  
          label {
            display: block;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            color: #666;
          }
  
          input, select, textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.875rem;
          }
  
          textarea {
            min-height: 100px;
            resize: vertical;
          }
  
          input[type="color"] {
            padding: 0.25rem;
            height: 2rem;
          }
  
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
  
          input[type="range"] {
            padding: 0;
          }
        </style>
      `;
  }
}
