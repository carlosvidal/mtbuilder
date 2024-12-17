import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { CanvasStorage } from "../utils/canvas-storage.js";
import { History } from "../utils/history.js";
import { I18n } from "../utils/i18n.js";
import { RowControls } from "./row-controls.js";

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

    console.log("🔍 Initial store state:", store.getState());

    // Ensure we have a valid initial state
    const initialState = store.getState() || {};
    if (!Array.isArray(initialState.rows)) {
      console.log("🔍 Initializing empty state");
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
      console.log("🟡 Canvas received row-drag-start", e.detail.rowId);
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
    console.log("🎨 Canvas - Connected");

    const pageId = this.getAttribute("pageId");
    if (pageId) {
      console.log("🎨 Canvas - Loading page data for:", pageId);
      await this.loadPageData(pageId);
    } else {
      console.log(
        "🎨 Canvas - No pageId provided, initializing with default state"
      );
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
    if (this._rowUpdatedHandler) {
      window.builderEvents.removeEventListener(
        "rowUpdated",
        this._rowUpdatedHandler
      );
    }
    this.unsubscribeStore();
    eventBus.off("globalSettingsUpdated");
    eventBus.off("rowUpdated");
    eventBus.off("rowSelected");
    eventBus.off("elementSelected");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue && newValue !== oldValue) {
      console.log("Canvas: pageId attribute changed to", newValue);
      this.pageId = newValue;

      const savedData = CanvasStorage.loadCanvas(newValue);
      console.log("Canvas attributeChangedCallback - loaded data:", savedData);

      // Aquí falta cargar los globalSettings
      if (savedData) {
        if (savedData.rows) {
          this.rows = JSON.parse(JSON.stringify(savedData.rows));
        }
        if (savedData.globalSettings) {
          // Añadir esta parte
          this.globalSettings = savedData.globalSettings;
        }
        this.render();
      }
    }
  }

  // 3. Métodos de renderizado
  render(suppressEvent = false) {
    console.log("🎨 Canvas - Render called with state:", store.getState());

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
  padding: 1rem 3rem 1rem 1rem;
  background: white;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
  cursor: default;
}

.row-handle {
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
  color: #666;
  z-index: 10;
}

.builder-row:hover {
  border-color: #e0e0e0;
}

.builder-row:hover .row-handle {
  opacity: 1;
}

