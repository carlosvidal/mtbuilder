class PageBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    if (!window.builderEvents) {
      window.builderEvents = new EventTarget();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
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
            grid-template-rows: auto 1fr;
            grid-template-areas: 
              "toolbar toolbar"
              "sidebar canvas";
            height: 100%;
          }
  
          .toolbar-container {
            grid-area: toolbar;
            border-bottom: 1px solid #eee;
            background: white;
          }
  
          .sidebar-container {
            grid-area: sidebar;
            border-right: 1px solid #eee;
            overflow-y: auto;
            background: white;
          }
  
          .canvas-container {
            grid-area: canvas;
            overflow: hidden;
            background: white;
          }
        </style>
  
        <div class="page-builder">
          <!--
          <div class="toolbar-container">
            <builder-toolbar></builder-toolbar>
          </div>
          -->
          <div class="sidebar-container">
            <builder-sidebar></builder-sidebar>
          </div>
          <div class="canvas-container">
            <canvas-view-switcher></canvas-view-switcher>
          </div>
        </div>
      `;
  }
}

customElements.define("page-builder", PageBuilder);
export { PageBuilder };
