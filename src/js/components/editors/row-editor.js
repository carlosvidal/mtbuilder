// row-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class RowEditor extends BaseElementEditor {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentRow = null;
  }

  setRow(row) {
    this.currentRow = row;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Editar Fila</h3>
          <div class="form-group">
            <label>Número de columnas</label>
            <select data-property="columns" value="${
              this.currentRow?.columns?.length || 1
            }">
              <option value="1">1 Columna</option>
              <option value="2">2 Columnas</option>
              <option value="3">3 Columnas</option>
              <option value="4">4 Columnas</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Color de fondo</label>
            <input type="color" 
              data-property="backgroundColor" 
              value="${this.currentRow?.styles?.backgroundColor || "#ffffff"}">
          </div>

          <div class="form-group">
            <label>Borde</label>
            <div class="grid-2">
              <input type="number" 
                data-property="borderWidth" 
                placeholder="Ancho (px)"
                value="${parseInt(this.currentRow?.styles?.borderWidth) || 0}">
              <input type="color" 
                data-property="borderColor" 
                value="${this.currentRow?.styles?.borderColor || "#000000"}">
            </div>
            <select data-property="borderStyle" class="mt-2">
              <option value="none" ${
                this.currentRow?.styles?.borderStyle === "none"
                  ? "selected"
                  : ""
              }>Sin borde</option>
              <option value="solid" ${
                this.currentRow?.styles?.borderStyle === "solid"
                  ? "selected"
                  : ""
              }>Sólido</option>
              <option value="dashed" ${
                this.currentRow?.styles?.borderStyle === "dashed"
                  ? "selected"
                  : ""
              }>Guiones</option>
              <option value="dotted" ${
                this.currentRow?.styles?.borderStyle === "dotted"
                  ? "selected"
                  : ""
              }>Puntos</option>
            </select>
          </div>

          <div class="form-group">
            <label>Padding (px)</label>
            <div class="grid-2">
              <input type="number" 
                data-property="paddingTop" 
                placeholder="Superior"
                value="${parseInt(this.currentRow?.styles?.paddingTop) || 0}">
              <input type="number" 
                data-property="paddingRight" 
                placeholder="Derecha"
                value="${parseInt(this.currentRow?.styles?.paddingRight) || 0}">
              <input type="number" 
                data-property="paddingBottom" 
                placeholder="Inferior"
                value="${
                  parseInt(this.currentRow?.styles?.paddingBottom) || 0
                }">
              <input type="number" 
                data-property="paddingLeft" 
                placeholder="Izquierda"
                value="${parseInt(this.currentRow?.styles?.paddingLeft) || 0}">
            </div>
          </div>

          <div class="form-group">
            <label>Margen (px)</label>
            <div class="grid-2">
              <input type="number" 
                data-property="marginTop" 
                placeholder="Superior"
                value="${parseInt(this.currentRow?.styles?.marginTop) || 0}">
              <input type="number" 
                data-property="marginRight" 
                placeholder="Derecha"
                value="${parseInt(this.currentRow?.styles?.marginRight) || 0}">
              <input type="number" 
                data-property="marginBottom" 
                placeholder="Inferior"
                value="${parseInt(this.currentRow?.styles?.marginBottom) || 0}">
              <input type="number" 
                data-property="marginLeft" 
                placeholder="Izquierda"
                value="${parseInt(this.currentRow?.styles?.marginLeft) || 0}">
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Remover listeners anteriores
    const inputs = this.shadowRoot.querySelectorAll("input, select");
    inputs.forEach((input) => {
      input.replaceWith(input.cloneNode(true));
    });

    // Configurar nuevos listeners
    this.shadowRoot.querySelectorAll("input, select").forEach((input) => {
      const updateHandler = (e) => {
        e.stopPropagation();
        const property = e.target.dataset.property;
        let value =
          e.target.type === "number"
            ? parseInt(e.target.value)
            : e.target.value;

        if (property === "columns") {
          this.updateColumns(value);
        } else {
          this.updateRowStyle(property, value);
        }
      };

      if (input.type === "color" || input.type === "range") {
        input.addEventListener("input", updateHandler, { passive: true });
      } else {
        input.addEventListener("change", updateHandler, { passive: true });
      }
    });
  }

  updateColumns(numColumns) {
    if (!this.currentRow) return;

    numColumns = parseInt(numColumns);
    if (isNaN(numColumns) || numColumns < 1 || numColumns > 4) return;

    const currentColumns = this.currentRow.columns.length;

    if (numColumns === currentColumns) return;

    if (numColumns > currentColumns) {
      // Añadir nuevas columnas
      const newColumns = Array(numColumns - currentColumns)
        .fill()
        .map(() => ({
          id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          elements: [],
        }));
      this.currentRow.columns.push(...newColumns);
    } else {
      // Mover elementos a la última columna que permanecerá
      const lastRemainingColumn = this.currentRow.columns[numColumns - 1];
      for (let i = numColumns; i < currentColumns; i++) {
        lastRemainingColumn.elements.push(
          ...this.currentRow.columns[i].elements
        );
      }
      this.currentRow.columns = this.currentRow.columns.slice(0, numColumns);
    }

    this.emitUpdateEvent();
  }

  updateRowStyle(property, value) {
    if (!this.currentRow) return;

    this.currentRow.styles = {
      ...this.currentRow.styles,
      [property]: value,
    };

    this.emitUpdateEvent();
  }

  emitUpdateEvent() {
    window.builderEvents.dispatchEvent(
      new CustomEvent("rowUpdated", {
        detail: {
          rowId: this.currentRow.id,
          styles: this.currentRow.styles,
          columns: this.currentRow.columns,
        },
      })
    );
  }
}

customElements.define("row-editor", RowEditor);
