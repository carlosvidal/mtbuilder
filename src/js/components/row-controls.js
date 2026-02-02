// row-controls.js

import { BuilderIcon } from "./builder-icon.js";
import { eventBus } from "../utils/event-bus.js";
class RowControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["row-id", "selected"];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  setupEventListeners() {
    // Edit button
    const editBtn = this.shadowRoot.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        eventBus.emit("rowEditRequested", { rowId: this.getAttribute("row-id") });
      });
    }

    // Delete button
    const deleteBtn = this.shadowRoot.querySelector(".delete-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this row?")) {
          eventBus.emit("rowDeleted", { rowId: this.getAttribute("row-id") });
        }
      });
    }

    // Duplicate button
    const duplicateBtn = this.shadowRoot.querySelector(".duplicate-btn");
    if (duplicateBtn) {
      duplicateBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        eventBus.emit("rowDuplicated", { rowId: this.getAttribute("row-id") });
      });
    }

    // Add button
    const addBtn = this.shadowRoot.querySelector(".add-btn");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        eventBus.emit("rowAdded", { rowId: this.getAttribute("row-id") });
      });
    }

    // Drag handle
    const dragHandle = this.shadowRoot.querySelector(".drag-handle");
    if (dragHandle) {
      let row = this.closest(".builder-row");
      if (row) {
        dragHandle.addEventListener("mousedown", (e) => {
          e.stopPropagation();
          row.draggable = true;

          // Emitir evento usando eventBus
          eventBus.emit("rowDragStart", { rowId: this.getAttribute("row-id") });
        });
      }
    }

    // Row selection
    this.addEventListener("click", (e) => {
      if (e.target === this || e.target.classList.contains("row-container")) {
        this.dispatchEvent(
          new CustomEvent("row-select", {
            bubbles: true,
            composed: true,
            detail: { rowId: this.getAttribute("row-id") },
          })
        );
      }
    });
  }

  render() {
    const selected = this.getAttribute("selected") === "true";
    const styles = `
        :host {
          display: block;
          position: relative;
        }

        .row-container {
          position: relative;
          padding: 0.75rem;
          border: 1px solid ${selected ? "#2196F3" : "#eee"};
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .row-container:hover {
          border-color: #ccc;
        }

        button {
          position: absolute;
          width: 24px;
          height: 24px;
          padding: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .row-container:hover button {
          opacity: 1;
        }

        button:hover {
          background: #f5f5f5;
          border-color: #999;
          color: #333;
        }

        .drag-handle {
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: grab;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .delete-btn {
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        .delete-btn:hover {
          background: #dc3545;
          border-color: #dc3545;
          color: white;
        }

        .edit-btn {
          top: -12px;
          right: -12px;
        }

        .edit-btn:hover {
          background: #2196F3;
          border-color: #2196F3;
          color: white;
        }

        .duplicate-btn {
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
        }

        .add-btn {
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
        }
      `;

    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="row-container">
          <button class="drag-handle" title="Arrastrar">
            <builder-icon name="move" size="14"></builder-icon>
          </button>
          <button class="edit-btn" title="Editar fila">
            <builder-icon name="edit" size="14"></builder-icon>
          </button>
          <button class="delete-btn" title="Eliminar fila">
            <builder-icon name="delete" size="14"></builder-icon>
          </button>
          <button class="duplicate-btn" title="Duplicar fila">
            <builder-icon name="copy" size="14"></builder-icon>
          </button>
          <button class="add-btn" title="Agregar fila">
            <builder-icon name="plus" size="14"></builder-icon>
          </button>
          <slot></slot>
        </div>
      `;
  }
}

customElements.define("row-controls", RowControls);
export { RowControls };
