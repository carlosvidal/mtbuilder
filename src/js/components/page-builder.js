// page-builder.js
import { store } from "../utils/store.js";
import { eventBus } from "../utils/event-bus.js";
import { I18n } from "../utils/i18n.js";

class PageBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._eventUnsubs = [];
    this._ready = false;
  }

  static get observedAttributes() {
    return ["page-id", "pageId", "lang", "mode"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "page-id" || name === "pageId") {
      // Sync both attributes
      const canonical = newValue || "";
      if (name === "pageId" && this.getAttribute("page-id") !== canonical) {
        this.setAttribute("page-id", canonical);
      }
      // Forward to canvas-view-switcher
      const switcher = this.shadowRoot.querySelector("canvas-view-switcher");
      if (switcher) {
        switcher.setAttribute("pageId", canonical);
      }
      // Update store
      const state = store.getState();
      store.setState({ ...state, pageId: canonical });
    }

    if (name === "lang" && newValue) {
      this._initI18n(newValue);
    }

    if (name === "mode") {
      const state = store.getState();
      store.setState({ ...state, storageMode: newValue || "external" });
    }
  }

  async connectedCallback() {
    // Determine storage mode
    const mode = this.getAttribute("mode") || "external";
    const state = store.getState();
    store.setState({ ...state, storageMode: mode });

    // Initialize i18n
    await this._initI18n(this.getAttribute("lang"));

    // Render layout
    this.render();

    // Setup eventBus → DOM event relay
    this._setupEventRelay();

    // If mode=local, load from localStorage automatically
    if (mode === "local") {
      const pageId = this._getPageId();
      if (pageId) {
        const canvas = this._getCanvas();
        if (canvas) {
          canvas.setPageId(pageId);
          canvas.loadSavedCanvas();
        }
      }
    }

    // Emit builder:ready after first render
    requestAnimationFrame(() => {
      this._ready = true;
      this.dispatchEvent(
        new CustomEvent("builder:ready", {
          bubbles: true,
          composed: true,
          detail: { pageId: this._getPageId() },
        })
      );
    });
  }

  disconnectedCallback() {
    // Clean up eventBus subscriptions
    this._eventUnsubs.forEach((unsub) => unsub());
    this._eventUnsubs = [];
  }

  // --- Public API ---

  /**
   * Load page data into the editor.
   * @param {Object} data - { rows, globalSettings }
   */
  setPageData(data) {
    const canvas = this._getCanvas();
    if (canvas) {
      const pageId = this._getPageId();
      if (pageId) {
        canvas.setPageId(pageId);
      }
      canvas.setEditorData(data);
    }
  }

  /**
   * Get current page data from the editor.
   * @returns {Object} { rows, globalSettings }
   */
  getPageData() {
    const canvas = this._getCanvas();
    if (canvas) {
      return canvas.getEditorData();
    }
    return { rows: [], globalSettings: {} };
  }

  /**
   * Trigger a save event with current data.
   * Dispatches 'builder:save' CustomEvent on this element.
   */
  save() {
    const data = this.getPageData();
    this.dispatchEvent(
      new CustomEvent("builder:save", {
        bubbles: true,
        composed: true,
        detail: {
          pageId: this._getPageId(),
          data,
        },
      })
    );
  }

  // --- Private methods ---

  _getPageId() {
    return this.getAttribute("page-id") || this.getAttribute("pageId") || "";
  }

  _getCanvas() {
    const switcher = this.shadowRoot.querySelector("canvas-view-switcher");
    if (!switcher || !switcher.shadowRoot) return null;
    return switcher.shadowRoot.querySelector("builder-canvas");
  }

  async _initI18n(lang) {
    const i18n = I18n.getInstance();
    const desiredLocale = lang || i18n.currentLocale;
    // Only call setLocale if we need a different locale or translations aren't loaded yet
    if (
      (lang && lang !== i18n.currentLocale) ||
      !i18n.translations[desiredLocale]
    ) {
      await i18n.setLocale(desiredLocale);
    }
  }

  _setupEventRelay() {
    // Relay contentChanged from eventBus to DOM CustomEvent
    const unsubContent = eventBus.on("contentChanged", (data) => {
      this.dispatchEvent(
        new CustomEvent("builder:content-changed", {
          bubbles: true,
          composed: true,
          detail: {
            pageId: this._getPageId(),
            data,
          },
        })
      );
    });
    this._eventUnsubs.push(unsubContent);

    // Listen for saveRequested from canvas-view-switcher save button
    const unsubSave = eventBus.on("saveRequested", () => {
      this.save();
    });
    this._eventUnsubs.push(unsubSave);
  }

  render() {
    const pageId = this._getPageId();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100vh;
          background: #f5f5f5;
          overflow: hidden;
        }

        .page-builder {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar-container {
          height: 100vh;
          border-right: 1px solid #eee;
          overflow-y: auto;
          background: white;
        }

        .canvas-container {
          height: 100vh;
          overflow: hidden;
          position: relative;
          background: white;
        }

        canvas-view-switcher {
          display: block;
          height: 100%;
        }
      </style>

      <div class="page-builder">
        <div class="sidebar-container">
          <builder-sidebar></builder-sidebar>
        </div>
        <div class="canvas-container">
          <canvas-view-switcher pageId="${pageId}"></canvas-view-switcher>
        </div>
      </div>
    `;
  }
}

customElements.define("page-builder", PageBuilder);
export { PageBuilder };
