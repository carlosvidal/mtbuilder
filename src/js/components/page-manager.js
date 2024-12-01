// page-manager.js
import { BuilderIcon } from "./builder-icon.js"; // Importar el componente BuilderIcon para mostrar los iconos
import { PageBuilderDataProvider } from "./page-builder-data-provider.js";
import { PageBuilderEventHandler } from "./page-builder-events.js";
import { I18n } from "../utils/i18n.js";

export class PageManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.pages = []; // Inicializar el array de páginas
    this.currentPageId = null;
    this.i18n = I18n.getInstance();
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
      getHeaders: () => ({
        "Accept-Language": this.i18n.currentLocale,
        "Content-Language": this.i18n.currentLocale,
      }),
    });
  }

  async connectedCallback() {
    // Inicializar i18n antes de renderizar
    await this.initializeI18n();
    this.render();
    this.loadPages();
  }

  async initializeI18n() {
    // Intentar cargar el idioma guardado
    const savedLocale = localStorage.getItem("preferredLocale");

    // Si no hay idioma guardado, detectar del navegador
    const initialLocale = savedLocale || this.i18n.detectLocale();

    // Cargar el idioma
    await this.i18n.setLocale(initialLocale);

    // Escuchar cambios de idioma para guardar la preferencia
    window.addEventListener("localeChanged", (event) => {
      const { locale } = event.detail;
      localStorage.setItem("preferredLocale", locale);
      this.render(); // Re-renderizar el componente
    });
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
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #f5f5f5;
  }
  
  .header {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #dee2e6;
    height: 60px;
  }
  
  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: none;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    color: #666;
    transition: all 0.2s ease;
    margin-right: 1rem;
  }

  .back-button:hover {
    background: #f8f9fa;
    color: #333;
    border-color: #ced4da;
  }

  .page-title {
    margin: 0;
    font-size: 1.25rem;
    color: #333;
    flex: 1;
  }

  .language-selector {
    margin-left: auto;
  }

  .builder-container {
    height: calc(100vh - 60px);
    overflow: hidden;
  }
</style>
        <div class="header">
      <button class="back-button" id="backToList"><builder-icon name="home" size="20"></builder-icon></button>
      <h1 class="page-title">
        ${
          this.pages.find((p) => p.id === this.currentPageId)?.name ||
          this.i18n.t("builder.untitled")
        }
        <small style="color: #666; font-size: 0.8em;">ID: ${
          this.currentPageId
        }</small>
      </h1>
      <div class="language-selector">
            <select id="languageSelect">
              <option value="es" ${
                this.i18n.currentLocale === "es" ? "selected" : ""
              }>Español</option>
              <option value="en" ${
                this.i18n.currentLocale === "en" ? "selected" : ""
              }>English</option>
              <option value="fr" ${
                this.i18n.currentLocale === "fr" ? "selected" : ""
              }>Français</option>
            </select>
          </div>
    </div>
    <div class="builder-container">
      <page-builder pageId="${this.currentPageId}"></page-builder>
    </div>
      `;

      // Configurar selector de idioma
      const languageSelect = this.shadowRoot.getElementById("languageSelect");
      languageSelect?.addEventListener("change", async (e) => {
        await this.i18n.setLocale(e.target.value);
      });

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
          <h1>${this.i18n.t("pages.list.title")}</h1>
          <div class="header-actions">
            <div class="language-selector">
              <select id="languageSelect">
                <option value="es" ${
                  this.i18n.currentLocale === "es" ? "selected" : ""
                }>Español</option>
                <option value="en" ${
                  this.i18n.currentLocale === "en" ? "selected" : ""
                }>English</option>
                <option value="fr" ${
                  this.i18n.currentLocale === "fr" ? "selected" : ""
                }>Français</option>
              </select>
            </div>
            <button class="new-page-button" id="newPage">
              ${this.i18n.t("pages.list.create")}
            </button>
          </div>
        </div>

        ${
          this.pages.length === 0
            ? this.renderEmptyState()
            : this.renderPageGrid()
        }
      `;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Configurar el selector de idioma
    const languageSelect = this.shadowRoot.getElementById("languageSelect");
    if (languageSelect) {
      languageSelect.addEventListener("change", async (e) => {
        await this.i18n.setLocale(e.target.value);
      });
    }

    // Configurar el botón de nueva página
    const newPageButton = this.shadowRoot.getElementById("newPage");
    if (newPageButton) {
      newPageButton.addEventListener("click", () => this.handleNewPage());
    }

    // Configurar los botones de acción de página
    this.shadowRoot
      .querySelectorAll(".page-action-button")
      .forEach((button) => {
        button.addEventListener("click", (e) => {
          const actionButton = e.target.closest(".page-action-button");
          if (actionButton) {
            this.handlePageAction(actionButton);
          }
        });
      });
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <h2>${this.i18n.t("pages.list.empty")}</h2>
        <p>${this.i18n.t("pages.list.empty.description")}</p>
      </div>
    `;
  }

  renderPageGrid() {
    return `
      <div class="pages-grid">
        ${this.renderPageCards()}
      </div>
    `;
  }

  renderPageCards() {
    return this.pages
      .map(
        (page) => `
      <div class="page-card">
        <div class="page-card-header">
          <h2 class="page-name">${page.name}</h2>
          <div class="page-actions">
            <button class="page-action-button" data-action="edit" data-page-id="${
              page.id
            }" 
              title="${this.i18n.t("pages.list.actions.edit")}">
              <builder-icon name="edit" size="20"></builder-icon>
            </button>
            <button class="page-action-button" data-action="delete" data-page-id="${
              page.id
            }"
              title="${this.i18n.t("pages.list.actions.delete")}">
              <builder-icon name="delete" size="20"></builder-icon>
            </button>
          </div>
        </div>
        <div class="page-meta">
          ${this.i18n.t("pages.lastModified")}: 
          ${this.i18n.formatDate(new Date(page.lastModified))}
          <br>
          <small style="color: #666;">ID: ${page.id}</small>
        </div>
      </div>
    `
      )
      .join("");
  }

  async handleNewPage() {
    try {
      const pageId = `page-${Date.now()}`;
      const newPage = {
        id: pageId,
        name: `Nueva Página ${this.pages.length + 1}`,
        content: { rows: [] },
        lastModified: new Date().toISOString(),
      };

      await this.dataProvider.savePage(newPage);
      this.currentPageId = pageId;
      await this.loadPages();
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
  }

  async handlePageAction(button) {
    const action = button.dataset.action;
    const pageId = button.dataset.pageId;

    if (action === "edit") {
      await this.handlePageEdit(pageId);
    } else if (action === "delete") {
      await this.handlePageDelete(pageId);
    }
  }

  async handlePageEdit(pageId) {
    const pageData = this.pages.find((p) => p.id === pageId);
    if (pageData?.data || pageData?.content) {
      this.currentPageId = pageId;
      this.render();
      this.loadBuilder(pageId);
    }
  }

  async handlePageDelete(pageId) {
    if (confirm(this.i18n.t("common.confirmation.delete"))) {
      try {
        await this.deletePage(pageId);
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
}

customElements.define("page-manager", PageManager);
