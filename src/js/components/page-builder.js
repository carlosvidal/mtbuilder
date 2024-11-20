// page-builder.js
class PageBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    if (!window.builderEvents) {
      window.builderEvents = new EventTarget();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "pageId") {
      console.log("PageBuilder: pageId attribute changed to", newValue);
      const canvas = this.shadowRoot.querySelector("builder-canvas");
      if (canvas) {
        console.log("PageBuilder: Setting pageId on canvas:", newValue);
        canvas.setAttribute("pageId", newValue); // Cambiar esta línea
      }
    }
  }

  static get observedAttributes() {
    return ["pageId"];
  }

  connectedCallback() {
    // Obtener pageId del atributo si existe
    const pageId = this.getAttribute("pageId");
    console.log("PageBuilder connected, pageId:", pageId);

    this.render();
  }

  render() {
    const pageId = this.getAttribute("pageId");
    console.log(
      "PageBuilder rendering with pageId:",
      this.getAttribute("pageId")
    );

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100vh;
          background: #f5f5f5;
        }

        .page-builder {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: 100%;
        }

        .sidebar-container {
          border-right: 1px solid #eee;
          overflow-y: auto;
          background: white;
        }

        .canvas-container {
          overflow: hidden;
          background: white;
        }
      </style>

      <div class="page-builder">
        <div class="sidebar-container">
          <builder-sidebar></builder-sidebar>
        </div>
        <div class="canvas-container">
          <builder-canvas></builder-canvas>
        </div>
      </div>
    `;
  }
}

customElements.define("page-builder", PageBuilder);
export { PageBuilder };
