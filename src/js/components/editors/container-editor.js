// container-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class ContainerEditor extends BaseElementEditor {
  render() {
    const s = this.currentElement.styles || {};
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <style>
          .direction-toggle {
            display: flex;
            gap: 0.5rem;
          }
          .direction-toggle button {
            flex: 1;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
          }
          .direction-toggle button.active {
            background: #2196F3;
            color: white;
            border-color: #2196F3;
          }
        </style>
        <div class="editor-container">
          <div class="editor-section">
            <h3>Contenedor</h3>
            <div class="form-group">
              <label>Dirección</label>
              <div class="direction-toggle">
                <button type="button" data-dir="column" class="${(s.flexDirection || "column") === "column" ? "active" : ""}">Vertical</button>
                <button type="button" data-dir="row" class="${s.flexDirection === "row" ? "active" : ""}">Horizontal</button>
              </div>
            </div>
            <div class="form-group">
              <label>Justify content</label>
              <select data-property="justifyContent">
                ${["flex-start", "center", "flex-end", "space-between", "space-around"]
                  .map(
                    (v) => `<option value="${v}" ${
                      (s.justifyContent || "flex-start") === v ? "selected" : ""
                    }>${v}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Align items</label>
              <select data-property="alignItems">
                ${["flex-start", "center", "flex-end", "stretch"]
                  .map(
                    (v) => `<option value="${v}" ${
                      (s.alignItems || "stretch") === v ? "selected" : ""
                    }>${v}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-group">
              <label>Gap (px)</label>
              <input type="number"
                data-property="gap"
                value="${parseInt(s.gap) || 10}"
                min="0">
            </div>
            <div class="form-group">
              <label>Altura mínima (px)</label>
              <input type="number"
                data-property="minHeight"
                value="${parseInt(s.minHeight) || 0}"
                min="0">
            </div>
          </div>
          ${this.renderBackgroundEditor()}
          ${this.renderSpacingEditor()}
          ${this.renderBorderEditor()}
        </div>
      `;

    // Direction toggle buttons
    this.shadowRoot.querySelectorAll(".direction-toggle button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const dir = btn.dataset.dir;
        this.updateElementProperty("flexDirection", dir);
        this.emitUpdateEvent();
        this.render();
        this.setupEventListeners();
      });
    });
  }
}
