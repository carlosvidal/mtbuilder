import { CanvasStorage } from "../utils/canvas-storage.js";
import { History } from "../utils/history.js";
import { I18n } from "../utils/i18n.js";

class BuilderCanvas extends HTMLElement {
  constructor() {
    super();
    console.log("🏗️ Canvas - Constructor started"); // Nuevo log
    this.attachShadow({ mode: "open" });

    window.builderEvents = window.builderEvents || new EventTarget();
    console.log("🏗️ Canvas - EventTarget initialized"); // Nuevo log

    this.i18n = I18n.getInstance();
    this.rows = [];
    this.globalSettings = {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    };
    this.draggedRow = null;
    this.draggedElement = null;
    this.dropIndicator = null;
    this.pageId = null;
    this._isUndoRedoOperation = false;
    this.history = new History();

    console.log("🏗️ Canvas - Initial state set"); // Nuevo log

    // Event listeners
    window.builderEvents.addEventListener("globalSettingsUpdated", (e) => {
      console.log("🎯 Canvas - Received globalSettingsUpdated:", e.detail);

      // 1. Actualizar el modelo interno
      const { settings } = e.detail;
      this.globalSettings = {
        ...this.globalSettings,
        ...settings,
      };

      // 2. Actualizar el DOM
      const pageWrapper = this.shadowRoot.querySelector(".page-wrapper");
      if (pageWrapper) {
        Object.entries(settings).forEach(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
          pageWrapper.style[cssKey] = value;
        });
      }

      // 3. Forzar un re-render y emitir cambio
      this.render();
      this.emitContentChanged();

      console.log("🎯 Canvas - Updated globalSettings:", this.globalSettings);
    });

    window.builderEvents.addEventListener(
      "historyChange",
      this.handleHistoryChange.bind(this)
    );

    window.builderEvents.addEventListener("rowDeselected", () => {
      this.rows.forEach((row) => (row.selected = false));
      this.render();
    });

    window.builderEvents.addEventListener(
      "rowUpdated",
      this.handleRowUpdated.bind(this)
    );

