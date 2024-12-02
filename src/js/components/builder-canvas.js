// builder-canvas.js
import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { CanvasStorage } from "../utils/canvas-storage.js";
import { History } from "../utils/history.js";
import { I18n } from "../utils/i18n.js";

export class BuilderCanvas extends HTMLElement {
  constructor() {
    super();
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

    // Subscribe to store changes
    this.unsubscribeStore = store.subscribe(this.handleStateChange.bind(this));

    // Subscribe to events
    this.setupEventSubscriptions();
  }

  setupDropZone() {
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (!canvas) return;

    // Limpiar eventos existentes
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

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
      e.preventDefault();
      e.stopPropagation();
      newCanvas.classList.add("dragover");
    });

    newCanvas.addEventListener("dragleave", () => {
      newCanvas.classList.remove("dragover");
    });

    newCanvas.addEventListener("drop", dropHandler);
  }

  // Remover los event listeners globales
  setupEventSubscriptions() {
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

  setupRowEvents() {
    // Mover el código existente de setupRowEvents aquí
    window.builderEvents.addEventListener(
      "rowUpdated",
      this.handleRowUpdated.bind(this)
    );
  }

  handleGlobalSettingsUpdate(e) {
    console.log("🎯 Canvas - Received globalSettingsUpdate event", e.detail);
    const pageWrapper = this.shadowRoot.querySelector(".page-wrapper");
    console.log("🎯 Canvas - Current page wrapper:", pageWrapper);

    if (pageWrapper) {
      const { settings } = e.detail;
      Object.entries(settings).forEach(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        pageWrapper.style[cssKey] = value;
      });
      console.log("🎯 Canvas - Updated styles:", pageWrapper.style);

      // Añadir esta parte
      this.globalSettings = { ...this.globalSettings, ...settings };
      this.emitContentChanged(); // Para guardar los cambios
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

    // Forzar un render inicial
    this.render();

    // Setup event listeners
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
      this.setupElementSelection();
    });
  }
  static get observedAttributes() {
    return ["pageId"];
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
          initialState.rows = savedData.rows;
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

  // En builder-canvas.js, añadir estos métodos:

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

  // En builder-canvas.js
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

  // En builder-canvas.js, en el método emitContentChanged:

  emitContentChanged(suppressEvent = false) {
    const data = this.getEditorData();
    console.log("Emitting content changed, data:", data); // Añadir log

    if (!suppressEvent && !this._isUndoRedoOperation) {
      this.history.pushState(data);
      eventBus.emit("contentChanged", data);
    }

    // Guardar si hay pageId
    const state = store.getState();
    if (state.pageId) {
      // <-- El problema está aquí: estamos usando state.pageId
      console.log("Saving to storage, pageId:", state.pageId);
      CanvasStorage.saveCanvas(state.pageId, data);
    } else {
      console.warn("No pageId found in state");
    }
  }

  // En builder-canvas.js, reemplazar el método getEditorData()// En builder-canvas.js, modificar el método setEditorData
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

  // En builder-canvas.js, eliminar el método updateGlobalStyles y modificar updateGlobalSettings
  updateGlobalSettings(settings) {
    console.log("Builder Canvas - Updating global settings:", settings);

    // Actualizar el modelo
    this.globalSettings = { ...this.globalSettings, ...settings };

    // Emitir evento de cambio
    const event = new CustomEvent("globalSettingsUpdated", {
      detail: { settings },
      bubbles: true,
      composed: true,
    });
    console.log(
      "Builder Canvas - Dispatching globalSettingsUpdated event:",
      event
    );
    console.log(
      "Builder Canvas - Dispatching globalSettingsUpdated event:",
      event
    );

    this.dispatchEvent(event);

    // Re-renderizar todo el canvas
    this.render();

    // Emitir evento de cambio de contenido
    this.emitContentChanged();
  }

  // Método para obtener los datos del editor incluyendo configuraciones globales
  // En builder-canvas.js, actualizar getEditorData:
  getEditorData() {
    const state = store.getState();
    return {
      globalSettings: state.globalSettings || {},
      rows: (state.rows || []).map((row) => ({
        id: row.id,
        type: row.type,
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

  setupEventListeners() {
    // Limpiar listeners anteriores
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (canvas) {
      const newCanvas = canvas.cloneNode(true);
      canvas.parentNode.replaceChild(newCanvas, canvas);
    }

    requestAnimationFrame(() => {
      this.setupRowControls();
      this.setupElementDragging();
      this.setupDropZone();
      this.setupElementSelection();
    });
  }

  setupElementDeletion() {
    const deleteButtons = this.shadowRoot.querySelectorAll(".element-delete");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const elementId = button.dataset.elementId;
        this.deleteElement(elementId);
      });
    });
  }

  // En setupElementDragging
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
        const newPosition = Array.from(column.children)
          .filter((el) => el.classList.contains("builder-element"))
          .findIndex((el) => el === this.draggedElement.element);

        // Remover el elemento de la columna original
        sourceColumn.elements = sourceColumn.elements.filter(
          (el) => el.id !== this.draggedElement.elementId
        );

        // Insertar en la nueva posición
        if (newPosition === -1) {
          targetColumn.elements.push(elementToMove);
        } else {
          targetColumn.elements.splice(newPosition, 0, elementToMove);
        }

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

    console.log("Updating store with new row order");
    store.setState({
      ...state,
      rows: currentRows,
    });

    this.emitContentChanged();
  }

  handleRowDrop() {
    const rows = [...this.shadowRoot.querySelectorAll(".builder-row")];
    const newOrder = rows
      .map((row) => {
        return this.rows.find((r) => r.id === row.dataset.id);
      })
      .filter(Boolean); // Filtrar cualquier undefined

    this.rows = newOrder;
    this.render();
  }

  handleRowDragOver(e, canvas) {
    const draggingRow = this.shadowRoot.querySelector(".row-dragging");
    if (!draggingRow) return;

    const rows = [
      ...this.shadowRoot.querySelectorAll(".builder-row:not(.row-dragging)"),
    ];

    if (rows.length === 0) {
      canvas.appendChild(draggingRow);
      return;
    }

    const closestRow = rows.reduce(
      (closest, row) => {
        const box = row.getBoundingClientRect();
        const offset = e.clientY - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset, element: row };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;

    if (closestRow) {
      closestRow.parentNode.insertBefore(draggingRow, closestRow);
    } else {
      canvas.appendChild(draggingRow);
    }
  }
  handleElementDragOver(e) {
    // Si hay una fila siendo arrastrada, no procesamos el dragover de elementos
    if (this.draggedRow) return;

    const column = e.target.closest(".column-dropzone");
    if (!column) return;

    // Solo procesamos el dragover si tenemos un elemento siendo arrastrado
    if (!this.draggedElement) return;

    const elementBeingDragged = column.querySelector(
      `[data-id="${this.draggedElement.elementId}"]`
    );
    if (!elementBeingDragged) return;

    const elements = [
      ...column.querySelectorAll(".builder-element:not(.dragging)"),
    ];

    const rect = column.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    // Encontrar el elemento más cercano
    let insertBeforeElement = null;
    for (const element of elements) {
      const elementRect = element.getBoundingClientRect();
      const elementMiddle = elementRect.top + elementRect.height / 2 - rect.top;

      if (mouseY < elementMiddle) {
        insertBeforeElement = element;
        break;
      }
    }

    // Insertar el elemento en la nueva posición visual
    if (insertBeforeElement) {
      column.insertBefore(elementBeingDragged, insertBeforeElement);
    } else {
      column.appendChild(elementBeingDragged);
    }
  }

  // Mejora de handleElementDrop
  handleElementDrop(e) {
    const column = e.target.closest(".column-dropzone");
    if (!column || !this.draggedElement) return;

    const targetRowId = column.closest(".builder-row").dataset.id;
    const targetColumnId = column.closest(".builder-column").dataset.id;

    const state = store.getState();
    const rows = [...state.rows];

    // Encontrar las filas y columnas origen/destino
    const sourceRow = rows.find(
      (r) => r.id === this.draggedElement.sourceRowId
    );
    const sourceColumn = sourceRow?.columns.find(
      (c) => c.id === this.draggedElement.sourceColumnId
    );
    const targetRow = rows.find((r) => r.id === targetRowId);
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
  }

  removeAllDragoverClasses() {
    this.shadowRoot
      .querySelectorAll(".dragover-before, .dragover-after, .row-dragging")
      .forEach((el) => {
        el.classList.remove(
          "dragover-before",
          "dragover-after",
          "row-dragging"
        );
      });
  }

  // En builder-canvas.js
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

  // Modificar duplicateRow de manera similar
  duplicateRow(rowId) {
    const state = store.getState();
    const sourceRow = (state.rows || []).find((row) => row.id === rowId);
    if (!sourceRow) return;

    const newRowId = `row-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Crear copia profunda de la fila con nuevos IDs
    const newRow = {
      id: newRowId,
      type: sourceRow.type,
      styles: JSON.parse(JSON.stringify(sourceRow.styles || {})),
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

    // Encontrar índice y añadir después
    const currentRows = [...state.rows];
    const index = currentRows.findIndex((row) => row.id === rowId);
    if (index !== -1) {
      currentRows.splice(index + 1, 0, newRow);
      store.setState({
        ...state,
        rows: currentRows,
      });
    }
  }

  // En builder-canvas.js, añadir al setupRowControls:
  setupRowControls() {
    console.log("🔧 Setting up row controls");
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      const rowId = row.dataset.id;

      // Delete button
      const deleteBtn = row.querySelector(".row-delete");
      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Delete clicked for row:", rowId); // Log específico

          if (confirm(this.i18n.t("common.confirmation.delete"))) {
            const state = store.getState();
            store.setState({
              ...state,
              rows: state.rows.filter((r) => r.id !== rowId),
            });
            this.emitContentChanged();
          }
        };
      }

      // Duplicate button
      const duplicateBtn = row.querySelector(".row-duplicate");
      if (duplicateBtn) {
        duplicateBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Duplicate clicked for row:", rowId); // Log específico

          const state = store.getState();
          const sourceRow = state.rows.find((r) => r.id === rowId);
          if (sourceRow) {
            const newRow = {
              ...sourceRow,
              id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
              columns: sourceRow.columns.map((col) => ({
                ...col,
                id: `column-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2, 9)}`,
                elements: col.elements.map((elem) => ({
                  ...elem,
                  id: `element-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 9)}`,
                })),
              })),
            };

            const updatedRows = [...state.rows];
            const rowIndex = state.rows.findIndex((r) => r.id === rowId);
            updatedRows.splice(rowIndex + 1, 0, newRow);

            store.setState({
              ...state,
              rows: updatedRows,
            });
            this.emitContentChanged();
          }
        };
      }
    });
  }

  duplicateRow(rowId) {
    const state = store.getState();
    const sourceRow = state.rows.find((row) => row.id === rowId);

    if (!sourceRow) return;

    // Create new row with unique IDs
    const newRow = {
      ...sourceRow,
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      columns: sourceRow.columns.map((column) => ({
        ...column,
        id: `column-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        elements: column.elements.map((element) => ({
          ...element,
          id: `element-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        })),
      })),
    };

    // Find index of source row
    const rowIndex = state.rows.findIndex((row) => row.id === rowId);

    // Insert new row after source row
    const updatedRows = [...state.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);

    // Update store
    store.setState({
      ...state,
      rows: updatedRows,
    });
  }

  deleteRow(rowId) {
    const state = store.getState();
    const row = state.rows.find((r) => r.id === rowId);

    if (!row) return;

    if (confirm(this.i18n.t("common.confirmation.delete"))) {
      // Crear el nuevo estado
      const newState = {
        ...state,
        rows: state.rows.filter((r) => r.id !== rowId),
        selectedRow: state.selectedRow?.id === rowId ? null : state.selectedRow,
      };

      // Actualizar el store
      store.setState(newState);

      // Emitir el evento de cambio para actualizar el historial
      this.emitContentChanged();
    }
  }

  addRowAfter(rowId) {
    const state = store.getState();

    // Create new row with one column
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: "row-1",
      columns: [
        {
          id: `column-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          elements: [],
        },
      ],
    };

    // Find index of current row
    const rowIndex = state.rows.findIndex((row) => row.id === rowId);

    // Insert new row after current row
    const updatedRows = [...state.rows];
    updatedRows.splice(rowIndex + 1, 0, newRow);

    // Update store
    store.setState({
      ...state,
      rows: updatedRows,
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

  renderRow(row) {
    const styles = Object.entries(row.styles || {})
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
      )
      .join(";");

    return `
      <div class="builder-row ${row.selected ? "selected" : ""}" 
           data-id="${row.id}" 
           data-type="${row.type}"
           style="${styles}">
        <div class="row-handle">
          <builder-icon name="move" size="16"></builder-icon>
        </div>
        <div class="row-controls">
          <button class="row-duplicate" title="Duplicate">
            <builder-icon name="copy" size="16"></builder-icon>
          </button>
          <button class="row-delete" title="Delete">
            <builder-icon name="delete" size="16"></builder-icon>
          </button>
        </div>
        <div class="row-content" style="display: grid; grid-template-columns: repeat(${
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
                       <span>${this.i18n.t("builder.sidebar.dropHint")}</span>
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
    `;
  }

  // En builder-canvas.js
  setupDragAndDrop() {
    console.log("🔄 Setting up drag and drop");
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (!canvas) return;

    // Clean up by replacing canvas
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);

    // Row drop handling
    newCanvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      newCanvas.classList.add("dragover");
    });

    newCanvas.addEventListener("dragleave", () => {
      newCanvas.classList.remove("dragover");
    });

    newCanvas.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("🎯 Drop event detected");

      newCanvas.classList.remove("dragover");

      // Handle row drops
      const rowId = e.dataTransfer.getData("application/x-row");
      if (rowId) {
        console.log(`🔄 Row drop detected: ${rowId}`);
        this.handleRowDrop(e, rowId);
        return;
      }

      // Handle new element drops
      const elementType = e.dataTransfer.getData(
        "application/x-builder-element"
      );
      if (elementType) {
        console.log(`🔄 Element drop detected: ${elementType}`);
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
    });

    // Setup row dragging
    const rows = this.shadowRoot.querySelectorAll(".builder-row");
    rows.forEach((row) => {
      const handle = row.querySelector(".row-handle");
      if (handle) {
        handle.addEventListener("mousedown", () => {
          row.draggable = true;
        });

        handle.addEventListener("mouseup", () => {
          row.draggable = false;
        });

        row.addEventListener("dragstart", (e) => {
          e.stopPropagation();
          console.log(`🔄 Row drag started: ${row.dataset.id}`);
          row.classList.add("row-dragging");
          e.dataTransfer.setData("application/x-row", row.dataset.id);
        });

        row.addEventListener("dragend", () => {
          console.log(`🔄 Row drag ended: ${row.dataset.id}`);
          row.classList.remove("row-dragging");
          row.draggable = false;
          this.removeAllDragoverClasses();
        });
      }
    });

    console.log("🔄 Drag and drop setup completed");
  }

  setupRowEventListeners() {
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Obtener el rowId una sola vez
      const rowId = row.dataset.id;

      // Configurar delete button - un solo listener por fila
      const deleteBtn = row.querySelector(".row-delete");
      if (deleteBtn) {
        // Remover listeners previos para evitar duplicados
        deleteBtn.replaceWith(deleteBtn.cloneNode(true));
        const newDeleteBtn = row.querySelector(".row-delete");

        newDeleteBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.deleteRow(rowId);
        });
      }

      // ... resto de los listeners para otros botones
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

  handleRowUpdated(event) {
    console.log("Canvas received rowUpdated event:", event.detail);
    const { rowId, styles, columns, type } = event.detail;

    const state = store.getState();
    if (!state.rows) {
      console.warn("No rows found in state");
      return;
    }

    // Update the row in state
    const updatedRows = state.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          styles: { ...(row.styles || {}), ...styles },
          columns: columns || row.columns,
          type: type || row.type,
        };
      }
      return row;
    });

    // Update store with new rows
    store.setState({
      ...state,
      rows: updatedRows,
    });

    // Emit content changed event
    this.emitContentChanged();

    // Render changes
    requestAnimationFrame(() => {
      this.render();
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

  updateGlobalStyles(styles) {
    console.log("Updating global styles:", styles);
    this.globalSettings = { ...this.globalSettings, ...styles };

    const pageWrapper = this.shadowRoot.querySelector(".page-wrapper");
    if (pageWrapper) {
      Object.entries(this.globalSettings).forEach(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (key === "maxWidth") {
          pageWrapper.style.maxWidth = value.toString().includes("px")
            ? value
            : `${value}px`;
        } else if (key === "padding") {
          pageWrapper.style.padding = value.toString().includes("px")
            ? value
            : `${value}px`;
        } else if (key === "backgroundColor") {
          pageWrapper.style.backgroundColor = value;
        } else if (key === "fontFamily") {
          pageWrapper.style.fontFamily = value;
        }
      });
    }

    // Emitir el evento de cambio
    this.emitContentChanged();
  }

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
        this.setupRowControls(); // Mover aquí para que los elementos existan
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

  disconnectedCallback() {
    this.unsubscribeStore();
    eventBus.off("globalSettingsUpdated");
    eventBus.off("rowUpdated");
    eventBus.off("rowSelected");
    eventBus.off("elementSelected");
  }
}

customElements.define("builder-canvas", BuilderCanvas);
