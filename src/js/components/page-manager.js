// page-manager.js
import { PageBuilderDataProvider } from "./page-builder-data-provider.js";
import { PageBuilderEventHandler } from "./page-builder-events.js";

export class PageManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.pages = []; // Inicializar el array de páginas
    this.currentPageId = null;
    this.setupDataProvider();
    this.eventHandler = new PageBuilderEventHandler(this);
  }

  setupDataProvider() {
    const endpoint = this.getAttribute("api-endpoint");
    const apiKey = this.getAttribute("api-key");
    // Si no hay endpoint, forzar modo local
    const mode = endpoint ? this.getAttribute("mode") || "hybrid" : "local";

    this.dataProvider = new PageBuilderDataProvider({
      endpoint,
      apiKey,
      mode,
    });
  }

  connectedCallback() {
    // Primero renderizar estado inicial
    this.render();
    // Luego cargar las páginas
    this.loadPages();
  }

  async loadPages() {
    try {
      this.dispatchEvent(new CustomEvent("syncStarted"));
      const pages = await this.dataProvider.getPages();

      if (Array.isArray(pages)) {
        this.pages = pages;
        this.render();
        this.dispatchEvent(
          new CustomEvent("syncCompleted", { detail: { pages } })
        );
      } else {
        throw new Error("Invalid pages data received");
      }
    } catch (error) {
      console.error("Error loading pages:", error);
      this.dispatchEvent(new CustomEvent("syncError", { detail: { error } }));
    }
  }

  async savePage(pageData) {
    try {
      const savedPage = await this.dataProvider.savePage(pageData);
      await this.loadPages(); // Recargar la lista
      return savedPage;
    } catch (error) {
      console.error("Error saving page:", error);
      this.dispatchEvent(new CustomEvent("saveError", { detail: { error } }));
    }
  }

  async deletePage(pageId) {
    try {
      await this.dataProvider.deletePage(pageId);
      await this.loadPages(); // Recargar la lista
      this.dispatchEvent(
        new CustomEvent("pageDeleted", { detail: { pageId } })
      );
    } catch (error) {
      console.error("Error deleting page:", error);
      this.dispatchEvent(new CustomEvent("deleteError", { detail: { error } }));
    }
  }

  async loadBuilder(pageId) {
    try {
      console.log("Loading builder for page:", pageId);
      this.currentPageId = pageId;
      const pageData = this.pages.find((p) => p.id === pageId);
      console.log("Page data:", pageData);

      if (pageData) {
        requestAnimationFrame(() => {
          const builder = this.shadowRoot.querySelector("page-builder");
          if (builder) {
            const canvas = builder.shadowRoot.querySelector("builder-canvas");
            if (canvas) {
              canvas.setPageId(pageId);
              // Si tenemos contenido, establecerlo
              if (pageData.content || pageData.data) {
                canvas.setEditorData(pageData.content || pageData.data);
              }
            }
          }
        });
      }
    } catch (error) {
      console.error("Error loading builder:", error);
      this.dispatchEvent(
        new CustomEvent("loadError", {
          detail: { error },
        })
      );
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

      const newPageButton = this.shadowRoot.getElementById("newPage");
      if (newPageButton) {
        newPageButton.addEventListener("click", async () => {
          try {
            const pageId = `page-${Date.now()}`;
            const newPage = {
              id: pageId,
              name: `Nueva Página ${this.pages.length + 1}`,
              content: { rows: [] }, // Usar content en lugar de data
              lastModified: new Date().toISOString(),
            };

            await this.dataProvider.savePage(newPage);
            this.currentPageId = pageId;
            await this.loadPages(); // Recargar la lista
            this.render();

            this.dispatchEvent(
              new CustomEvent("pageSaved", {
                detail: { page: newPage },
              })
            );
          } catch (error) {
            console.error("Error creating new page:", error);
            this.dispatchEvent(
              new CustomEvent("saveError", {
                detail: { error },
              })
            );
          }
        });
      }

      this.shadowRoot
        .querySelectorAll(".page-action-button")
        .forEach((button) => {
          button.addEventListener("click", async () => {
            // Añadir async aquí
            const action = button.dataset.action;
            const pageId = button.dataset.pageId;

            if (action === "edit") {
              const pageData = this.pages.find((p) => p.id === pageId);
              console.log("Editing page:", pageId, pageData);

              if (pageData?.data || pageData?.content) {
                // Verificar ambos content y data
                this.currentPageId = pageId;
                this.render();
                this.loadBuilder(pageId);
              }
            } else if (action === "delete") {
              if (
                confirm("¿Estás seguro de que deseas eliminar esta página?")
              ) {
                try {
                  await this.dataProvider.deletePage(pageId);
                  await this.loadPages();
                  this.dispatchEvent(
                    new CustomEvent("pageDeleted", {
                      detail: { pageId },
                    })
                  );
                } catch (error) {
                  console.error("Error deleting page:", error);
                  this.dispatchEvent(
                    new CustomEvent("deleteError", {
                      detail: { error },
                    })
                  );
                }
              }
            }
          });
        });
    }
  }
}

customElements.define("page-manager", PageManager);
