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
          padding: 1rem;
          background: white;
          border: 1px solid ${selected ? "#2196F3" : "transparent"};
          border-radius: 4px;
          transition: all 0.2s ease;
        }
  
        .row-container:hover {
          border-color: #e0e0e0;
        }
  
        .controls {
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
  
        .row-container:hover .controls {
          opacity: 1;
        }
  
        button {
          padding: 0.25rem;
          background: white;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #666;
        }
  
        button:hover {
          background: #f5f5f5;
          border-color: #ccc;
          color: #333;
        }
  
        .drag-handle {
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
        }
  
        .row-container:hover .drag-handle {
          opacity: 1;
        }
  
        .drag-handle:active {
          cursor: grabbing;
        }
  
        .add-btn {
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          padding: 0;
          background: #2196F3;
          border: none;
          border-radius: 50%;
          color: white;
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s;
        }
  
        .add-btn:hover {
          background: #1976D2;
          transform: translateX(-50%) scale(1.1);
        }
  
        .row-container:hover .add-btn {
          opacity: 1;
        }
      `;

    this.shadowRoot.innerHTML = `
        <style>${styles}</style>
        <div class="row-container">
          <div class="drag-handle" title="Arrastrar para reordenar">
            <builder-icon name="move" size="16"></builder-icon>
          </div>
          <div class="controls">
            <button class="duplicate-btn" title="Duplicate row">
              <builder-icon name="copy" size="16"></builder-icon>
            </button>
            <button class="delete-btn" title="Delete row">
              <builder-icon name="delete" size="16"></builder-icon>
            </button>
          </div>
          <button class="add-btn" title="Add row below">
            <builder-icon name="plus" size="16"></builder-icon>
          </button>
          <slot></slot>
        </div>
      `;
  }
}

customElements.define("row-controls", RowControls);
export { RowControls };