    console.log("🏗️ Canvas - Constructor finished"); // Nuevo log
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
    const { canUndo, canRedo } = event.detail;
    console.log("🎯 Canvas - History change:", { canUndo, canRedo });
  }

  connectedCallback() {
    const pageId = this.getAttribute("pageId");
    if (pageId) {
      this.pageId = pageId;
      const savedData = CanvasStorage.loadCanvas(pageId);
      if (savedData) {
        if (savedData.rows) {
          this.rows = JSON.parse(JSON.stringify(savedData.rows));
        }
        if (savedData.globalSettings) {
          this.globalSettings = savedData.globalSettings;
        }
        this.history.pushState(this.getEditorData());
      }
    }

    this.render();
    // Removemos suppressEvent que no está definido
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
      this.setupElementSelection();

      // Solo emitir eventos de cambio si no es una operación undo/redo
      if (!this._isUndoRedoOperation) {
        this.emitContentChanged();
      }
    });
  }
  static get observedAttributes() {
    return ["pageId"];
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
    console.log("Builder Canvas - Undo requested");
    const previousState = this.history.undo();
    if (previousState) {
      this._isUndoRedoOperation = true;
      try {
        console.log("Applying undo state:", previousState);
        this.setEditorData(previousState, true);
      } finally {
        this._isUndoRedoOperation = false;
      }
    }
  }

  handleRedo() {
    console.log("Builder Canvas - Redo requested");
    const nextState = this.history.redo();
    if (nextState) {
      this._isUndoRedoOperation = true;
      try {
        console.log("Applying redo state:", nextState);
        this.setEditorData(nextState, true);
      } finally {
        this._isUndoRedoOperation = false;
      }
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
    const data = {
      ...this.getEditorData(),
      globalSettings: this.globalSettings, // Asegurarnos de que se incluyan los globalSettings
    };
    console.log("Builder Canvas - Emitting content changed:", {
      suppressEvent,
      isUndoRedo: this._isUndoRedoOperation,
      data,
    });

    // Guardar en CanvasStorage si tenemos pageId
    if (this.pageId) {
      CanvasStorage.saveCanvas(this.pageId, data);
    }

    // Si no estamos suprimiendo eventos y no es una operación undo/redo
    if (!suppressEvent && !this._isUndoRedoOperation) {
      // Actualizar historial
      this.history.pushState(data);

      // Emitir evento de cambio
      const event = new CustomEvent("contentChanged", {
        detail: data,
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    }

    window.removeEventListener("localeChanged", () => {
      this.render();
    });
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
  getEditorData() {
    return {
      globalSettings: this.globalSettings,
      rows: this.rows.map((row) => ({
        id: row.id,
        type: row.type,
        columns: row.columns.map((column) => ({
          id: column.id,
          elements: column.elements.map((element) => ({
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
    // Remover listeners anteriores clonando solo el canvas-dropzone
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (canvas) {
      const newCanvas = canvas.cloneNode(false); // cambiar a false
      while (canvas.firstChild) {
        newCanvas.appendChild(canvas.firstChild);
      }
      canvas.parentNode.replaceChild(newCanvas, canvas);
    }

    // Configurar nuevos listeners
    this.setupRowControls();
    this.setupElementDragging();
    this.setupElementDeletion();
    this.setupDropZone();
    this.setupRowEventListeners();
    this.setupRowEvents();
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
        e.stopPropagation(); // Evitar que el evento se propague
        e.dataTransfer.effectAllowed = "move";

        // Almacenar información del elemento
        const columnEl = element.closest(".builder-column");
        const rowEl = element.closest(".builder-row");

        this.draggedElement = {
          elementId: element.dataset.id,
          element: element,
          sourceRowId: rowEl?.dataset.id,
          sourceColumnId: columnEl?.dataset.id,
        };

        element.classList.add("dragging");
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
  setupDropZone() {
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");
    if (!canvas) return;

    canvas.ondragover = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.draggedRow) return;

      const dropTarget = e.target.closest(".column-dropzone") || canvas;
      this.removeAllDragoverClasses();
      dropTarget.classList.add("dragover");
    };

    canvas.ondragleave = (e) => {
      const relatedTarget = e.relatedTarget;
      if (!relatedTarget || !canvas.contains(relatedTarget)) {
        this.removeAllDragoverClasses();
      }
    };

    canvas.ondrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.draggedRow) return;

      const elementType = e.dataTransfer.getData("application/builder-element");
      const dropTarget = e.target.closest(".column-dropzone") || canvas;

      this.removeAllDragoverClasses();

      if (elementType.startsWith("row-")) {
        this.addRow(elementType);
      } else if (dropTarget.classList.contains("column-dropzone")) {
        const rowEl = dropTarget.closest(".builder-row");
        const columnEl = dropTarget.closest(".builder-column");
        if (rowEl && columnEl) {
          const rowId = rowEl.dataset.id;
          const columnId = columnEl.dataset.id;
          this.addElementToColumn(rowId, columnId, elementType);
        }
      }
    };
  }

  handleRowDrop(e) {
    const rows = [...this.shadowRoot.querySelectorAll(".builder-row")];
    const newOrder = rows.map((row) =>
      this.rows.find((r) => r.id === row.dataset.id)
    );
    this.rows = newOrder;
    this.draggedRow = null;
    this.render();
  }

  setupRowControls() {
    const rows = this.shadowRoot.querySelectorAll(".builder-row");

    rows.forEach((row) => {
      // Configurar botón de duplicar
      const duplicateButton = row.querySelector(".row-duplicate");
      if (duplicateButton) {
        duplicateButton.onclick = (e) => {
          e.stopPropagation();
          this.duplicateRow(row.dataset.id);
        };
      }

      // Configurar botón de eliminar
      const deleteButton = row.querySelector(".row-delete");
      if (deleteButton) {
        deleteButton.onclick = (e) => {
          e.stopPropagation();
          if (confirm(this.i18n.t("common.confirmation.delete"))) {
            this.deleteRow(row.dataset.id);
          }
        };
      }

      // Configurar botón de añadir
      const addButton = row.querySelector(".row-add-button");
      if (addButton) {
        addButton.onclick = (e) => {
          e.stopPropagation();
          this.addRowAfter(row.dataset.id);
        };
      }

      // Configurar botón de mover
      const moveButton = row.querySelector(".row-move");
      if (moveButton) {
        moveButton.draggable = true;
        moveButton.ondragstart = (e) => {
          e.stopPropagation();
          this.draggedRow = row;
          row.classList.add("row-dragging");
        };
        moveButton.ondragend = () => {
          if (this.draggedRow) {
            this.draggedRow.classList.remove("row-dragging");
            this.draggedRow = null;
          }
        };
      }
    });
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

    // Obtener los elementos en su nuevo orden
    const elementOrder = [...column.querySelectorAll(".builder-element")];

    // Encontrar las filas y columnas origen/destino
    const sourceRow = this.rows.find((r) => r.id === this.draggedElement.rowId);
    const sourceColumn = sourceRow.columns.find(
      (c) => c.id === this.draggedElement.columnId
    );
    const targetRow = this.rows.find((r) => r.id === targetRowId);
    const targetColumn = targetRow.columns.find((c) => c.id === targetColumnId);

    // Encontrar y remover el elemento de su posición original
    const elementToMove = sourceColumn.elements.find(
      (el) => el.id === this.draggedElement.elementId
    );
    sourceColumn.elements = sourceColumn.elements.filter(
      (el) => el.id !== this.draggedElement.elementId
    );

    // Determinar la nueva posición del elemento
    const newIndex = elementOrder.findIndex(
      (el) => el.dataset.id === this.draggedElement.elementId
    );

    // Insertar el elemento en su nueva posición
    if (sourceColumn === targetColumn) {
      // Si es la misma columna, solo reordenamos
      targetColumn.elements.splice(newIndex, 0, elementToMove);
    } else {
      // Si es una columna diferente, removemos y añadimos
      targetColumn.elements.splice(newIndex, 0, elementToMove);
    }

    this.draggedElement = null;
    this.render();
  }

  removeAllDragoverClasses() {
    this.shadowRoot.querySelectorAll(".dragover").forEach((el) => {
      el.classList.remove("dragover");
    });
  }

  addRow(rowType) {
    console.log("Adding row:", rowType);
    if (!rowType.startsWith("row-")) return;

    const columns = parseInt(rowType.split("-")[1]);
    if (isNaN(columns) || columns < 1 || columns > 4) return;

    const rowConfig = {
      id: `row-${Date.now()}`,
      type: rowType,
      styles: {},
      columns: Array(columns)
        .fill()
        .map(() => ({
          id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          elements: [],
        })),
    };

    this.rows.push(rowConfig);
    this.render();
    this.emitContentChanged();
  }

  // Modificar duplicateRow de manera similar
  duplicateRow(rowId) {
    const sourceRow = this.rows.find((row) => row.id === rowId);
    if (!sourceRow) return;

    // Crear un nuevo ID único para la fila
    const newRowId = `row-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Crear una copia profunda de la fila con nuevos IDs
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

    // Encontrar la posición correcta e insertar la nueva fila
    const index = this.rows.findIndex((row) => row.id === rowId);
    if (index !== -1) {
      this.rows.splice(index + 1, 0, newRow);

      // Actualizar el estado y renderizar
      this.render();
      this.emitContentChanged();
    }
  }

  addElementToColumn(rowId, columnId, elementType) {
    console.log("Adding element:", { rowId, columnId, elementType });
    const row = this.rows.find((r) => r.id === rowId);
    if (!row) return;

    const column = row.columns.find((c) => c.id === columnId);
    if (!column) return;

    const elementConfig = {
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: elementType,
      ...this.getDefaultContent(elementType),
    };

    column.elements.push(elementConfig);
    this.render();

    // Re-configurar los eventos después de añadir un elemento
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
    });

    this.emitContentChanged();
  }

  getDefaultContent(type) {
    const defaults = {
      heading: {
        tag: "h2",
        content: this.i18n.t("builder.editor.elements.heading.content"),
        styles: {
          color: "#333333",
          margin: "0 0 1rem 0",
          padding: "0.5rem",
          fontFamily: "inherit",
        },
      },
      text: {
        tag: "p",
        content: this.i18n.t("builder.editor.elements.text.content"),
        styles: {
          color: "#666",
          margin: "0 0 1rem 0",
          padding: "0.5rem",
          lineHeight: "1.5",
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
      button: {
        tag: "button",
        content: this.i18n.t("builder.editor.elements.button.text"),
        styles: {
          background: "#2196F3",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
          fontFamily: "inherit",
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
    const { tag, content, styles, attributes = {} } = element;

    const styleString = Object.entries(styles || {})
      .map(
        ([key, value]) =>
          `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`
      )
      .join(";");

    const attributesString = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");

    const elementControls = `
      <div class="element-controls">
        <button class="element-delete" data-element-id="${element.id}">×</button>
      </div>
    `;

    // Manejar casos especiales por tipo
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
           style="${styles}">
        <div class="row-click-area"></div>
        <div class="row-controls">
          <button class="row-move" title="Mover fila">
            <builder-icon name="move" size="16"></builder-icon>
          </button>
          <button class="row-duplicate" title="Duplicar fila">
            <builder-icon name="copy" size="16"></builder-icon>
          </button>
          <button class="row-delete" title="Eliminar fila">
            <builder-icon name="delete" size="16"></builder-icon>
          </button>
        </div>
        <button class="row-add-button" title="Añadir fila">
          <builder-icon name="plus" size="16"></builder-icon>
        </button>
        <div class="row-content" style="grid-template-columns: repeat(${
          row.columns.length
        }, 1fr)">
          ${row.columns
            .map(
              (column) => `
            <div class="builder-column" data-id="${column.id}">
              <div class="column-dropzone">
                ${
                  column.elements.length === 0
                    ? `<div class="empty-column">
                      <span>${this.i18n.t(
                        "builder.canvas.dropzone.hint"
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
    `;
  }

  setupRowEventListeners() {
    // Primero, remover todos los event listeners anteriores
    this.shadowRoot.querySelectorAll(".builder-row").forEach((row) => {
      row.replaceWith(row.cloneNode(true));
    });

    // Ahora configurar los nuevos listeners
    this.shadowRoot.querySelectorAll(".builder-row").forEach((row) => {
      row.addEventListener("mousedown", (e) => {
        // Solo procesar si el click fue directamente en la fila o en su contenedor principal
        if (
          e.target === row ||
          e.target.classList.contains("row-content") ||
          e.target.classList.contains("row-click-area")
        ) {
          e.preventDefault();
          e.stopPropagation();
          this.selectRow(row.dataset.id);
        }
      });
    });
  }

  selectRow(rowId) {
    // Deseleccionar cualquier elemento seleccionado
    this.shadowRoot
      .querySelectorAll(".builder-element.selected")
      .forEach((el) => {
        el.classList.remove("selected");
      });
    window.builderEvents.dispatchEvent(new CustomEvent("elementDeselected"));

    // Deseleccionar todas las filas
    this.rows.forEach((row) => (row.selected = false));

    // Seleccionar la fila específica
    const selectedRow = this.rows.find((row) => row.id === rowId);
    if (selectedRow) {
      selectedRow.selected = true;
      window.builderEvents.dispatchEvent(
        new CustomEvent("rowSelected", {
          detail: selectedRow,
        })
      );
    }

    this.render();
  }

  deleteRow(rowId) {
    if (confirm("¿Estás seguro de que deseas eliminar esta fila?")) {
      this.rows = this.rows.filter((row) => row.id !== rowId);
      this.render();
      this.emitContentChanged();
    }
  }

  addRowAfter(rowId) {
    const index = this.rows.findIndex((row) => row.id === rowId);
    if (index === -1) return;

    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "row-1",
      styles: {},
      columns: [
        {
          id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          elements: [],
        },
      ],
    };

    this.rows.splice(index + 1, 0, newRow);
    this.render();
    this.emitContentChanged();
  }

  handleRowUpdated(event) {
    console.log("Canvas received rowUpdated event:", event.detail);
    const { rowId, styles, columns, type } = event.detail;

    // Encontrar la fila correcta
    const row = this.rows.find((r) => r.id === rowId);
    if (!row) {
      console.warn("Row not found:", rowId);
      return;
    }

    // Actualizar los estilos
    row.styles = { ...row.styles, ...styles };

    // Actualizar columnas si es necesario
    if (columns && columns.length !== row.columns.length) {
      row.columns = columns;
    }

    // Actualizar tipo si cambió
    if (type) {
      row.type = type;
    }

    // Solo emitir contentChanged una vez
    this.emitContentChanged();

    // Y luego renderizar
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
    console.log("🎨 Canvas - Render started", {
      pageId: this.pageId,
      rows: this.rows.length,
      globalSettings: this.globalSettings,
    });
    const currentPageId = this.pageId;

    // Definir los estilos del wrapper de manera explícita
    const pageWrapperStyles = `
      max-width: ${this.globalSettings.maxWidth};
      padding: ${this.globalSettings.padding};
      background-color: ${this.globalSettings.backgroundColor};
      font-family: ${this.globalSettings.fontFamily};
      margin: 0 auto;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border-radius: 8px;
      min-height: 100vh;
    `;

    // Aquí está todo el HTML necesario
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 100%;
        }

          * {
            box-sizing: border-box;
          }

          .canvas-container {
            height: 100%;
            min-height: 100%;
            padding: 2rem;
          }

          .canvas-wrapper {
          max-width: ${this.globalSettings.maxWidth};
          padding: ${this.globalSettings.padding};
          margin: 0 auto;
          background-color: ${this.globalSettings.backgroundColor};
          font-family: ${this.globalSettings.fontFamily};
        }
  
          
  
          .canvas-dropzone {
            min-height: 100%;
            border-radius: 8px;
            transition: all 0.3s ease;
          }
  
          .canvas-dropzone.dragover {
            background: #f8f9fa;
            box-shadow: 0 0 15px rgba(33,150,243,0.15);
          }
  
          .canvas-dropzone.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px dashed #ccc;
            padding: 4rem;
          }
  
          /* Estilos de filas */
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
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.builder-row:hover {
  border-color: #e0e0e0;
}

.builder-row.selected {
  border: 2px solid #2196F3;
  box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1);
}

.row-controls {
  position: absolute;
  top: -2rem;
  right: 0;
  z-index: 10;
}

.builder-element {
  position: relative;
  z-index: 2;
}

/* Asegurarse que los controles estén por encima del área de click */
.row-controls,
.row-add-button,
.builder-element {
  position: relative;
  z-index: 2;
}

.row-controls {
  position: absolute;
  top: -2rem;
  right: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
  background: white;
  padding: 0.25rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.builder-row:hover .row-controls {
  opacity: 1;
}

.row-controls button {
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
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

.row-content {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.column-dropzone {
  min-height: 50px;
  border: 1px dashed #ddd;
  border-radius: 4px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.column-dropzone.dragover {
  background: #f8f9fa;
  border-color: #2196F3;
}

          .column-dropzone::after {
            content: "";
            position: absolute;
            left: 0;
            right: 0;
            height: 2px;
            background: #2196F3;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .column-dropzone.dragover::after {
            opacity: 1;
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
  
          /* Estilos de elementos */
          .builder-element-wrapper {
            position: relative;
            margin: 0.5rem 0;
            pointer-events: all;
          }
  
          .builder-element {
            position: relative;
            margin: 0.5rem 0;
            transition: all 0.2s ease;
            cursor: move;
            width: 100%;
            box-sizing: border-box;
            user-select: none;
            padding: 4px;
          }
  
          .builder-element:hover {
            outline: 2px solid #2196F3;
          }

          .builder-element.dragging {
            opacity: 1;
          }

          .builder-element.drag-ghost {
            opacity: 0.5;
          }

          .builder-element.selected {
            outline: 2px solid #2196F3;
            box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2);
          }

          .builder-element::before {
            content: "⋮";
            position: absolute;
            left: -1.5rem;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.2rem;
            color: #666;
            opacity: 0;
            transition: opacity 0.2s ease;
          }

          .builder-element:hover::before {
            opacity: 1;
          }

          /* Controles de elementos */
          .element-controls {
            position: absolute;
            top: 0;
            right: 0;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 10;
            display: flex;
            gap: 0.25rem;
            padding: 0.25rem;
          }

          .builder-element-wrapper:hover .element-controls {
            opacity: 1;
          }

          .element-delete {
            background: #ff4444;
            color: white;
            border: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 14px;
            line-height: 1;
            padding: 0;
            transition: all 0.2s ease;
          }

          .element-delete:hover {
            background: #cc0000;
            transform: scale(1.1);
          }

          /* Indicador de drop */
          .drop-indicator {
            position: absolute;
            left: 1rem;
            right: 1rem;
            height: 3px;
            background-color: #2196F3;
            transition: top 0.2s ease;
            pointer-events: none;
            z-index: 1000;
          }

          /* Estilos para elementos editables */
          .builder-element[contenteditable="true"] {
            cursor: text;
            outline: 2px solid #2196F3;
            padding: 8px;
            min-height: 1em;
          }

          .builder-element[contenteditable="true"]:focus {
            outline: 2px solid #2196F3;
            box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.2);
          }

          .canvas-container {
      height: 100%;
      min-height: 100%;
      padding: 2rem;
      background: #f5f5f5;
    }

    .page-wrapper {
      max-width: ${this.globalSettings.maxWidth};
      padding: ${this.globalSettings.padding};
      margin: 0 auto;
      background-color: ${this.globalSettings.backgroundColor};
      font-family: ${this.globalSettings.fontFamily};
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
      border-radius: 8px;
    }
        </style>

        
  
       <div class="canvas-container">
      <div class="page-wrapper" style="${pageWrapperStyles}">
        <div class="canvas-dropzone ${
          this.rows.length === 0 ? "empty" : ""
        }" data-page-id="${currentPageId || ""}">
          ${
            this.rows.length === 0
              ? `<div class="empty-message">
                <h3>${this.i18n.t("builder.canvas.empty.title")}</h3>
                <p>${this.i18n.t("builder.canvas.empty.subtitle")}</p>
                <p><small>ID: ${currentPageId || "null"}</small></p>
              </div>`
              : this.rows.map((row) => this.renderRow(row)).join("")
          }
        </div>
      </div>
    </div>`;

    // Configurar todo de manera asíncrona para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      this.setupEventListeners(); // Esto configurará todos los listeners necesarios
      this.setupElementSelection();

      // Solo emitir eventos de cambio si no es una operación undo/redo y no está suprimido
      if (!this._isUndoRedoOperation && !suppressEvent) {
        this.emitContentChanged(suppressEvent);
      }
    });

    console.log("🎨 Canvas - Render finished");
  }
}

customElements.define("builder-canvas", BuilderCanvas);
export { BuilderCanvas };
