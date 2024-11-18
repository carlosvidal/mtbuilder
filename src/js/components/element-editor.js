class ElementEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentElement = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("change", (e) => {
        if (!this.currentElement) return;

        const property = e.target.dataset.property;
        const value = e.target.value;

        if (property === "tag") {
          this.currentElement.tag = value;
        } else {
          this.currentElement.styles[property] = value;
        }

        window.builderEvents.dispatchEvent(
          new CustomEvent("elementUpdated", {
            detail: {
              elementId: this.currentElement.id,
              property,
              value,
              styles: this.currentElement.styles,
              tag: this.currentElement.tag,
            },
          })
        );
      });
    });
  }

  setElement(element) {
    if (!element || !element.styles) return;

    if (element.styles.color?.length === 4) {
      element.styles.color = element.styles.color.replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
      );
    }
    if (element.styles.backgroundColor?.length === 4) {
      element.styles.backgroundColor = element.styles.backgroundColor.replace(
        /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
        (_, r, g, b) => `#${r}${r}${g}${g}${b}${b}`
      );
    }

    this.currentElement = element;
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (!this.currentElement) {
      this.shadowRoot.innerHTML =
        '<div class="no-selection">Selecciona un elemento para editar</div>';
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: white;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .editor-section {
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }

        .editor-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #333;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        input, select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        input[type="color"] {
          padding: 0.25rem;
          height: 2rem;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }

        select[data-property="tag"] {
          margin-bottom: 1rem;
        }
      </style>

      <div class="editor-container">
        ${
          this.currentElement.type === "heading"
            ? `
          <div class="editor-section">
            <select data-property="tag">
              ${["h1", "h2", "h3", "h4", "h5", "h6"]
                .map(
                  (tag) => `
                  <option value="${tag}" ${
                    this.currentElement.tag === tag ? "selected" : ""
                  }>
                    ${tag.toUpperCase()}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
        `
            : ""
        }

        <div class="editor-section">
          <h3>Texto</h3>
          <div class="form-group">
            <label>Color</label>
            <input type="color" 
              data-property="color" 
              value="${this.currentElement.styles.color || "#000000"}"
            >
          </div>
          <div class="form-group">
            <label>Tamaño (px)</label>
            <input type="number" 
              data-property="fontSize"
              value="${parseInt(this.currentElement.styles.fontSize) || 16}"
              min="8"
              max="72"
            >
          </div>
          <div class="form-group">
            <label>Peso</label>
            <select data-property="fontWeight">
              ${[
                "normal",
                "bold",
                "100",
                "200",
                "300",
                "400",
                "500",
                "600",
                "700",
                "800",
                "900",
              ]
                .map(
                  (weight) => `
                  <option value="${weight}" ${
                    this.currentElement.styles.fontWeight === weight
                      ? "selected"
                      : ""
                  }>
                    ${weight}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="editor-section">
          <h3>Fondo</h3>
          <div class="form-group">
            <label>Color de fondo</label>
            <input type="color" 
              data-property="backgroundColor"
              value="${this.currentElement.styles.backgroundColor || "#ffffff"}"
            >
          </div>
        </div>

        <div class="editor-section">
          <h3>Espaciado</h3>
          <div class="form-group">
            <label>Padding (px)</label>
            <div class="grid-2">
              <input type="number" 
                data-property="paddingTop" 
                placeholder="Top"
                value="${parseInt(this.currentElement.styles.paddingTop) || 0}"
              >
              <input type="number" 
                data-property="paddingRight" 
                placeholder="Right"
                value="${
                  parseInt(this.currentElement.styles.paddingRight) || 0
                }"
              >
              <input type="number" 
                data-property="paddingBottom" 
                placeholder="Bottom"
                value="${
                  parseInt(this.currentElement.styles.paddingBottom) || 0
                }"
              >
              <input type="number" 
                data-property="paddingLeft" 
                placeholder="Left"
                value="${parseInt(this.currentElement.styles.paddingLeft) || 0}"
              >
            </div>
          </div>
          <div class="form-group">
            <label>Margin (px)</label>
            <div class="grid-2">
              <input type="number" 
                data-property="marginTop" 
                placeholder="Top"
                value="${parseInt(this.currentElement.styles.marginTop) || 0}"
              >
              <input type="number" 
                data-property="marginRight" 
                placeholder="Right"
                value="${parseInt(this.currentElement.styles.marginRight) || 0}"
              >
              <input type="number" 
                data-property="marginBottom" 
                placeholder="Bottom"
                value="${
                  parseInt(this.currentElement.styles.marginBottom) || 0
                }"
              >
              <input type="number" 
                data-property="marginLeft" 
                placeholder="Left"
                value="${parseInt(this.currentElement.styles.marginLeft) || 0}"
              >
            </div>
          </div>
        </div>

        <div class="editor-section">
          <h3>Borde</h3>
          <div class="form-group">
            <label>Ancho (px)</label>
            <input type="number" 
              data-property="borderWidth"
              value="${parseInt(this.currentElement.styles.borderWidth) || 0}"
              min="0"
            >
          </div>
          <div class="form-group">
            <label>Color</label>
            <input type="color" 
              data-property="borderColor"
              value="${this.currentElement.styles.borderColor || "#000000"}"
            >
          </div>
          <div class="form-group">
            <label>Estilo</label>
            <select data-property="borderStyle">
              ${["none", "solid", "dashed", "dotted"]
                .map(
                  (style) => `
                  <option value="${style}" ${
                    this.currentElement.styles.borderStyle === style
                      ? "selected"
                      : ""
                  }>
                    ${style}
                  </option>
                `
                )
                .join("")}
            </select>
          </div>
          <div class="form-group">
            <label>Radio (px)</label>
            <input type="number" 
              data-property="borderRadius"
              value="${parseInt(this.currentElement.styles.borderRadius) || 0}"
              min="0"
            >
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("element-editor", ElementEditor);
export { ElementEditor };