.row-handle:active {
  cursor: grabbing;
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
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s ease;
  margin: 0.5rem;
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
  border-color: #2196F3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

    // Setup after render
    if (!suppressEvent) {
      requestAnimationFrame(() => {
        this.setupDropZone();
        this.setupEventListeners();
        this.setupElementSelection();

        if (!this._isUndoRedoOperation) {
          this.emitContentChanged(suppressEvent);
        }
      });
    }

    console.log("🎨 Canvas - Render completed");
  }

  renderRow(row) {
    console.log("Rendering row:", row);

    // Generar string de estilos
    const styles = Object.entries(row.styles || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        // Para valores numéricos, agregar px si no tienen unidad
        const cssValue = /^\d+$/.test(value) ? `${value}px` : value;
        return `${cssKey}: ${cssValue}`;
      })
      .join(";");

    console.log("Row styles:", styles); // Log para debugging

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
    // Asegurarnos de limpiar primero los listeners existentes
    if (this._rowUpdatedHandler) {
      window.builderEvents.removeEventListener(
        "rowUpdated",
        this._rowUpdatedHandler
      );
    }

    // Crear nuevo handler
    this._rowUpdatedHandler = (e) => {
      console.log("🎯 Canvas - Received rowUpdated event", e.detail);
      this.handleRowUpdated(e);
    };

    // Agregar el listener
    window.builderEvents.addEventListener(
      "rowUpdated",
      this._rowUpdatedHandler
    );

    // Remover los event listeners de drag globales
    eventBus.on("stateChanged", (newState, prevState) => {
      console.log("🔍 State changed", {
        prevRows: prevState?.rows?.length,
        newRows: newState?.rows?.length,
      });
    });

    // Solo mantener los listeners necesarios para el estado
    this.unsubscribeStore = store.subscribe((newState, prevState) => {
      console.log("🔄 Store state changed:", {
        rowsChanged: newState.rows !== prevState?.rows,
        settingsChanged: newState.globalSettings !== prevState?.globalSettings,
      });
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

  emitContentChanged(suppressEvent = false) {
    const data = this.getEditorData();
    console.log("Emitting content changed, data:", data);

    if (!suppressEvent && !this._isUndoRedoOperation) {
      this.history.pushState(data);
      eventBus.emit("contentChanged", data);
    }

    // Guardar si hay pageId
    const state = store.getState();
    if (state.pageId) {
      console.log("Saving to storage, pageId:", state.pageId);
      CanvasStorage.saveCanvas(state.pageId, data);
    } else {
      console.warn("No pageId found in state");
    }
  }

  // 5. Manipulación de filas
  addRow(rowType) {
    console.log("🔍 AddRow called:", {
      rowType,
      currentRows: store.getState().rows?.length,
    });

    const state = store.getState();
    const timestamp = Date.now();
    const numColumns = parseInt(rowType.split("-")[1], 10);

    console.log("🔍 Creating new row:", {
      type: rowType,
      columns: numColumns,
    });

    const newRow = {
      id: `row-${timestamp}`,
      type: rowType,
      styles: {},
      columns: Array.from({ length: numColumns }, (_, index) => ({
        id: `column-${timestamp}-${index}`,
        elements: [],
      })),
    };

    console.log("🔍 New row created:", newRow);

    store.setState({
      ...state,
      rows: [...(state.rows || []), newRow],
    });

    console.log(
      "🔍 Store updated with new row, current state:",
      store.getState()
    );
  }

  deleteRow(rowId) {
    const state = store.getState();
    const updatedRows = state.rows.filter((row) => row.id !== rowId);
    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  moveRow(rowId, targetIndex) {
    console.log("Moving row", rowId, "to index", targetIndex);
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
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columns: sourceRow.columns.map((col) => ({
        id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        elements: col.elements.map((element) => ({
          ...element,
          id: `element-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
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

    // Limpiar eventos existentes
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    // Configurar eventos de drag & drop para filas existentes
    this.setupRowDragEvents();

    // Mantener el comportamiento existente para nuevos elementos
    const dropHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      newCanvas.classList.remove("dragover");

      // Remover el handler temporalmente para evitar duplicación
      newCanvas.removeEventListener("drop", dropHandler);

      const rowType = e.dataTransfer.getData("text/plain");
      const elementType = e.dataTransfer.getData(
        "application/x-builder-element"
      );

      console.log("Drop event data:", { rowType, elementType });

      if (rowType?.startsWith("row-")) {
        this.addRow(rowType);
      } else if (elementType) {
        const dropTarget = e.target.closest(".column-dropzone");
        if (dropTarget) {
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

      // Re-añadir el handler después de un pequeño delay
      setTimeout(() => {
        newCanvas.addEventListener("drop", dropHandler);
      }, 0);
    };

    newCanvas.addEventListener("dragover", (e) => {
      const isRowDrag = e.dataTransfer.types.includes("application/x-row-id");
      if (!isRowDrag) {
        e.preventDefault();
        e.stopPropagation();
        newCanvas.classList.add("dragover");
      }
    });

    newCanvas.addEventListener("dragleave", () => {
      newCanvas.classList.remove("dragover");
    });

    newCanvas.addEventListener("drop", dropHandler);
  }

  handleRowDrop(e, draggedRowId) {
    const state = store.getState();
    const currentRows = [...state.rows];
    const draggedRowIndex = currentRows.findIndex(
      (row) => row.id === draggedRowId
    );

    if (draggedRowIndex === -1) {
      console.warn("Dragged row not found:", draggedRowId);
      return;
    }

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
      console.log(
        `🎯 Drop position: ${insertAfter ? "after" : "before"} row ${targetId}`
      );
    } else {
      newIndex = currentRows.length;
      console.log("🎯 Dropping at end of list");
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
    console.log("Setting up row drag events");
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Eventos de drag & drop en la fila
      row.addEventListener("dragstart", (e) => {
        console.log("Row dragstart", row.dataset.id);
        e.stopPropagation();
        row.classList.add("dragging");
        e.dataTransfer.setData("application/x-row-id", row.dataset.id);
        e.dataTransfer.effectAllowed = "move";

        requestAnimationFrame(() => {
          this.createTemporaryDropZones(row);
        });
      });

      row.addEventListener("dragend", (e) => {
        console.log("Row dragend");
        e.stopPropagation();
        row.classList.remove("dragging");
        row.setAttribute("draggable", "false");
        this.removeTemporaryDropZones();
      });
    });
  }

  setupElementSelection() {
    if (this.elementUpdateListener) {
      window.builderEvents.removeEventListener(
        "elementUpdated",
        this.elementUpdateListener
      );
    }

    const elements = this.shadowRoot.querySelectorAll(".builder-element");

    elements.forEach((element) => {
      // Make text elements editable
      if (["heading", "text", "button"].includes(element.dataset.type)) {
        this.setupTextEditing(element);
      }

      element.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (e.target.isContentEditable) {
          return;
        }

        this.shadowRoot.querySelectorAll(".selected").forEach((el) => {
          el.classList.remove("selected");
        });

        // Deseleccionar fila si hay alguna seleccionada
        this.rows.forEach((row) => (row.selected = false));
        window.builderEvents.dispatchEvent(new CustomEvent("rowDeselected"));

        element.classList.add("selected");

        const elementId = element.dataset.id;
        const elementData = this.findElementById(elementId);

        if (elementData) {
          window.builderEvents.dispatchEvent(
            new CustomEvent("elementSelected", {
              detail: elementData,
            })
          );
        }
      });
    });

    this.elementUpdateListener = (e) => {
      const { elementId, styles } = e.detail;
      this.updateElementStyles(elementId, styles);
    };

    window.builderEvents.addEventListener(
      "elementUpdated",
      this.elementUpdateListener
    );
  }

  setupTextEditing(element) {
    element.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      e.preventDefault();

      element.contentEditable = true;
      element.focus();

      // Select all text
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });

    element.addEventListener("blur", () => {
      element.contentEditable = false;

      const elementId = element.dataset.id;
      const elementData = this.findElementById(elementId);

      if (elementData) {
        elementData.content = element.textContent;
        this.emitContentChanged();
      }
    });

    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        element.blur();
      }
    });
  }

  // En builder-canvas.js
  updateElementStyles(elementId, styles) {
    let elementUpdated = false;

    for (const row of this.rows) {
      for (const column of row.columns) {
        const element = column.elements.find((el) => el.id === elementId);
        if (element) {
          // Actualizar el modelo de datos
          element.styles = { ...element.styles, ...styles };
          elementUpdated = true;

          // Actualizar el DOM
          const elementToUpdate = this.shadowRoot.querySelector(
            `[data-id="${elementId}"]`
          );
          if (elementToUpdate) {
            Object.entries(styles).forEach(([key, value]) => {
              const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
              if (key.startsWith("margin") || key.startsWith("padding")) {
                elementToUpdate.style[key] = value + "px";
              } else if (key === "fontSize") {
                elementToUpdate.style[cssKey] = value + "px";
              } else {
                elementToUpdate.style[cssKey] = value;
              }
            });
          }
          break;
        }
      }
    }

    if (elementUpdated) {
      this.emitContentChanged(); // Emitir cambios solo si hubo una actualización
    }
  }

  findElementById(id) {
    console.log("Finding element by id:", id);
    console.log("Current rows:", this.rows);
    for (const row of this.rows) {
      for (const column of row.columns) {
        const element = column.elements.find((el) => el.id === id);
        if (element) {
          console.log("Found element:", element);
          return element;
        }
      }
    }
    console.log("Element not found");
    return null;
  }

  handleRowUpdated(event) {
    console.log("🎯 Canvas - Processing row update:", event.detail);
    const { rowId, styles, columns, type } = event.detail;

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

    console.log("🎯 Canvas - Updated row:", updatedRows[rowIndex]);

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
    // Limpiar listeners anteriores
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (canvas) {
      const newCanvas = canvas.cloneNode(true);
      canvas.parentNode.replaceChild(newCanvas, canvas);
    }

    requestAnimationFrame(() => {
      this.setupElementDragging();
      this.setupDropZone();
      this.setupElementSelection();
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
        if (!this.draggedElement) return;
        e.preventDefault();
        e.stopPropagation();

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

      column.addEventListener("drop", (e) => {
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
      console.warn("Missing required parameters:", {
        rowId,
        columnId,
        elementType,
      });
      return;
    }

    const state = store.getState();

    // Configure new element
    const elementConfig = {
      id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: elementType,
      ...this.getDefaultContent(elementType),
    };

    console.log("Adding element config:", elementConfig);

    // Update rows in state
    const updatedRows = state.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          columns: row.columns.map((column) => {
            if (column.id === columnId) {
              return {
                ...column,
                elements: [...(column.elements || []), elementConfig],
              };
            }
            return column;
          }),
        };
      }
      return row;
    });

    console.log("Updated rows:", updatedRows);

    // Update store with new rows
    store.setState({
      ...state,
      rows: updatedRows,
      selectedElement: null, // Clear any selected element
    });
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
      image: {
        tag: "img",
        attributes: {
          src: "/api/placeholder/400/300",
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
        return `${cssKey}: ${value}`;
      })
      .join(";");

    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    const elementControls = `
      <div class="element-controls">
        <button class="element-delete" title="Delete" data-element-id="${element.id}">
          <builder-icon name="delete" size="16"></builder-icon>
        </button>
      </div>
    `;

    // Mantener el switch para casos especiales
    switch (element.type) {
      case "table":
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <table class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}">
              ${content}
            </table>
          </div>
        `;

      case "list":
        const items = content
          .split("\n")
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <${tag} class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}">
              ${items}
            </${tag}>
          </div>
        `;

      case "video":
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <div class="video-container builder-element" data-id="${element.id}" data-type="${element.type}" style="position: relative; ${styleString}">
              <iframe ${attributesString} style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
            </div>
          </div>
        `;

      case "spacer":
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <div class="builder-element" style="${styleString}" data-id="${element.id}" data-type="${element.type}"></div>
          </div>
        `;

      case "image":
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <img ${attributesString} style="${styleString}" class="builder-element" data-id="${element.id}" data-type="${element.type}">
          </div>
        `;

      default:
        return `
          <div class="builder-element-wrapper">
            ${elementControls}
            <${tag} style="${styleString}" class="builder-element" data-id="${
          element.id
        }" data-type="${element.type}" ${attributesString}>
              ${content || ""}
            </${tag}>
          </div>
        `;
    }
  }

  deleteElement(elementId) {
    for (let row of this.rows) {
      for (let column of row.columns) {
        const elementIndex = column.elements.findIndex(
          (el) => el.id === elementId
        );
        if (elementIndex !== -1) {
          // Eliminar el elemento
          column.elements.splice(elementIndex, 1);
          // Guardar los cambios en el storage
          this.emitContentChanged();
          this.render();
          return;
        }
      }
    }
  }

  async loadPageData(pageId) {
    console.log("🎨 Canvas - Loading page data:", pageId);

    try {
      const savedData = await CanvasStorage.loadCanvas(pageId);
      console.log("🎨 Canvas - Loaded data:", savedData);

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
          // Procesar las filas asegurando que los estilos estén presentes
          initialState.rows = savedData.rows.map((row) => ({
            ...row,
            styles: row.styles || {},
            columns: row.columns.map((column) => ({
              ...column,
              elements: column.elements.map((element) => ({
                ...element,
                styles: element.styles || {},
              })),
            })),
          }));
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

      console.log("🎨 Canvas - State updated:", store.getState());
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
    console.log("Setting pageId:", pageId);
    this.pageId = pageId;

    const savedData = CanvasStorage.loadCanvas(pageId);
    console.log("Loaded canvas data:", savedData);

    if (savedData) {
      if (savedData.rows) {
        this.rows = JSON.parse(JSON.stringify(savedData.rows));
      }
      if (savedData.globalSettings) {
        // Añadir esta parte
        this.globalSettings = savedData.globalSettings;
      }
      this.render();
    }

    this.emitContentChanged();
  }

  loadSavedCanvas() {
    console.log("Loading saved canvas for pageId:", this.pageId);
    if (!this.pageId) return;

    const savedData = CanvasStorage.loadCanvas(this.pageId);
    if (savedData) {
      if (savedData.rows) {
        this.rows = savedData.rows;
      }
      if (savedData.globalSettings) {
        this.globalSettings = savedData.globalSettings;
      }
      this.render();
    }
  }

  setupRowEventListeners() {
    console.log("Setting up row event listeners");

    this.addEventListener("row-delete", (e) => {
      console.log("Row delete event received:", e.detail);
      this.handleRowDelete(e);
    });

    this.addEventListener("row-duplicate", (e) => {
      console.log("Row duplicate event received:", e.detail);
      this.handleRowDuplicate(e);
    });

    this.addEventListener("row-add", (e) => {
      console.log("Row add event received:", e.detail);
      this.handleRowAdd(e);
    });

    this.addEventListener("row-select", (e) => {
      console.log("Row select event received:", e.detail);
      this.handleRowSelect(e);
    });

    this.setupRowDragEvents();
  }

  handleRowDelete(e) {
    console.log("HandleRowDelete called with:", e.detail);
    const { rowId } = e.detail;
    const state = store.getState();
    console.log("Current state:", state);
    const updatedRows = state.rows.filter((row) => row.id !== rowId);
    console.log("Updated rows:", updatedRows);
    store.setState({ ...state, rows: updatedRows });
    this.emitContentChanged();
  }

  handleRowDuplicate(e) {
    const { rowId } = e.detail;
    const state = store.getState();
    const sourceRow = state.rows.find((row) => row.id === rowId);

    if (!sourceRow) return;

    // Create deep copy with new IDs
    const newRow = {
      ...sourceRow,
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      columns: sourceRow.columns.map((col) => ({
        id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        elements: col.elements.map((element) => ({
          ...element,
          id: `element-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        })),
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
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "row-1",
      columns: [
        {
          id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  handleRowSelect(e) {
    const { rowId } = e.detail;
    const state = store.getState();

    console.log("Selecting row:", rowId);

    // Deselect elements first
    this.shadowRoot
      .querySelectorAll(".builder-element.selected")
      .forEach((el) => el.classList.remove("selected"));

    // Update row selection state
    const updatedRows = state.rows.map((row) => ({
      ...row,
      selected: row.id === rowId,
    }));

    // Update store
    store.setState({
      ...state,
      rows: updatedRows,
      selectedRow: state.rows.find((r) => r.id === rowId),
    });

    // Emit selection event for other components
    eventBus.emit("rowSelected", {
      row: state.rows.find((r) => r.id === rowId),
    });

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
    console.log("Setting up row drag events");
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Eventos de drag & drop en la fila
      row.addEventListener("dragstart", (e) => {
        console.log("Row dragstart", row.dataset.id);
        e.stopPropagation();
        row.classList.add("dragging");
        e.dataTransfer.setData("application/x-row-id", row.dataset.id);
        e.dataTransfer.effectAllowed = "move";

        requestAnimationFrame(() => {
          this.createTemporaryDropZones(row);
        });
      });

      row.addEventListener("dragend", (e) => {
        console.log("Row dragend");
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
    return {
      globalSettings: state.globalSettings || {},
      rows: (state.rows || []).map((row) => ({
        id: row.id,
        type: row.type,
        styles: row.styles || {},
        columns: (row.columns || []).map((column) => ({
          id: column.id,
          elements: (column.elements || []).map((element) => ({
            id: element.id,
            type: element.type,
            tag: element.tag,
            content: element.content,
            styles: element.styles || {},
            attributes: element.attributes || {},
          })),
        })),
      })),
    };
  }

  // Método para emitir cambios
  emitContentChanged(suppressEvent = false) {
    const data = this.getEditorData();
    console.log("Emitting content changed, data:", data);

    if (!suppressEvent && !this._isUndoRedoOperation) {
      this.history.pushState(data);
      eventBus.emit("contentChanged", data);
    }

    // Guardar si hay pageId
    const state = store.getState();
    if (state.pageId) {
      console.log("Saving to storage, pageId:", state.pageId);
      CanvasStorage.saveCanvas(state.pageId, data);
    } else {
      console.warn("No pageId found in state");
    }
  }

  // Método para establecer los datos del editor
  setEditorData(data, suppressEvent = false) {
    if (!data) return;

    if (data.globalSettings) {
      this.globalSettings = { ...this.globalSettings, ...data.globalSettings };
    }

    if (data.rows) {
      this.rows = JSON.parse(JSON.stringify(data.rows));
    }

    this.render(suppressEvent);
  }
}

customElements.define("builder-canvas", BuilderCanvas);
