import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { CanvasStorage } from "../utils/canvas-storage.js";
import { History } from "../utils/history.js";
import { sanitizeHTML } from "../utils/sanitize.js";
import { I18n } from "../utils/i18n.js";
import { RowControls } from "./row-controls.js";
import { InlineEditor } from "./inline-editor.js";

export class BuilderCanvas extends HTMLElement {
  // 1. Propiedades estáticas
  static get observedAttributes() {
    return ["pageId"];
  }

  static get styles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem;
        box-sizing: border-box;
      }
      // ... resto de los estilos ...
    `;
  }

  // 2. Constructor y ciclo de vida
  constructor() {
    super();

    this.rowEventHandlers = new Map();

    this.attachShadow({ mode: "open" });
    this.i18n = I18n.getInstance();
    this._isUndoRedoOperation = false;
    this.history = new History();
    this.draggedRow = null;
    this.draggedElement = null;
    this.inlineEditor = null;

    // Ensure we have a valid initial state
    const initialState = store.getState() || {};
    if (!Array.isArray(initialState.rows)) {
      store.setState({
        rows: [],
        globalSettings: {
          maxWidth: "1200px",
          padding: "20px",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      });
    }

    if (!customElements.get("row-controls")) {
      customElements.define("row-controls", RowControls);
    }

    // Subscribe to store changes
    this.unsubscribeStore = store.subscribe(this.handleStateChange.bind(this));

    // Subscribe to events
    this.setupEventSubscriptions();
    this.addEventListener("row-drag-start", (e) => {
      const row = this.shadowRoot.querySelector(
        `[data-id="${e.detail.rowId}"]`
      );
      if (row) {
        this.createTemporaryDropZones(row);
      }
    });

    this.addEventListener("row-drag-end", () => {
      this.removeTemporaryDropZones();
    });
  }

  async connectedCallback() {
    const pageId = this.getAttribute("pageId");
    if (pageId) {
      await this.loadPageData(pageId);
    } else {
      store.setState({
        rows: [],
        globalSettings: {
          maxWidth: "1200px",
          padding: "20px",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      });
    }

    this.setupRowEventListeners();

    // Forzar un render inicial
    this.render();

    // Setup event listeners
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
      this.setupElementSelection();
    });
  }

  disconnectedCallback() {
    // Limpiar todos los event handlers
    if (this._rowUpdatedHandler) {
      eventBus.off("rowUpdated", this._rowUpdatedHandler);
    }
    if (this._elementSelectedHandler) {
      eventBus.off("elementSelected", this._elementSelectedHandler);
    }
    if (this._elementUpdatedHandler) {
      eventBus.off("elementUpdated", this._elementUpdatedHandler);
    }
    // Limpiar row control events
    eventBus.off("rowDeleted");
    eventBus.off("rowDuplicated");
    eventBus.off("rowAdded");
    eventBus.off("rowDragStart");

    // Limpiar suscripción al store
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }

    // Limpiar event listeners del DOM
    this.rowEventHandlers.forEach((handler, rowId) => {
      const row = this.shadowRoot?.querySelector(`[data-id="${rowId}"]`);
      if (row) {
        row.removeEventListener("dragstart", handler.dragstart);
        row.removeEventListener("dragend", handler.dragend);
      }
    });
    this.rowEventHandlers.clear();
    
    // Limpiar canvas drop zone handlers
    const canvas = this.shadowRoot?.querySelector(".canvas-dropzone");
    if (canvas) {
      if (this._dropHandler) {
        canvas.removeEventListener("drop", this._dropHandler);
      }
      if (this._dragOverHandler) {
        canvas.removeEventListener("dragover", this._dragOverHandler);
      }
      if (this._dragLeaveHandler) {
        canvas.removeEventListener("dragleave", this._dragLeaveHandler);
      }
      if (this._elementDeleteHandler) {
        canvas.removeEventListener("click", this._elementDeleteHandler);
      }
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue && newValue !== oldValue) {
      this.pageId = newValue;

      const savedData = CanvasStorage.loadCanvas(newValue);

      // Cargar datos en el store en lugar de propiedades locales
      if (savedData) {
        const currentState = store.getState();
        const newState = {
          ...currentState,
          pageId: newValue
        };
        
        if (savedData.rows) {
          newState.rows = savedData.rows;
        }
        if (savedData.globalSettings) {
          newState.globalSettings = savedData.globalSettings;
        }
        
        store.setState(newState);
      }
    }
  }

  // 3. Métodos de renderizado
  render(suppressEvent = false) {
    // Asegurarnos de tener un estado válido
    const state = store.getState();
    const rows = Array.isArray(state?.rows) ? state.rows : [];
    const settings = {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
      ...(state?.globalSettings || {}),
    };
    const pageId = state?.pageId;

    // Estilos base del canvas
    const styles = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 100vh;
        background: #f5f5f5;
        padding: 2rem;
        box-sizing: border-box;
      }
  
      .canvas-container {
        width: 100%;
        height: 100%;
        min-height: calc(100vh - 4rem);
        background: #f5f5f5;
        padding: 2rem;
        overflow: auto;
      }
  
      .page-wrapper {
        max-width: ${settings.maxWidth};
        margin: 0 auto;
        background-color: ${settings.backgroundColor};
        font-family: ${settings.fontFamily};
        box-shadow: 0 0 20px rgba(0,0,0,0.1);
        border-radius: 8px;
        min-height: calc(100vh - 8rem);
        padding: ${settings.padding};
        position: relative;
      }
  
.canvas-dropzone {
  min-height: 100%;
  width: 100%;
  border: ${rows.length === 0 ? "2px dashed #ccc" : "none"};
  border-radius: 8px;
  transition: all 0.3s ease;
}
  
      .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 10rem);
        padding: 2rem;
        text-align: center;
        color: #666;
      }
  
      .row-click-area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    cursor: pointer;
    z-index: 1;
  }

.builder-row {
  position: relative;
  margin: 0.5rem 0;
  background: white;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: default;
}

.builder-row:active {
  cursor: grabbing;
}

.builder-row.row-dragging {
  opacity: 0.7;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  background: #f8f9fa;
  border: 2px dashed #2196F3;
}

.builder-row.dragover-before {
  border-top: 2px solid #2196F3;
  margin-top: -2px;
}

.builder-row.dragover-after {
  border-bottom: 2px solid #2196F3;
  margin-bottom: -2px;
}


.row-click-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.row-controls {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.builder-row:hover .row-controls {
  opacity: 1;
}

.row-controls button {
  padding: 0.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
}

.row-controls button:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}

.element-controls {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.builder-element-wrapper:hover .element-controls {
  opacity: 1;
}

.element-controls button {
  padding: 0.25rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #666;
  width: 24px;
  height: 24px;
  justify-content: center;
}

.element-controls button:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}

.element-delete {
  color: #dc3545;
}

.element-delete:hover {
  background: #dc3545;
  border-color: #dc3545;
  color: white;
}

.builder-element-wrapper {
  position: relative;
}

    .row-add-button {
      position: absolute;
      bottom: -1rem;
      left: 50%;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 20;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .builder-row:hover .row-add-button {
      opacity: 1;
    }

    .row-add-button:hover {
      background: #1976D2;
      transform: translateX(-50%) scale(1.1);
    }

.column-dropzone {
  min-height: 50px;
  border: 2px dashed transparent;
  border-radius: 4px;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.column-dropzone.dragover {
  border-color: #2196F3;
  background-color: rgba(33, 150, 243, 0.1);
  border-style: solid;
}

.canvas-dropzone.dragover {
  border: 2px dashed #2196F3;
  background-color: rgba(33, 150, 243, 0.05);
}

// Añadir estos estilos en el sidebar
.builder-element {
  cursor: grab;
  display: block;
}

.builder-element[data-type^="row-"] {
  cursor: move;
  background: #f8f9fa;
}

.builder-element[data-type^="row-"].dragging {
  opacity: 0.7;
  border: 2px dashed #2196F3;
}

.builder-element.dragging {
  opacity: 0.6;
  cursor: grabbing;
}

.builder-element:hover {
  outline: 1px solid #2196F3;
  outline-offset: -1px;
}

.nested-row-element {
  position: relative;
  margin: 0.25rem 0;
}

.nested-row {
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  background: rgba(33, 150, 243, 0.02);
}

.nested-row:hover {
  border-color: #ccc;
}

.nested-column .column-dropzone {
  min-height: 40px;
}

.video-container iframe {
  pointer-events: none;
}

.container-element {
  border: 1px dashed #e0e0e0;
  border-radius: 4px;
  min-height: 80px;
  position: relative;
}

.container-element:hover {
  border-color: #2196F3;
}

.container-element.drag-over {
  border-color: #2196F3;
  background: rgba(33, 150, 243, 0.05);
}

.container-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  color: #999;
  font-size: 0.8rem;
}

.inline-editor-toolbar {
  position: absolute;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 4px 6px;
  background: #333;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  pointer-events: auto;
}

.toolbar-buttons-panel {
  display: flex;
  align-items: center;
  gap: 2px;
}

.inline-editor-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #ddd;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.inline-editor-toolbar button:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
}

.inline-editor-toolbar button.active {
  background: rgba(255,255,255,0.25);
  color: #fff;
}

.inline-editor-toolbar .toolbar-font-size {
  height: 28px;
  border: none;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  color: #ddd;
  font-size: 12px;
  padding: 0 4px;
  cursor: pointer;
  outline: none;
}

.inline-editor-toolbar .toolbar-font-size:hover {
  background: rgba(255,255,255,0.2);
}

.toolbar-link-panel {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-link-input {
  height: 28px;
  width: 200px;
  border: none;
  border-radius: 4px;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-size: 13px;
  padding: 0 8px;
  outline: none;
}

.toolbar-link-input::placeholder {
  color: rgba(255,255,255,0.4);
}

.toolbar-link-input:focus {
  background: rgba(255,255,255,0.25);
}

.link-apply-btn {
  color: #4CAF50 !important;
}

.link-remove-btn {
  color: #f44336 !important;
}

.builder-element[contenteditable="true"] {
  outline: 2px solid #2196F3;
  outline-offset: 2px;
  cursor: text;
}

.builder-element[contenteditable="true"] blockquote {
  border-left: 3px solid #ccc;
  margin: 0.5em 0;
  padding: 0.3em 0.8em;
  color: #555;
}

    .empty-column {
      height: 100%;
      min-height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
      font-size: 0.875rem;
      text-align: center;
    }

    .row-dragging {
    opacity: 0.5;
    border: 2px dashed #2196F3;
  }

  .dragover-before {
    border-top: 2px solid #2196F3;
    margin-top: -2px;
  }

  .dragover-after {
    border-bottom: 2px solid #2196F3;
    margin-bottom: -2px;
  }

  .builder-row {
    position: relative;
    transition: margin 0.2s ease;
  }

  .row-handle {
    position: absolute;
    left: -25px;
    top: 50%;
    transform: translateY(-50%);
    cursor: grab;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .builder-row:hover .row-handle {
    opacity: 1;
  }

  .row-content {
    position: relative;
    width: 100%;
    min-height: 50px;
    transition: all 0.2s ease;
  }

  .row-inner {
    position: relative;
    width: 100%;
    z-index: 1;
  }

  .builder-row {
    position: relative;
    margin: 0.5rem 0;
    transition: all 0.2s ease;
  }

  .row-drop-zone {
    position: absolute;
    height: 20px;
    width: 100%;
    transition: all 0.2s ease;
    pointer-events: auto;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .drop-indicator {
    width: 100%;
    height: 2px;
    background-color: #2196F3;
    position: relative;
    opacity: 0;
    transition: all 0.2s ease;
  }

  .row-drop-zone.active .drop-indicator {
    opacity: 1;
    height: 4px;
  }

  .temporary-drop-zones {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1000;
  }

  .builder-row.dragging {
    opacity: 0.5;
  }

  .row-handle, .drag-handle {
    position: absolute;
    left: -25px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 10;
  }

  .builder-row:hover .row-handle,
  .builder-row:hover .drag-handle {
    opacity: 1;
  }

  .row-handle:active,
  .drag-handle:active {
    cursor: grabbing;
  }

  .builder-row.dragging {
    opacity: 0.5;
    background: #f8f9fa;
    border: 2px dashed #2196F3;
  }

    `;

    // Contenido HTML del canvas
    const html = `
      <style>${styles}</style>
      <div class="canvas-container">
        <div class="page-wrapper">
          <div class="canvas-dropzone ${
            rows.length === 0 ? "empty" : ""
          }" data-page-id="${pageId || ""}">
            ${
              rows.length === 0
                ? `<div class="empty-message">
                  <h3>${this.i18n.t("builder.canvas.empty.title")}</h3>
                  <p>${this.i18n.t("builder.canvas.empty.subtitle")}</p>
                  <small>ID: ${pageId || "---"}</small>
                </div>`
                : rows.map((row) => this.renderRow(row)).join("")
            }
          </div>
        </div>
      </div>
    `;

    // Actualizar el contenido
    this.shadowRoot.innerHTML = html;

    // Setup after render - siempre configurar eventos
    requestAnimationFrame(() => {
      this.setupDropZone(); // Configurar primero el drop zone del canvas
      this.setupEventListeners(); // Configurar dragging de elementos

      if (!suppressEvent && !this._isUndoRedoOperation) {
        this.emitContentChanged(suppressEvent);
      }
    });

  }

  renderRow(row) {
    // Generar string de estilos
    const styles = Object.entries(row.styles || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        // Para valores numéricos, agregar px si no tienen unidad
        const cssValue = /^\d+$/.test(value) ? `${value}px` : value;
        return `${cssKey}: ${cssValue}`;
      })
      .join(";");

    return `
      <div class="builder-row" data-id="${row.id}" data-type="${row.type}">
        <row-controls 
          row-id="${row.id}" 
          selected="${row.selected || false}">
          <div class="row-content" style="${styles}">  <!-- Aplicar estilos aquí -->
            <div class="row-inner" style="display: grid; grid-template-columns: repeat(${
              row.columns.length
            }, 1fr); gap: 20px;">
              ${row.columns
                .map(
                  (column) => `
                <div class="builder-column" data-id="${column.id}">
                  <div class="column-dropzone">
                    ${
                      column.elements.length === 0
                        ? `<div class="empty-column">
                           <span>${this.i18n.t(
                             "builder.sidebar.dropHint"
                           )}</span>
                         </div>`
                        : column.elements
                            .map((element) => this.renderElement(element))
                            .join("")
                    }
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </row-controls>
      </div>
    `;
  }

  // 4. Eventos y manejo de estado
  setupEventSubscriptions() {
    // Limpiar listeners existentes
    if (this._rowUpdatedHandler) {
      eventBus.off("rowUpdated", this._rowUpdatedHandler);
    }
    if (this._elementSelectedHandler) {
      eventBus.off("elementSelected", this._elementSelectedHandler);
    }
    if (this._elementUpdatedHandler) {
      eventBus.off("elementUpdated", this._elementUpdatedHandler);
    }

    // Crear handlers con bind para poder removerlos después
    this._rowUpdatedHandler = (data) => {
      this.handleRowUpdated({ detail: data });
    };

    this._elementSelectedHandler = (data) => {
      // Manejar selección de elemento
    };

    this._elementUpdatedHandler = (data) => {
      const { elementId } = data;
      this.updateElementStyles(elementId, data);
    };

      // Usar eventBus para todos los eventos
    eventBus.on("rowUpdated", this._rowUpdatedHandler);
    eventBus.on("elementSelected", this._elementSelectedHandler);
    eventBus.on("elementUpdated", this._elementUpdatedHandler);
    
    // Row control events
    eventBus.on("rowDeleted", (data) => this.handleRowDelete({ detail: data }));
    eventBus.on("rowDuplicated", (data) => this.handleRowDuplicate({ detail: data }));
    eventBus.on("rowAdded", (data) => this.handleRowAdd({ detail: data }));
    eventBus.on("rowDragStart", (data) => this.handleRowDragStart({ detail: data }));
    eventBus.on("rowEditRequested", (data) => this.selectRow(data.rowId));

    // Mantener solo la suscripción al store
    this.unsubscribeStore = store.subscribe((newState, prevState) => {
      // Handled by handleStateChange
    });
  }

  handleStateChange(newState, prevState) {
    if (
      !prevState ||
      JSON.stringify(prevState.rows) !== JSON.stringify(newState.rows) ||
      JSON.stringify(prevState.globalSettings) !==
        JSON.stringify(newState.globalSettings)
    ) {
      requestAnimationFrame(() => {
        this.render();
        if (!this._isUndoRedoOperation) {
          this.emitContentChanged();
        }
      });
    }
  }

  // 5. Manipulación de filas
  addRow(rowType, responsiveConfig) {
    const state = store.getState();
    const timestamp = Date.now();
    const numColumns = parseInt(rowType.split("-")[1], 10);

    const newRow = {
      id: `row-${timestamp}`,
      type: rowType,
      styles: {},
      columns: Array.from({ length: numColumns }, (_, index) => ({
        id: `column-${timestamp}-${index}`,
        elements: [],
      })),
    };

    if (responsiveConfig) {
      newRow.responsive = responsiveConfig;
    }

    store.setState({
      ...state,
      rows: [...(state.rows || []), newRow],
    });
  }

  deleteRow(rowId) {
    const state = store.getState();
    const updatedRows = state.rows.filter((row) => row.id !== rowId);
    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  moveRow(rowId, targetIndex) {
    const state = store.getState();
    const rows = [...state.rows];
    const sourceIndex = rows.findIndex((row) => row.id === rowId);

    if (sourceIndex !== -1) {
      const [movedRow] = rows.splice(sourceIndex, 1);
      rows.splice(targetIndex, 0, movedRow);

      // Actualizar el estado
      store.setState({
        ...state,
        rows,
      });

      // Forzar re-render
      this.render();

      // Emitir evento de cambio
      this.emitContentChanged();
    }
  }

  duplicateRow(rowId) {
    const state = store.getState();
    const sourceRow = state.rows.find((row) => row.id === rowId);
    if (!sourceRow) return;

    const newRow = {
      ...sourceRow,
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      columns: sourceRow.columns.map((col) => ({
        id: `column-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        elements: col.elements.map((element) => ({
          ...element,
          id: `element-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 11)}`,
        })),
      })),
    };

    const rowIndex = state.rows.findIndex((row) => row.id === rowId);
    const updatedRows = [...state.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);

    store.setState({
      ...state,
      rows: updatedRows,
    });
    this.emitContentChanged();
  }

  // 6. Drag & Drop
  setupDropZone() {
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (!canvas) return;

    // Limpiar eventos existentes sin clonar (más eficiente)
    if (this._dropHandler) {
      canvas.removeEventListener("drop", this._dropHandler);
    }
    if (this._dragOverHandler) {
      canvas.removeEventListener("dragover", this._dragOverHandler);
    }
    if (this._dragLeaveHandler) {
      canvas.removeEventListener("dragleave", this._dragLeaveHandler);
    }

    // Configurar eventos de drag & drop para filas existentes
    this.setupRowDragEvents();

    // Crear handlers reutilizables
    this._dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      canvas.classList.remove("dragover");
      // Remove dragover from all column-dropzones and containers
      this.shadowRoot.querySelectorAll(".column-dropzone.dragover").forEach(
        (el) => el.classList.remove("dragover")
      );
      this.shadowRoot.querySelectorAll(".container-element.drag-over").forEach(
        (el) => el.classList.remove("drag-over")
      );

      const rowType = e.dataTransfer.getData("text/plain");
      const elementType = e.dataTransfer.getData(
        "application/x-builder-element"
      );

      // Read responsive config from drag data
      let responsiveConfig = null;
      try {
        const responsiveData = e.dataTransfer.getData("application/x-responsive");
        if (responsiveData) {
          responsiveConfig = JSON.parse(responsiveData);
        }
      } catch (_) { /* ignore parse errors */ }

      // Check if drop target is inside a column-dropzone
      const dropTarget = e.target.closest(".column-dropzone");

      if (rowType?.startsWith("row-") && dropTarget) {
        // Nested row drop: row dragged onto a column
        const rowEl = dropTarget.closest(".builder-row");
        const columnEl = dropTarget.closest(".builder-column");
        if (rowEl && columnEl) {
          // Enforce 1-level nesting: block if already inside a nested row
          const isNestedColumn = dropTarget.closest(".nested-row-element");
          if (!isNestedColumn) {
            this.addNestedRowToColumn(rowEl.dataset.id, columnEl.dataset.id, rowType, responsiveConfig);
          }
        }
      } else if (rowType?.startsWith("row-")) {
        // Top-level row drop on canvas
        this.addRow(rowType, responsiveConfig);
      } else if (elementType && !elementType.startsWith("row-")) {
        // Check if drop target is a container element
        const containerTarget = e.target.closest(".container-element");
        if (containerTarget && dropTarget) {
          this.addElementToContainer(containerTarget.dataset.id, elementType);
        } else if (dropTarget) {
          const rowEl = dropTarget.closest(".builder-row");
          const columnEl = dropTarget.closest(".builder-column");
          if (rowEl && columnEl) {
            this.addElementToColumn(
              rowEl.dataset.id,
              columnEl.dataset.id,
              elementType
            );
          }
        }
      }
    };

    this._dragOverHandler = (e) => {
      const isRowDrag = e.dataTransfer.types.includes("application/x-row-id");
      if (!isRowDrag) {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.add("dragover");

        // Highlight container drop targets
        const containerTarget = e.target.closest(".container-element");
        this.shadowRoot.querySelectorAll(".container-element.drag-over").forEach(
          (el) => el.classList.remove("drag-over")
        );
        if (containerTarget) {
          containerTarget.classList.add("drag-over");
        }
      }
    };

    this._dragLeaveHandler = (e) => {
      canvas.classList.remove("dragover");
      const containerTarget = e.target.closest(".container-element");
      if (containerTarget) {
        containerTarget.classList.remove("drag-over");
      }
    };

    // Añadir event listeners
    canvas.addEventListener("dragover", this._dragOverHandler);
    canvas.addEventListener("dragleave", this._dragLeaveHandler);
    canvas.addEventListener("drop", this._dropHandler);
  }

  handleRowDrop(e, draggedRowId) {
    const state = store.getState();
    const currentRows = [...state.rows];
    const draggedRowIndex = currentRows.findIndex(
      (row) => row.id === draggedRowId
    );

    if (draggedRowIndex === -1) return;

    // Remove dragged row
    const [draggedRow] = currentRows.splice(draggedRowIndex, 1);

    // Find target position
    const targetRow = e.target.closest(".builder-row");
    let newIndex;

    if (targetRow) {
      const targetId = targetRow.dataset.id;
      const targetIndex = currentRows.findIndex((row) => row.id === targetId);
      const rect = targetRow.getBoundingClientRect();
      const insertAfter = e.clientY > rect.top + rect.height / 2;

      newIndex = insertAfter ? targetIndex + 1 : targetIndex;
    } else {
      newIndex = currentRows.length;
    }

    // Insert row at new position
    currentRows.splice(newIndex, 0, draggedRow);

    // Update store
    store.setState({
      ...state,
      rows: currentRows,
    });

    this.emitContentChanged();
  }

  createTemporaryDropZones(excludeRow) {
    const dropZonesContainer = document.createElement("div");
    dropZonesContainer.className = "temporary-drop-zones";
    this.shadowRoot.appendChild(dropZonesContainer);

    const rows = Array.from(this.shadowRoot.querySelectorAll(".builder-row"));
    this.createDropZone(dropZonesContainer, 0);

    rows.forEach((row, index) => {
      if (row !== excludeRow) {
        this.createDropZone(dropZonesContainer, index + 1);
      }
    });
  }

  createDropZone(container, index) {
    const dropZone = document.createElement("div");
    dropZone.className = "row-drop-zone";
    dropZone.innerHTML = '<div class="drop-indicator"></div>';

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("active");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("active");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      const rowId = e.dataTransfer.getData("application/x-row-id");
      if (rowId) this.moveRow(rowId, index);
      this.removeTemporaryDropZones();
    });

    container.appendChild(dropZone);

    const rows = Array.from(this.shadowRoot.querySelectorAll(".builder-row"));
    const canvasRect = this.getBoundingClientRect();

    if (index === 0 && rows.length > 0) {
      const rect = rows[0].getBoundingClientRect();
      dropZone.style.top = `${rect.top - canvasRect.top - 10}px`;
    } else if (index > 0 && rows[index - 1]) {
      const rect = rows[index - 1].getBoundingClientRect();
      dropZone.style.top = `${rect.bottom - canvasRect.top + 5}px`;
    }

    dropZone.style.left = "0";
    dropZone.style.width = "100%";
  }

  removeTemporaryDropZones() {
    const container = this.shadowRoot.querySelector(".temporary-drop-zones");
    if (container) container.remove();
  }

  setupRowDragEvents() {
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Eventos de drag & drop en la fila
      row.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        row.classList.add("dragging");
        e.dataTransfer.setData("application/x-row-id", row.dataset.id);
        e.dataTransfer.effectAllowed = "move";

        requestAnimationFrame(() => {
          this.createTemporaryDropZones(row);
        });
      });

      row.addEventListener("dragend", (e) => {
        e.stopPropagation();
        row.classList.remove("dragging");
        row.setAttribute("draggable", "false");
        this.removeTemporaryDropZones();
      });
    });
  }

  setupElementSelection() {
    const elements = this.shadowRoot.querySelectorAll(".builder-element");

    elements.forEach((element) => {
      // Make text elements editable
      if (["heading", "text", "button"].includes(element.dataset.type)) {
        this.setupTextEditing(element);
      }

      element.addEventListener("click", (e) => {
        e.stopPropagation();

        // If the element or target is currently being edited inline, don't interfere
        if (e.target.isContentEditable || element.isContentEditable) {
          return;
        }

        e.preventDefault();

        this.shadowRoot.querySelectorAll(".selected").forEach((el) => {
          el.classList.remove("selected");
        });

        // Deseleccionar fila si hay alguna seleccionada
        const state = store.getState();
        const updatedRows = state.rows.map(row => ({ ...row, selected: false }));
        store.setState({ ...state, rows: updatedRows });
        eventBus.emit("rowDeselected");

        element.classList.add("selected");

        const elementId = element.dataset.id;
        const elementData = this.findElementById(elementId);

        if (elementData) {
          eventBus.emit("elementSelected", elementData);
        }
      });
    });
  }

  setupElementDeleteEventDelegation() {
    // Use event delegation for element delete buttons
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (!canvas) return;

    // Remove existing event listener if it exists
    if (this._elementDeleteHandler) {
      canvas.removeEventListener("click", this._elementDeleteHandler);
    }

    // Create event handler for element delete buttons
    this._elementDeleteHandler = (e) => {
      if (e.target.closest(".element-delete")) {
        e.stopPropagation();
        e.preventDefault();
        
        const deleteButton = e.target.closest(".element-delete");
        const elementId = deleteButton.getAttribute("data-element-id");
        
        if (elementId) {
          this.deleteElement(elementId);
        }
      }
    };

    // Add event listener using delegation
    canvas.addEventListener("click", this._elementDeleteHandler);
  }

  setupTextEditing(element) {
    const isHeading = element.dataset.type === "heading";
    const isButton = element.dataset.type === "button";

    element.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!this.inlineEditor) {
        this.inlineEditor = new InlineEditor(this.shadowRoot);
        this.inlineEditor._onDetach = (el, html) => {
          const elId = el.dataset?.id;
          const elData = this.findElementById(elId);
          if (elData && html !== null) {
            elData.content = html;
            this.emitContentChanged();
          }
        };
      }
      this.inlineEditor.attach(element);
    });

    element.addEventListener("blur", () => {
      // Delay blur to let toolbar mousedown preventDefault keep focus.
      if (this._blurTimeout) clearTimeout(this._blurTimeout);
      this._blurTimeout = setTimeout(() => {
        // If the inline editor owns this element, let it handle everything
        if (this.inlineEditor && this.inlineEditor.activeElement === element) return;
        // If the inline editor is in link-input mode, abort
        if (this.inlineEditor && this.inlineEditor._linkMode) return;

        // Fallback: if element is still contentEditable but inlineEditor released it
        if (element.isContentEditable) {
          element.contentEditable = false;
          const elementId = element.dataset.id;
          const elementData = this.findElementById(elementId);
          if (elementData) {
            elementData.content = element.innerHTML;
            this.emitContentChanged();
          }
        }
      }, 150);
    });

    element.addEventListener("keydown", (e) => {
      if (!element.isContentEditable) return;
      // Headings and buttons: Enter exits editing
      if ((isHeading || isButton) && e.key === "Enter") {
        e.preventDefault();
        element.blur();
      }
    });
  }

  updateElementStyles(elementId, data) {
    const state = store.getState();
    let elementUpdated = false;

    const updateInElements = (elements) => {
      return elements.map(el => {
        if (el.id === elementId) {
          elementUpdated = true;
          return {
            ...el,
            ...(data.styles && { styles: { ...el.styles, ...data.styles } }),
            ...(data.attributes && { attributes: { ...el.attributes, ...data.attributes } }),
            ...(data.content !== undefined && { content: data.content }),
            ...(data.tag !== undefined && { tag: data.tag }),
            ...(data.wrapperStyles !== undefined && { wrapperStyles: data.wrapperStyles }),
          };
        }
        if (el.type === "row" && el.columns) {
          return { ...el, columns: el.columns.map(col => ({
            ...col,
            elements: updateInElements(col.elements || []),
          }))};
        }
        if (el.type === "container" && el.elements) {
          return { ...el, elements: updateInElements(el.elements) };
        }
        return el;
      });
    };

    const updatedRows = state.rows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({
        ...column,
        elements: updateInElements(column.elements || []),
      })),
    }));

    if (elementUpdated) {
      store.setState({ ...state, rows: updatedRows });
    }
  }

  findElementById(id) {
    const state = store.getState();

    const searchInElements = (elements) => {
      for (const el of elements) {
        if (el.id === id) return el;
        if (el.type === "row" && el.columns) {
          for (const col of el.columns) {
            const found = searchInElements(col.elements || []);
            if (found) return found;
          }
        }
        if (el.type === "container" && el.elements) {
          const found = searchInElements(el.elements);
          if (found) return found;
        }
      }
      return null;
    };

    for (const row of state.rows) {
      for (const column of row.columns) {
        const found = searchInElements(column.elements || []);
        if (found) return found;
      }
    }
    return null;
  }

  handleRowUpdated(event) {
    const { rowId, styles, columns, type, responsive } = event.detail;

    const state = store.getState();
    if (!state.rows) {
      console.warn("No rows found in state");
      return;
    }

    // Buscar la fila a actualizar
    const rowIndex = state.rows.findIndex((row) => row.id === rowId);
    if (rowIndex === -1) {
      console.warn(`Row ${rowId} not found in state`);
      return;
    }

    // Crear copia profunda del estado actual
    const updatedRows = JSON.parse(JSON.stringify(state.rows));

    // Actualizar la fila manteniendo la estructura completa
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      styles: { ...(updatedRows[rowIndex].styles || {}), ...styles },
      columns: columns || updatedRows[rowIndex].columns,
      type: type || updatedRows[rowIndex].type,
    };

    if (responsive) {
      updatedRows[rowIndex].responsive = responsive;
    }


    // Actualizar store y emitir cambios
    store.setState({
      ...state,
      rows: updatedRows,
    });

    // Forzar un re-render
    requestAnimationFrame(() => {
      this.render();
    });
  }

  setupEventListeners() {
    // No hacer cloning del canvas - usar cleanup apropiado
    requestAnimationFrame(() => {
      this.setupElementDragging();
      // setupDropZone ya se llama desde render, no duplicar
      this.setupElementSelection();
      this.setupElementDeleteEventDelegation();
    });
  }

  setupElementDragging() {
    const elements = this.shadowRoot.querySelectorAll(".builder-element");
    elements.forEach((element) => {
      element.draggable = true;

      element.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "copy";
        // Solo seteamos un tipo de dato
        e.dataTransfer.setData(
          "application/x-builder-element",
          element.dataset.type
        );
      });

      element.addEventListener("dragend", () => {
        element.classList.remove("dragging");
        this.draggedElement = null;
        this.removeAllDragoverClasses();
      });
    });

    // Agregar los eventos de dragover y drop a las columnas
    const columns = this.shadowRoot.querySelectorAll(".column-dropzone");
    columns.forEach((column) => {
      column.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        column.classList.add("dragover");

        // Only do reorder logic if dragging an existing element
        if (!this.draggedElement) return;

        const elements = [...column.children].filter(
          (el) =>
            el.classList.contains("builder-element") &&
            el !== this.draggedElement.element
        );

        if (elements.length === 0) {
          column.appendChild(this.draggedElement.element);
          return;
        }

        const mouseY = e.clientY;
        let closestElement = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        elements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const distance = Math.abs(mouseY - (rect.top + rect.height / 2));
          if (distance < closestDistance) {
            closestDistance = distance;
            closestElement = el;
          }
        });

        if (closestElement) {
          const rect = closestElement.getBoundingClientRect();
          if (mouseY < rect.top + rect.height / 2) {
            column.insertBefore(this.draggedElement.element, closestElement);
          } else {
            column.insertBefore(
              this.draggedElement.element,
              closestElement.nextSibling
            );
          }
        }
      });

      column.addEventListener("dragleave", () => {
        column.classList.remove("dragover");
      });

      column.addEventListener("drop", (e) => {
        column.classList.remove("dragover");
        if (!this.draggedElement) return;
        e.preventDefault();
        e.stopPropagation();

        const columnEl = column.closest(".builder-column");
        const rowEl = column.closest(".builder-row");
        if (!columnEl || !rowEl) return;

        const targetRowId = rowEl.dataset.id;
        const targetColumnId = columnEl.dataset.id;

        // Encontrar las filas y columnas en el modelo de datos
        const sourceRow = this.rows.find(
          (r) => r.id === this.draggedElement.sourceRowId
        );
        const sourceColumn = sourceRow?.columns.find(
          (c) => c.id === this.draggedElement.sourceColumnId
        );
        const targetRow = this.rows.find((r) => r.id === targetRowId);
        const targetColumn = targetRow?.columns.find(
          (c) => c.id === targetColumnId
        );

        if (!sourceColumn || !targetColumn) return;

        // Encontrar el elemento y su nueva posición
        const elementToMove = sourceColumn.elements.find(
          (el) => el.id === this.draggedElement.elementId
        );

        if (!elementToMove) return;

        // Obtener la nueva posición basada en el orden visual
        const elements = Array.from(column.children);
        const newIndex = elements.findIndex(
          (el) => el.dataset.id === this.draggedElement.elementId
        );

        // Remover el elemento de la fuente
        sourceColumn.elements = sourceColumn.elements.filter(
          (el) => el.id !== this.draggedElement.elementId
        );

        // Insertar en el destino en la posición correcta
        if (newIndex === -1) {
          targetColumn.elements.push(elementToMove);
        } else {
          targetColumn.elements.splice(newIndex, 0, elementToMove);
        }

        // Actualizar el store
        store.setState({ ...state, rows });

        // Limpiar estado
        this.draggedElement = null;
        this.render();
      });
    });
  }

  addElementToColumn(rowId, columnId, elementType) {
    if (!rowId || !columnId || !elementType) {
      return;
    }

    const state = store.getState();

    const elementConfig = {
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: elementType,
      ...this.getDefaultContent(elementType),
    };

    const addToColumns = (columns) => {
      return columns.map((column) => {
        if (column.id === columnId) {
          return { ...column, elements: [...(column.elements || []), elementConfig] };
        }
        // Search inside nested row elements
        return {
          ...column,
          elements: (column.elements || []).map((el) => {
            if (el.type === "row" && el.columns) {
              return { ...el, columns: addToColumns(el.columns) };
            }
            return el;
          }),
        };
      });
    };

    const updatedRows = state.rows.map((row) => {
      if (row.id === rowId) {
        return { ...row, columns: addToColumns(row.columns) };
      }
      return row;
    });

    store.setState({ ...state, rows: updatedRows, selectedElement: null });
  }

  addElementToContainer(containerId, elementType) {
    if (!containerId || !elementType) return;

    const state = store.getState();
    const elementConfig = {
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: elementType,
      ...this.getDefaultContent(elementType),
    };

    const addToContainer = (elements) => {
      return elements.map((el) => {
        if (el.id === containerId && el.type === "container") {
          return { ...el, elements: [...(el.elements || []), elementConfig] };
        }
        if (el.type === "row" && el.columns) {
          return { ...el, columns: el.columns.map((col) => ({
            ...col,
            elements: addToContainer(col.elements || []),
          }))};
        }
        if (el.type === "container" && el.elements) {
          return { ...el, elements: addToContainer(el.elements) };
        }
        return el;
      });
    };

    const updatedRows = state.rows.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        elements: addToContainer(column.elements || []),
      })),
    }));

    store.setState({ ...state, rows: updatedRows, selectedElement: null });
  }

  addNestedRowToColumn(rowId, columnId, rowType, responsiveConfig) {
    const numColumns = parseInt(rowType.split("-")[1], 10);
    const timestamp = Date.now();
    const rand = () => Math.random().toString(36).slice(2, 9);

    const nestedRowElement = {
      id: `element-${timestamp}-${rand()}`,
      type: "row",
      tag: "div",
      content: "",
      columns: Array.from({ length: numColumns }, (_, index) => ({
        id: `nested-col-${timestamp}-${index}-${rand()}`,
        elements: [],
      })),
      styles: {},
      attributes: { columnCount: numColumns },
    };

    if (responsiveConfig) {
      nestedRowElement.responsive = responsiveConfig;
    }

    const state = store.getState();
    const updatedRows = state.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          columns: row.columns.map((column) => {
            if (column.id === columnId) {
              return {
                ...column,
                elements: [...(column.elements || []), nestedRowElement],
              };
            }
            return column;
          }),
        };
      }
      return row;
    });

    store.setState({ ...state, rows: updatedRows });
  }

  getDefaultContent(type) {
    const defaults = {
      heading: {
        tag: "h2",
        content: "New Heading",
        styles: {
          color: "#333333",
          margin: "0 0 1rem 0",
          padding: "0.5rem",
          fontFamily: "inherit",
          fontSize: "24px",
          fontWeight: "500",
        },
      },
      text: {
        tag: "p",
        content: "New text block",
        styles: {
          color: "#666666",
          margin: "0 0 1rem 0",
          padding: "0.5rem",
          lineHeight: "1.5",
          fontSize: "16px",
        },
      },
      button: {
        tag: "button",
        content: "Click me",
        styles: {
          background: "#2196F3",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "500",
        },
      },
      link: {
        tag: "a",
        content: "Enlace",
        attributes: {
          href: "#",
          target: "_blank"
        },
        styles: {
          color: "#2196F3",
          textDecoration: "underline",
          cursor: "pointer",
          fontSize: "16px",
        },
      },
      image: {
        tag: "img",
        attributes: {
          src: "https://picsum.photos/400/300",
          alt: this.i18n.t("builder.editor.elements.image.alt"),
        },
        styles: {
          maxWidth: "100%",
          height: "auto",
          display: "block",
        },
      },
      table: {
        tag: "table",
        attributes: {
          rows: 3,
          columns: 3,
          headerStyle: "top",
        },
        content: `
          <tr>
            <th>Encabezado 1</th>
            <th>Encabezado 2</th>
            <th>Encabezado 3</th>
          </tr>
          <tr>
            <td>Celda 1</td>
            <td>Celda 2</td>
            <td>Celda 3</td>
          </tr>
          <tr>
            <td>Celda 4</td>
            <td>Celda 5</td>
            <td>Celda 6</td>
          </tr>`,
        styles: {
          width: "100%",
          borderCollapse: "collapse",
          borderWidth: "1px",
          borderColor: "#dddddd",
          borderStyle: "solid",
          cellPadding: "8px",
        },
      },
      list: {
        tag: "ul",
        content: "Elemento 1\nElemento 2\nElemento 3",
        styles: {
          listStyleType: "disc",
          paddingLeft: "20px",
          margin: "1rem 0",
          lineHeight: "1.6",
        },
      },
      video: {
        tag: "iframe",
        attributes: {
          src: "",
          frameborder: "0",
          allowfullscreen: true,
          aspectRatio: "16/9",
        },
        styles: {
          width: "100%",
          aspectRatio: "16/9",
          border: "none",
          backgroundColor: "#f5f5f5",
        },
      },
      spacer: {
        tag: "div",
        styles: {
          height: "20px",
          width: "100%",
          backgroundColor: "transparent",
          margin: "0",
          padding: "0",
        },
      },
      divider: {
        tag: "hr",
        styles: {
          border: "none",
          borderTop: "1px solid #eee",
          margin: "1rem 0",
        },
      },
      html: {
        tag: "div",
        content: this.i18n.t("builder.editor.elements.default.content"),
        styles: {
          padding: "1rem",
          background: "#f5f5f5",
        },
      },
      container: {
        tag: "div",
        content: "",
        elements: [],
        styles: {
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "20px",
          minHeight: "80px",
          borderRadius: "0",
          overflow: "visible",
          backgroundColor: "transparent",
        },
      },
    };

    return (
      defaults[type] || {
        tag: "div",
        content: "Elemento sin configurar",
        styles: {},
      }
    );
  }

  renderElement(element) {
    const { tag, content, attributes = {} } = element;

    // Solo una declaración de estilos
    const styleString = Object.entries(element.styles || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (typeof value === "number" && value !== 0 && !cssKey.includes("opacity") && !cssKey.includes("flex") && cssKey !== "font-weight") {
          value = `${value}px`;
        }
        return `${cssKey}: ${value}`;
      })
      .join(";");

    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    // Wrapper styles (display:flex + user-defined wrapper properties)
    const ws = element.wrapperStyles || {};
    const hasWrapperStyles = Object.keys(ws).length > 0;
    const wrapperStyleString = hasWrapperStyles
      ? Object.entries({ display: "flex", ...ws })
          .map(([key, value]) => {
            const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
            if (typeof value === "number" && value !== 0 && !cssKey.includes("opacity") && !cssKey.includes("flex")) {
              value = `${value}px`;
            }
            return `${cssKey}: ${value}`;
          })
          .join(";")
      : "";

    const elementControls = `
      <div class="element-controls">
        <button class="element-delete" title="Delete" data-element-id="${element.id}">
          <builder-icon name="delete" size="16"></builder-icon>
        </button>
      </div>
    `;

    // Mantener el switch para casos especiales
    switch (element.type) {
      case "row": {
        const nestedColumns = element.columns || [];
        return `
          <div class="builder-element-wrapper nested-row-element">
            ${elementControls}
            <div class="builder-element nested-row"
                 data-id="${element.id}"
                 data-type="row"
                 style="${styleString}">
              <div class="row-inner" style="display: grid; grid-template-columns: repeat(${nestedColumns.length}, 1fr); gap: 20px;">
                ${nestedColumns.map(col => `
                  <div class="builder-column nested-column" data-id="${col.id}" data-parent-element="${element.id}">
                    <div class="column-dropzone">
                      ${col.elements.length === 0
                        ? `<div class="empty-column"><span>${this.i18n.t("builder.sidebar.dropHint")}</span></div>`
                        : col.elements.map(el => this.renderElement(el)).join("")
                      }
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        `;
      }

      case "container": {
        const childElements = element.elements || [];
        const isEmpty = childElements.length === 0;
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <div class="builder-element container-element"
                 data-id="${element.id}"
                 data-type="container"
                 style="${styleString}">
              ${isEmpty
                ? `<div class="container-placeholder"><span>${this.i18n.t("builder.sidebar.dropHint")}</span></div>`
                : childElements.map(el => this.renderElement(el)).join("")
              }
            </div>
          </div>
        `;
      }

      case "table":
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <table class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}">
              ${sanitizeHTML(content)}
            </table>
          </div>
        `;

      case "list":
        const items = content
          .split("\n")
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <${tag} class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}">
              ${items}
            </${tag}>
          </div>
        `;

      case "video":
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <div class="video-container builder-element" data-id="${element.id}" data-type="${element.type}" style="position: relative; ${styleString}">
              <iframe ${attributesString} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
            </div>
          </div>
        `;

      case "spacer":
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <div class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}"></div>
          </div>
        `;

      case "image":
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <img ${attributesString} style="${styleString}" class="builder-element" data-id="${element.id}" data-type="${element.type}">
          </div>
        `;

      default:
        return `
          <div class="builder-element-wrapper" style="${wrapperStyleString}">
            ${elementControls}
            <${tag} style="${styleString}" class="builder-element" data-id="${
          element.id
        }" data-type="${element.type}" ${attributesString}>
              ${["html", "text", "heading"].includes(element.type) ? sanitizeHTML(content) : (content || "")}
            </${tag}>
          </div>
        `;
    }
  }

  deleteElement(elementId) {
    const state = store.getState();
    let elementDeleted = false;

    const deleteFromElements = (elements) => {
      const idx = elements.findIndex(el => el.id === elementId);
      if (idx !== -1) {
        elementDeleted = true;
        return [...elements.slice(0, idx), ...elements.slice(idx + 1)];
      }
      return elements.map(el => {
        if (el.type === "row" && el.columns) {
          return {
            ...el,
            columns: el.columns.map(col => ({
              ...col,
              elements: deleteFromElements(col.elements || []),
            })),
          };
        }
        if (el.type === "container" && el.elements) {
          return { ...el, elements: deleteFromElements(el.elements) };
        }
        return el;
      });
    };

    const updatedRows = state.rows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({
        ...column,
        elements: deleteFromElements(column.elements || []),
      })),
    }));

    if (elementDeleted) {
      store.setState({ ...state, rows: updatedRows });
      this.emitContentChanged();
    }
  }

  async loadPageData(pageId) {

    try {
      const savedData = await CanvasStorage.loadCanvas(pageId);

      const initialState = {
        pageId, // <-- Importante: Asegurarnos de incluir el pageId
        rows: [],
        globalSettings: {
          maxWidth: "1200px",
          padding: "20px",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      };

      if (savedData) {
        if (Array.isArray(savedData.rows)) {
          const restoreElements = (elements) => {
            return (elements || []).map((element) => {
              const restored = { ...element, styles: element.styles || {} };
              if (element.wrapperStyles) {
                restored.wrapperStyles = element.wrapperStyles;
              }
              if (element.type === "row" && element.columns) {
                restored.columns = element.columns.map((col) => ({
                  ...col,
                  elements: restoreElements(col.elements),
                }));
                if (element.responsive) {
                  restored.responsive = element.responsive;
                }
              }
              if (element.type === "container" && element.elements) {
                restored.elements = restoreElements(element.elements);
              }
              return restored;
            });
          };

          initialState.rows = savedData.rows.map((row) => {
            const restoredRow = {
              ...row,
              styles: row.styles || {},
              columns: row.columns.map((column) => ({
                ...column,
                elements: restoreElements(column.elements),
              })),
            };
            if (row.responsive) {
              restoredRow.responsive = row.responsive;
            }
            return restoredRow;
          });
        }
        if (savedData.globalSettings) {
          initialState.globalSettings = {
            ...initialState.globalSettings,
            ...savedData.globalSettings,
          };
        }
      }

      // Actualizar el estado
      store.setState(initialState);

      // Si hay datos, actualizar el historial
      if (savedData) {
        this.history.pushState(initialState);
      }

    } catch (error) {
      console.error("🎨 Canvas - Error loading page data:", error);
      store.setState({
        pageId,
        rows: [],
        globalSettings: {
          maxWidth: "1200px",
          padding: "20px",
          backgroundColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        },
      });
    }
  }

  handleHistoryChange(event) {
    // Actualizar correctamente el estado de los botones
    const { canUndo, canRedo } = event.detail;

    const undoButton = this.shadowRoot.querySelector(".undo-button");
    const redoButton = this.shadowRoot.querySelector(".redo-button");

    if (undoButton) {
      undoButton.disabled = !canUndo;
      undoButton.classList.toggle("active", canUndo);
    }
    if (redoButton) {
      redoButton.disabled = !canRedo;
      redoButton.classList.toggle("active", canRedo);
    }
  }

  handleUndo() {
    if (this._isUndoRedoOperation) return;

    const previousState = this.history.undo();
    if (previousState) {
      this._isUndoRedoOperation = true;
      store.setState(previousState);
      this._isUndoRedoOperation = false;
    }
  }

  handleRedo() {
    if (this._isUndoRedoOperation) return;

    const nextState = this.history.redo();
    if (nextState) {
      this._isUndoRedoOperation = true;
      store.setState(nextState);
      this._isUndoRedoOperation = false;
    }
  }

  setPageId(pageId) {
    
    const currentState = store.getState();
    const savedData = CanvasStorage.loadCanvas(pageId);

    const newState = {
      ...currentState,
      pageId
    };

    if (savedData) {
      if (savedData.rows) {
        newState.rows = savedData.rows;
      }
      if (savedData.globalSettings) {
        newState.globalSettings = savedData.globalSettings;
      }
    }
    
    store.setState(newState);
    this.emitContentChanged();
  }

  loadSavedCanvas() {
    const state = store.getState();
    if (!state.pageId) return;

    const savedData = CanvasStorage.loadCanvas(state.pageId);
    if (savedData) {
      const newState = { ...state };
      
      if (savedData.rows) {
        newState.rows = savedData.rows;
      }
      if (savedData.globalSettings) {
        newState.globalSettings = savedData.globalSettings;
      }
      
      store.setState(newState);
    }
  }

  setupRowEventListeners() {
    // Los eventos ahora se manejan a través de eventBus en setupEventSubscriptions
    this.setupRowDragEvents();
  }

  handleRowDelete(e) {
    const { rowId } = e.detail;
    const state = store.getState();
    const updatedRows = state.rows.filter((row) => row.id !== rowId);
    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  handleRowDuplicate(e) {
    const { rowId } = e.detail;
    const state = store.getState();
    const sourceRow = state.rows.find((row) => row.id === rowId);

    if (!sourceRow) return;

    const rand = () => Math.random().toString(36).slice(2, 11);

    const deepCopyElements = (elements) => {
      return (elements || []).map((element) => {
        const copied = {
          ...element,
          id: `element-${Date.now()}-${rand()}`,
        };
        if (element.type === "row" && element.columns) {
          copied.columns = element.columns.map((col) => ({
            ...col,
            id: `nested-col-${Date.now()}-${rand()}`,
            elements: deepCopyElements(col.elements),
          }));
        }
        return copied;
      });
    };

    const newRow = {
      ...sourceRow,
      id: `row-${Date.now()}-${rand()}`,
      columns: sourceRow.columns.map((col) => ({
        id: `column-${Date.now()}-${rand()}`,
        elements: deepCopyElements(col.elements),
      })),
    };

    // Find index and insert after
    const rowIndex = state.rows.findIndex((row) => row.id === rowId);
    const updatedRows = [...state.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);

    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  handleRowAdd(e) {
    const { rowId } = e.detail;
    const state = store.getState();

    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: "row-1",
      columns: [
        {
          id: `column-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          elements: [],
        },
      ],
    };

    const rowIndex = state.rows.findIndex((row) => row.id === rowId);
    const updatedRows = [...state.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);

    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  handleRowDragStart(e) {
    const { rowId } = e.detail;
    const row = this.shadowRoot.querySelector(`[data-id="${rowId}"]`);
    if (row) {
      this.createTemporaryDropZones(row);
    }
  }

  handleRowSelect(e) {
    const { rowId } = e.detail || e;
    const state = store.getState();


    // Deselect elements first
    this.shadowRoot
      ?.querySelectorAll(".builder-element.selected")
      .forEach((el) => el.classList.remove("selected"));

    // Update row selection state
    const updatedRows = state.rows.map((row) => ({
      ...row,
      selected: row.id === rowId,
    }));

    const selectedRow = state.rows.find((r) => r.id === rowId);

    // Update store
    store.setState({
      ...state,
      rows: updatedRows,
      selectedRow,
    });

    // Solo emitir si no vino de eventBus para evitar bucles
    if (!e.detail?.fromEventBus) {
      eventBus.emit("rowSelected", {
        row: selectedRow,
        fromEventBus: true
      });
    }

    // Force rerender
    requestAnimationFrame(() => {
      const rowControls = this.shadowRoot.querySelectorAll("row-controls");
      rowControls.forEach((control) => {
        const isSelected = control.getAttribute("row-id") === rowId;
        control.setAttribute("selected", isSelected.toString());
      });
    });
  }

  setupRowDragEvents() {
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Eventos de drag & drop en la fila
      row.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        row.classList.add("dragging");
        e.dataTransfer.setData("application/x-row-id", row.dataset.id);
        e.dataTransfer.effectAllowed = "move";

        requestAnimationFrame(() => {
          this.createTemporaryDropZones(row);
        });
      });

      row.addEventListener("dragend", (e) => {
        e.stopPropagation();
        row.classList.remove("dragging");
        row.setAttribute("draggable", "false");
        this.removeTemporaryDropZones();
      });
    });
  }

  selectRow(rowId) {
    const state = store.getState();
    const rows = state.rows || [];

    // Deseleccionar elementos
    this.shadowRoot
      .querySelectorAll(".builder-element.selected")
      .forEach((el) => el.classList.remove("selected"));
    eventBus.emit("elementDeselected");

    // Actualizar estado de selección de filas
    const updatedRows = rows.map((row) => ({
      ...row,
      selected: row.id === rowId,
    }));

    // Actualizar store
    store.setState({
      ...state,
      rows: updatedRows,
      selectedRow: rows.find((r) => r.id === rowId),
    });

    // Emitir evento de selección
    eventBus.emit("rowSelected", {
      row: rows.find((r) => r.id === rowId),
    });
  }

  // Método para obtener los datos del editor
  getEditorData() {
    const state = store.getState();

    const serializeElements = (elements) => {
      return (elements || []).map((element) => {
        const base = {
          id: element.id,
          type: element.type,
          tag: element.tag,
          content: element.content,
          styles: element.styles || {},
          attributes: element.attributes || {},
        };
        if (element.wrapperStyles && Object.keys(element.wrapperStyles).length > 0) {
          base.wrapperStyles = element.wrapperStyles;
        }
        if (element.type === "row" && element.columns) {
          base.columns = element.columns.map((col) => ({
            id: col.id,
            elements: serializeElements(col.elements),
          }));
          if (element.responsive) {
            base.responsive = element.responsive;
          }
        }
        if (element.type === "container" && element.elements) {
          base.elements = serializeElements(element.elements);
        }
        return base;
      });
    };

    return {
      globalSettings: state.globalSettings || {},
      rows: (state.rows || []).map((row) => {
        const serialized = {
          id: row.id,
          type: row.type,
          styles: row.styles || {},
          columns: (row.columns || []).map((column) => ({
            id: column.id,
            elements: serializeElements(column.elements),
          })),
        };
        if (row.responsive) {
          serialized.responsive = row.responsive;
        }
        return serialized;
      }),
    };
  }

  // Método para emitir cambios
  emitContentChanged(suppressEvent = false) {
    const data = this.getEditorData();

    if (!suppressEvent && !this._isUndoRedoOperation) {
      this.history.pushState(data);
      eventBus.emit("contentChanged", data);
    }

    // Only persist to localStorage if storageMode is not "external"
    const state = store.getState();
    if (state.storageMode === "external") return;

    if (state.pageId) {
      CanvasStorage.saveCanvas(state.pageId, data);
    }
  }

  // Método para establecer los datos del editor
  setEditorData(data, suppressEvent = false) {
    if (!data) return;

    const currentState = store.getState();
    const newState = { ...currentState };

    if (data.globalSettings) {
      newState.globalSettings = { ...currentState.globalSettings, ...data.globalSettings };
    }

    if (data.rows) {
      newState.rows = data.rows;
    }

    store.setState(newState);
    if (suppressEvent) {
      this.render(suppressEvent);
    }
  }
}

customElements.define("builder-canvas", BuilderCanvas);
