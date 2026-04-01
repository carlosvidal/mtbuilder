// template-picker.js
import { TemplateRegistry } from "../utils/template-registry.js";
import { I18n } from "../utils/i18n.js";

export class TemplatePicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.i18n = I18n.getInstance();
    this._onSelect = null;
    this._onCancel = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  set onSelect(fn) {
    this._onSelect = fn;
  }

  set onCancel(fn) {
    this._onCancel = fn;
  }

  _getTemplateName(template) {
    if (template.nameKey) {
      const translated = this.i18n.t(template.nameKey);
      if (translated !== template.nameKey) return translated;
    }
    return template.name;
  }

  _getTemplateDescription(template) {
    if (template.descriptionKey) {
      const translated = this.i18n.t(template.descriptionKey);
      if (translated !== template.descriptionKey) return translated;
    }
    return template.description;
  }

  _getCategoryIcon(category) {
    const icons = {
      basic: "📄",
      landing: "🚀",
      ecommerce: "🛍️",
    };
    return icons[category] || "📋";
  }

  render() {
    const templates = TemplateRegistry.getAll();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal {
          background: #fff;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1a1a2e;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .close-button:hover {
          background: #f3f4f6;
          color: #333;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }
        .template-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fff;
        }
        .template-card:hover {
          border-color: #2196F3;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
          transform: translateY(-2px);
        }
        .template-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }
        .template-name {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 6px 0;
        }
        .template-description {
          font-size: 13px;
          color: #666;
          margin: 0;
          line-height: 1.4;
        }
        .template-category {
          display: inline-block;
          font-size: 11px;
          color: #888;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 10px;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      </style>
      <div class="overlay">
        <div class="modal">
          <div class="modal-header">
            <h2>${this.i18n.t("templates.picker.title") !== "templates.picker.title" ? this.i18n.t("templates.picker.title") : "Choose a Template"}</h2>
            <button class="close-button">&times;</button>
          </div>
          <div class="modal-body">
            <div class="templates-grid">
              ${templates.map((t) => `
                <div class="template-card" data-template-id="${t.id}">
                  <div class="template-icon">${this._getCategoryIcon(t.category)}</div>
                  <h3 class="template-name">${this._getTemplateName(t)}</h3>
                  <p class="template-description">${this._getTemplateDescription(t)}</p>
                  <span class="template-category">${t.category}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    this.shadowRoot.querySelector(".close-button").addEventListener("click", () => {
      this._onCancel?.();
      this.remove();
    });

    this.shadowRoot.querySelector(".overlay").addEventListener("click", (e) => {
      if (e.target.classList.contains("overlay")) {
        this._onCancel?.();
        this.remove();
      }
    });

    this.shadowRoot.querySelectorAll(".template-card").forEach((card) => {
      card.addEventListener("click", () => {
        const templateId = card.dataset.templateId;
        const template = TemplateRegistry.get(templateId);
        if (template) {
          this._onSelect?.(template);
          this.remove();
        }
      });
    });
  }
}

if (!customElements.get("template-picker")) {
  customElements.define("template-picker", TemplatePicker);
}
