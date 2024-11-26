import { CanvasStorage } from "../utils/canvas-storage.js";
import { History } from "../utils/history.js";
import { I18n } from "../utils/i18n.js";

class BuilderCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

    // Asegurarnos de que tenemos builderEvents
    window.builderEvents = window.builderEvents || new EventTarget();

    // Escuchar cambios en el historial
    window.builderEvents.addEventListener("historyChange", (event) => {
      const { canUndo, canRedo } = event.detail;
      console.log("Builder Canvas - History change:", { canUndo, canRedo });
    });
  }

  static get observedAttributes() {
    return ["pageId"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId" && newValue && newValue !== oldValue) {
      console.log("Canvas: pageId attribute changed to", newValue);
      // Actualizar propiedad interna
      this.pageId = newValue;

      // Cargar datos inmediatamente
      const savedData = CanvasStorage.loadCanvas(newValue);
      console.log("Canvas attributeChangedCallback - loaded data:", savedData);

      if (savedData?.rows) {
        this.rows = JSON.parse(JSON.stringify(savedData.rows));
        console.log(
          "Canvas attributeChangedCallback - setting rows:",
          this.rows
        );
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

    // Cargar datos del storage
    const savedData = CanvasStorage.loadCanvas(pageId);
    console.log("Loaded canvas data:", savedData);

    if (savedData?.rows) {
      // Hacer una copia profunda de los datos
      this.rows = JSON.parse(JSON.stringify(savedData.rows));
      console.log("Setting rows from storage:", this.rows);

      // Forzar una actualización
      this.render();
    }

    // Emitir evento de cambio de contenido
    this.emitContentChanged();
  }

  loadSavedCanvas() {
    console.log("Loading saved canvas for pageId:", this.pageId);
    if (!this.pageId) return;

    const savedData = CanvasStorage.loadCanvas(this.pageId);
    if (savedData?.rows) {
      this.rows = savedData.rows;
      this.render();
    }
  }

  // En builder-canvas.js, actualizar el connectedCallback
  connectedCallback() {
    console.log("Canvas connected");
    const pageId = this.getAttribute("pageId");
    if (pageId) {
      this.pageId = pageId;
      const savedData = CanvasStorage.loadCanvas(pageId);
      if (savedData?.rows) {
        this.rows = JSON.parse(JSON.stringify(savedData.rows));
        this.history.pushState(this.getEditorData());
      }
    }
    this.render();

    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
      this.setupElementSelection();
    });

    window.addEventListener("localeChanged", () => {
      this.render();
    });
  }

  // En builder-canvas.js, en el método emitContentChanged:

  emitContentChanged(suppressEvent = false) {
    const data = this.getEditorData();
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

  // También debemos agregar el método getEditorData si no existe
  updateGlobalSettings(settings) {
    this.globalSettings = { ...this.globalSettings, ...settings };
    this.render();
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
    this.setupRowControls();
    this.setupElementDragging();
    this.setupElementDeletion();
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

    // En lugar de clonar, limpiamos los listeners antiguos
    const newCanvas = canvas;
    const clone = canvas.cloneNode(false);
    while (canvas.firstChild) {
      clone.appendChild(canvas.firstChild);
    }
    canvas.parentNode.replaceChild(clone, canvas);

    // Añadimos los listeners al nuevo canvas
    clone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Si estamos arrastrando una fila existente, no mostramos dragover
      if (this.draggedRow) return;

      const dropTarget = e.target.closest(".column-dropzone") || clone;
      this.removeAllDragoverClasses();
      dropTarget.classList.add("dragover");
    });

    clone.addEventListener("dragleave", (e) => {
      const relatedTarget = e.relatedTarget;
      if (!relatedTarget || !clone.contains(relatedTarget)) {
        this.removeAllDragoverClasses();
      }
    });

    clone.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Si estamos reordenando una fila existente, no procesamos el drop aquí
      if (this.draggedRow) return;

      const elementType = e.dataTransfer.getData("application/builder-element");
      const dropTarget = e.target.closest(".column-dropzone") || clone;

      console.log("Drop event - Element type:", elementType);

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
    });
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
    const canvas = this.shadowRoot.querySelector(".canvas-dropzone");

    rows.forEach((row) => {
      const moveButton = row.querySelector(".row-move");
      moveButton.draggable = true;

      moveButton.addEventListener("dragstart", (e) => {
        e.stopPropagation();
        const rowElement = e.target.closest(".builder-row");
        rowElement.classList.add("row-dragging");
        this.draggedRow = rowElement;

        // Crear indicador de drop
        if (!this.dropIndicator) {
          this.dropIndicator = document.createElement("div");
          this.dropIndicator.className = "drop-indicator";
          canvas.appendChild(this.dropIndicator);
        }

        e.dataTransfer.setDragImage(rowElement, 0, 20);
        e.dataTransfer.effectAllowed = "move";
      });

      moveButton.addEventListener("dragend", () => {
        if (this.draggedRow) {
          this.draggedRow.classList.remove("row-dragging");
          this.draggedRow = null;
        }
        if (this.dropIndicator) {
          this.dropIndicator.remove();
          this.dropIndicator = null;
        }
      });

      const deleteButton = row.querySelector(".row-delete");
      deleteButton.addEventListener("click", () => {
        this.rows = this.rows.filter((r) => r.id !== row.dataset.id);
        this.render();
      });
    });

    // Configurar el canvas para el reordenamiento de filas
    canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!this.draggedRow) return;

      const rows = [
        ...this.shadowRoot.querySelectorAll(".builder-row:not(.row-dragging)"),
      ];
      if (rows.length === 0) return;

      const mouseY = e.clientY;
      const canvasRect = canvas.getBoundingClientRect();

      let insertBefore = null;
      for (const row of rows) {
        const rect = row.getBoundingClientRect();
        const rowMiddle = rect.top + rect.height / 2;

        if (mouseY < rowMiddle) {
          insertBefore = row;
          break;
        }
      }

      // Actualizar posición del indicador
      if (this.dropIndicator) {
        if (!insertBefore) {
          const lastRow = rows[rows.length - 1];
          const rect = lastRow.getBoundingClientRect();
          this.dropIndicator.style.top = `${rect.bottom - canvasRect.top}px`;
        } else {
          const rect = insertBefore.getBoundingClientRect();
          this.dropIndicator.style.top = `${rect.top - canvasRect.top}px`;
        }
      }

      this.insertBeforeRow = insertBefore;
    });

    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      if (!this.draggedRow || !canvas.contains(e.target)) return;

      const draggedRowId = this.draggedRow.dataset.id;
      const draggedRowData = this.rows.find((r) => r.id === draggedRowId);

      if (!draggedRowData) return;

      // Remover la fila de su posición actual
      this.rows = this.rows.filter((r) => r.id !== draggedRowId);

      // Insertar en la nueva posición
      if (this.insertBeforeRow) {
        const insertIndex = this.rows.findIndex(
          (r) => r.id === this.insertBeforeRow.dataset.id
        );
        this.rows.splice(insertIndex, 0, draggedRowData);
      } else {
        this.rows.push(draggedRowData);
      }

      this.render();
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
    const columns = parseInt(rowType.split("-")[1]);
    const rowConfig = {
      id: `row-${Date.now()}`,
      type: rowType,
      columns: Array(columns)
        .fill()
        .map(() => ({
          id: `column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          elements: [],
        })),
    };

    this.rows.push(rowConfig);
    this.render();

    // Re-configurar los eventos después de añadir una fila
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
    });

    this.emitContentChanged();
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
    return `
        <div class="builder-row" data-id="${row.id}">
          <div class="row-controls">
            <button class="row-move">↕</button>
            <button class="row-delete">×</button>
          </div>
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

  render(suppressEvent = false) {
    console.log("Rendering canvas, current pageId:", this.pageId);
    console.log("Rendering canvas, rows:", this.rows);
    console.log("Render params:", {
      suppressEvent,
      isUndoRedo: this._isUndoRedoOperation,
    });

    const currentPageId = this.pageId;

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
            background: white;
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
          .builder-row {
            position: relative;
            margin: 1rem 0;
            background: white;
            border: 1px solid #eee;
            border-radius: 4px;
            transition: transform 0.2s ease;
          }
  
          .builder-row:hover {
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
  
          .builder-row.row-dragging {
            opacity: 0.5;
            border: 2px dashed #2196F3;
            pointer-events: none;
          }

          .builder-row:not(.row-dragging) {
            transform: translate3d(0, 0, 0);
          }
  
          /* Controles de fila */
          .row-controls {
            position: absolute;
            top: -1.5rem;
            right: 0;
            opacity: 0;
            transition: opacity 0.2s ease;
            display: flex;
            gap: 0.5rem;
            z-index: 10;
            pointer-events: auto;
          }
  
          .builder-row:hover .row-controls {
            opacity: 1;
          }
  
          .row-controls button {
            padding: 0.25rem 0.5rem;
            border: none;
            background: #666;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
          }
  
          .row-controls button:hover {
            background: #333;
          }

          .row-move {
            cursor: move;
          }
  
          .row-content {
            display: grid;
            gap: 1rem;
            padding: 1rem;
          }
  
          /* Estilos de columna */
          .builder-column {
            min-height: 100px;
          }
  
          .column-dropzone {
            position: relative;
            height: 100%;
            min-height: 100px;
            border: 1px dashed #ddd;
            border-radius: 4px;
            transition: all 0.2s ease;
          }
  
          .column-dropzone.dragover {
            background: #f8f9fa;
            border-color: #2196F3;
            box-shadow: inset 0 0 0 2px #2196F3;
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
        </style>

        
  
       <div class="canvas-container">
        <div class="debug-info" style="position: fixed; top: 10px; right: 10px; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
          PageID: ${currentPageId || "null"}<br>
          Rows: ${this.rows.length}
        </div>
        
        <div class="canvas-wrapper">
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
      </div>
    `;

    // Configurar todo de manera asíncrona para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      this.setupDropZone();
      this.setupEventListeners();
      this.setupElementSelection();

      // Solo emitir eventos de cambio si no es una operación undo/redo y no está suprimido
      if (!this._isUndoRedoOperation && !suppressEvent) {
        this.emitContentChanged(suppressEvent);
      }
    });
  }
}

customElements.define("builder-canvas", BuilderCanvas);
export { BuilderCanvas };
