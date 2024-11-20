// page-manager.js
import { CanvasStorage } from "./canvas-storage.js";

export class PageManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.currentPageId = null;
  }

  connectedCallback() {
    this.loadPages();
    this.render();
  }

  loadPages() {
    try {
      const pagesData = localStorage.getItem("pageBuilderPages");
      console.log("Loaded pages data:", pagesData);
      this.pages = pagesData ? JSON.parse(pagesData) : [];
      console.log("Parsed pages:", this.pages);
    } catch (error) {
      console.error("Error loading pages:", error);
      this.pages = [];
    }
  }

  savePage(pageData) {
    const existingPageIndex = this.pages.findIndex((p) => p.id === pageData.id);

    const page = {
      id: pageData.id || `page-${Date.now()}`,
      name:
        pageData.name ||
        (existingPageIndex >= 0
          ? this.pages[existingPageIndex].name
          : `Página sin título ${this.pages.length + 1}`),
      lastModified: new Date().toISOString(),
      data: pageData.data || { rows: [] },
    };

    if (existingPageIndex >= 0) {
      this.pages[existingPageIndex] = page;
    } else {
      this.pages.push(page);
    }

    localStorage.setItem("pageBuilderPages", JSON.stringify(this.pages));
    CanvasStorage.saveCanvas(page.id, page.data);
    console.log("Saved page:", page);
  }

  deletePage(pageId) {
    this.pages = this.pages.filter((p) => p.id !== pageId);
    localStorage.setItem("pageBuilderPages", JSON.stringify(this.pages));
    CanvasStorage.clearCanvas(pageId);
    this.render();
  }

  loadBuilder(pageId) {
    console.log("Loading builder for page:", pageId);
    this.currentPageId = pageId;
    const pageData = this.pages.find((p) => p.id === pageId);
    console.log("Page data:", pageData);

    if (pageData?.data) {
      // Cambiar al modo edición
      this.currentPageId = pageId;
      // Eliminar esta línea: this.render();

      // Esperar a que el DOM se actualice antes de establecer el pageId en el canvas
      requestAnimationFrame(() => {
        const builder = this.shadowRoot.querySelector("page-builder");
        if (builder) {
          const canvas = builder.shadowRoot.querySelector("builder-canvas");
          if (canvas) {
            canvas.setPageId(pageId);
          }
        }
      });
    }
  }
  render() {
    const isEditing = this.currentPageId !== null;

    if (isEditing) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            height: 100vh;
          }
          .header {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
          }
          .back-button {
            padding: 0.5rem 1rem;
            background: none;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 1rem;
          }
          .page-title {
            margin: 0;
            font-size: 1.25rem;
            color: #333;
          }
          .builder-container {
            height: calc(100% - 60px);
          }
        </style>
        <div class="header">
      <button class="back-button" id="backToList">← Volver</button>
      <h1 class="page-title">
        ${this.pages.find((p) => p.id === this.currentPageId)?.name || "Editor"}
        <small style="color: #666; font-size: 0.8em;">ID: ${
          this.currentPageId
        }</small>
      </h1>
    </div>
    <div class="builder-container">
      <page-builder pageId="${this.currentPageId}"></page-builder>
    </div>
      `;

      const backButton = this.shadowRoot.getElementById("backToList");
      backButton.addEventListener("click", () => {
        this.currentPageId = null;
        this.render();
      });

      // Solo cargar el builder una vez
      this.loadBuilder(this.currentPageId);
    } else {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            padding: 2rem;
          }
          .pages-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          }
          .new-page-button {
            padding: 0.75rem 1.5rem;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
          }
          .pages-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
          }
          .page-card {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 1.5rem;
            background: white;
          }
          .page-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }
          .page-name {
            margin: 0;
            font-size: 1.25rem;
            color: #333;
          }
          .page-actions {
            display: flex;
            gap: 0.5rem;
          }
          .page-action-button {
            padding: 0.25rem;
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
          }
          .page-action-button:hover {
            color: #333;
          }
          .page-meta {
            color: #666;
            font-size: 0.875rem;
          }
          .empty-state {
            text-align: center;
            padding: 3rem;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
          }
        </style>

        <div class="pages-header">
          <h1>Mis Páginas</h1>
          <button class="new-page-button" id="newPage">Crear Nueva Página</button>
        </div>

        ${
          this.pages.length === 0
            ? `
          <div class="empty-state">
            <h2>No hay páginas creadas</h2>
            <p>Comienza creando tu primera página</p>
          </div>
        `
            : `
          <div class="pages-grid">
            ${this.pages
              .map(
                (page) => `
              <div class="page-card">
      <div class="page-card-header">
        <h2 class="page-name">${page.name}</h2>
        <div class="page-actions">
          <button class="page-action-button" data-action="edit" data-page-id="${
            page.id
          }">✏️</button>
          <button class="page-action-button" data-action="delete" data-page-id="${
            page.id
          }">🗑️</button>
        </div>
      </div>
      <div class="page-meta">
        Última modificación: ${new Date(page.lastModified).toLocaleString()}
        <br>
        <small style="color: #666;">ID: ${page.id}</small>
      </div>
    </div>
            `
              )
              .join("")}
          </div>
        `
        }
      `;

      // Event Listeners
      const newPageButton = this.shadowRoot.getElementById("newPage");
      newPageButton.addEventListener("click", () => {
        const pageId = `page-${Date.now()}`;
        CanvasStorage.clearCanvas(pageId);

        this.savePage({
          id: pageId,
          name: `Nueva Página ${this.pages.length + 1}`,
          data: { rows: [] },
        });

        this.currentPageId = pageId;
        this.render();
      });

      this.shadowRoot
        .querySelectorAll(".page-action-button")
        .forEach((button) => {
          button.addEventListener("click", () => {
            const action = button.dataset.action;
            const pageId = button.dataset.pageId;

            // En el manejador del botón edit, reemplazar el bloque setTimeout por esto:

            if (action === "edit") {
              const pageData = this.pages.find((p) => p.id === pageId);
              console.log("Editing page:", pageId, pageData);

              if (pageData?.data) {
                // Cambiar al modo edición y cargar datos usando el método probado
                this.currentPageId = pageId;
                this.render();
                this.loadBuilder(pageId); // Usar el método que ya funcionaba
              }
            } else if (action === "delete") {
              if (
                confirm("¿Estás seguro de que deseas eliminar esta página?")
              ) {
                CanvasStorage.clearCanvas(pageId);
                this.deletePage(pageId);
              }
            }
          });
        });
    }
  }
}

customElements.define("page-manager", PageManager);
