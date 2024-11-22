// page-builder-data-provider.js
import { CanvasStorage } from "./canvas-storage.js";

class PageBuilderCache {
  constructor() {
    this.storageKey = "pageBuilderPages";
  }

  getPages() {
    try {
      const cached = localStorage.getItem(this.storageKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  }

  setPages(pages) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(pages));
    } catch (error) {
      console.error("Error writing to cache:", error);
    }
  }

  updatePage(page) {
    const pages = this.getPages() || [];
    const index = pages.findIndex((p) => p.id === page.id);

    if (index >= 0) {
      pages[index] = page;
    } else {
      pages.push(page);
    }

    this.setPages(pages);
  }

  deletePage(pageId) {
    const pages = this.getPages();
    if (!pages) return;

    this.setPages(pages.filter((p) => p.id !== pageId));
  }
}

export class PageBuilderDataProvider {
  constructor(options = {}) {
    this.endpoint = options.endpoint;
    this.apiKey = options.apiKey;
    this.mode = options.mode || this.determineMode();
    this.cache = new PageBuilderCache();
  }

  determineMode() {
    // Si no hay endpoint, forzar modo local
    return this.endpoint ? this.mode || "hybrid" : "local";
  }

  async getPages() {
    try {
      switch (this.mode) {
        case "api":
          if (!this.endpoint) {
            throw new Error("API mode requires an endpoint");
          }
          return this.fetchPages();
        case "hybrid":
          return this.getHybridPages();
        case "local":
        default:
          return this.getLocalPages();
      }
    } catch (error) {
      console.error("Error getting pages:", error);
      // En caso de error, intentar cargar páginas locales como fallback
      return this.getLocalPages();
    }
  }

  async getHybridPages() {
    const cachedPages = await this.getLocalPages();
    if (cachedPages && cachedPages.length > 0) {
      this.fetchAndUpdateCache();
      return cachedPages;
    }
    return this.fetchPages();
  }

  async getLocalPages() {
    try {
      const pagesData = localStorage.getItem("pageBuilderPages");
      const pages = pagesData ? JSON.parse(pagesData) : [];

      // Cargar el contenido detallado de cada página
      return Promise.all(
        pages.map(async (page) => {
          const pageContent = CanvasStorage.loadCanvas(page.id);
          return {
            ...page,
            content: pageContent,
            data: pageContent, // Mantener compatibilidad con ambos nombres
            lastModified: page.lastModified || new Date().toISOString(),
          };
        })
      );
    } catch (error) {
      console.error("Error loading local pages:", error);
      return []; // Retornar array vacío en caso de error
    }
  }

  async fetchPages() {
    if (!this.endpoint) {
      throw new Error("No API endpoint configured");
    }

    try {
      const response = await fetch(`${this.endpoint}/pages`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error fetching pages: ${response.statusText}`);
      }

      const pages = await response.json();

      if (this.mode === "hybrid") {
        await this.saveLocalPages(pages);
      }

      return pages;
    } catch (error) {
      console.error("Error fetching pages:", error);
      throw error;
    }
  }

  async savePage(pageData) {
    try {
      let savedPage;

      if (this.mode !== "local" && this.endpoint) {
        const url = pageData.id
          ? `${this.endpoint}/pages/${pageData.id}`
          : `${this.endpoint}/pages`;

        const response = await fetch(url, {
          method: pageData.id ? "PUT" : "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(pageData),
        });

        if (!response.ok) {
          throw new Error(`Error saving page: ${response.statusText}`);
        }

        savedPage = await response.json();
      } else {
        savedPage = {
          ...pageData,
          id: pageData.id || `page-${Date.now()}`,
          lastModified: new Date().toISOString(),
        };
      }

      if (this.mode !== "api") {
        await this.saveLocalPage(savedPage);
      }

      return savedPage;
    } catch (error) {
      console.error("Error saving page:", error);
      throw error;
    }
  }

  async saveLocalPage(pageData) {
    try {
      // Asegurarse de que tenemos datos válidos
      const validPageData = {
        id: pageData.id || `page-${Date.now()}`,
        name: pageData.name || `Página ${Date.now()}`,
        content: pageData.content || pageData.data || { rows: [] },
        lastModified: new Date().toISOString(),
      };

      // Guardar en CanvasStorage
      CanvasStorage.saveCanvas(validPageData.id, validPageData.content);

      // Actualizar la lista de páginas
      const pages = await this.getLocalPages();
      const existingIndex = pages.findIndex((p) => p.id === validPageData.id);

      if (existingIndex >= 0) {
        pages[existingIndex] = validPageData;
      } else {
        pages.push(validPageData);
      }

      localStorage.setItem("pageBuilderPages", JSON.stringify(pages));
      return validPageData;
    } catch (error) {
      console.error("Error saving local page:", error);
      throw error;
    }
  }

  async saveLocalPages(pages) {
    try {
      await Promise.all(pages.map((page) => this.saveLocalPage(page)));
    } catch (error) {
      console.error("Error saving local pages:", error);
      throw error;
    }
  }

  async deletePage(pageId) {
    try {
      if (this.mode !== "local" && this.endpoint) {
        const response = await fetch(`${this.endpoint}/pages/${pageId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Error deleting page: ${response.statusText}`);
        }
      }

      if (this.mode !== "api") {
        await this.deleteLocalPage(pageId);
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  }

  async deleteLocalPage(pageId) {
    try {
      CanvasStorage.clearCanvas(pageId);

      const pages = await this.getLocalPages();
      const updatedPages = pages.filter((p) => p.id !== pageId);
      localStorage.setItem("pageBuilderPages", JSON.stringify(updatedPages));
    } catch (error) {
      console.error("Error deleting local page:", error);
      throw error;
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async fetchAndUpdateCache() {
    if (this.mode !== "hybrid" || !this.endpoint) return;

    try {
      const pages = await this.fetchPages();
      await this.saveLocalPages(pages);
    } catch (error) {
      console.error("Background sync failed:", error);
    }
  }
}
