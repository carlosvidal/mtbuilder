// row-editor.js
import { BaseElementEditor } from "./base-element-editor.js";
import { getMobileOptionsForDesktop } from "../../utils/responsive-config.js";

export class RowEditor extends BaseElementEditor {
  constructor() {
    super(); // Esto ya maneja la creación del shadow root en la clase base
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
            <label>Columnas (desktop)</label>
            <select data-property="columns" value="${
              this.currentRow?.columns?.length || 1
            }">
              ${[1, 2, 3, 4, 6]
                .map(
                  (n) =>
                    `<option value="${n}" ${
                      (this.currentRow?.columns?.length || 1) === n ? "selected" : ""
                    }>${n} ${n === 1 ? "Columna" : "Columnas"}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Columnas (mobile)</label>
            <select data-property="mobileCols">
              ${this.getMobileOptions()
                .map(
                  (m) =>
                    `<option value="${m}" ${
                      this.getCurrentMobileCols() === m ? "selected" : ""
                    }>${m} ${m === 1 ? "Columna" : "Columnas"}</option>`
                )
                .join("")}
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
          // After changing desktop cols, update mobile options and re-render
          this.render();
        } else if (property === "mobileCols") {
          this.updateMobileCols(parseInt(value));
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

  getMobileOptions() {
    const desktopCols = this.currentRow?.columns?.length || 1;
    const options = getMobileOptionsForDesktop(desktopCols);
    return options.length > 0 ? options : [1];
  }

  getCurrentMobileCols() {
    return this.currentRow?.responsive?.mobile || this.getMobileOptions()[0] || 1;
  }

  updateColumns(numColumns) {
    if (!this.currentRow) return;

    numColumns = parseInt(numColumns);
    if (isNaN(numColumns) || numColumns < 1 || numColumns > 6) return;

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

    // Update responsive config after column change
    const mobileOptions = getMobileOptionsForDesktop(numColumns);
    const currentMobile = this.currentRow.responsive?.mobile;
    const validMobile = mobileOptions.includes(currentMobile) ? currentMobile : mobileOptions[0];
    this.currentRow.responsive = { desktop: numColumns, mobile: validMobile };
    this.currentRow.type = `row-${numColumns}`;

    this.emitUpdateEvent();
  }

  updateMobileCols(mobileCols) {
    if (!this.currentRow) return;
    const desktopCols = this.currentRow.columns?.length || 1;
    this.currentRow.responsive = { desktop: desktopCols, mobile: mobileCols };
    this.emitUpdateEvent();
  }

  updateRowStyle(property, value) {
    if (!this.currentRow) return;

    // Crear copia profunda de los estilos actuales
    const updatedStyles = JSON.parse(
      JSON.stringify(this.currentRow.styles || {})
    );

    // Asegurarnos de que los colores incluyan #
    if (property.toLowerCase().includes("color")) {
      value = value.startsWith("#") ? value : `#${value}`;
    }

    updatedStyles[property] = value;

    this.currentRow.styles = updatedStyles;
    this.emitUpdateEvent();
  }

  emitUpdateEvent() {
    if (!this.currentRow) return;

    // Emitir el evento una sola vez al bus global de eventos
    window.builderEvents.dispatchEvent(
      new CustomEvent("rowUpdated", {
        detail: {
          rowId: this.currentRow.id,
          styles: this.currentRow.styles,
          columns: this.currentRow.columns,
          type: this.currentRow.type,
          responsive: this.currentRow.responsive,
        },
      })
    );
  }
}

customElements.define("row-editor", RowEditor);
