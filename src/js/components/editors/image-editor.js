import { BaseElementEditor } from "./base-element-editor.js";
import { MediaProvider } from "../../utils/media-provider.js";
import { I18n } from "../../utils/i18n.js";

export class ImageEditor extends BaseElementEditor {
  render() {
    const i18n = I18n.getInstance();
    const hasProvider = MediaProvider.hasProvider();
    const currentSrc = this.currentElement.attributes?.src || "";

    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <style>
          .upload-zone {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 8px;
            background: #fafafa;
          }
          .upload-zone:hover, .upload-zone.dragover {
            border-color: #2196F3;
            background: #f0f7ff;
          }
          .upload-zone .upload-icon {
            font-size: 28px;
            margin-bottom: 4px;
          }
          .upload-zone .upload-text {
            font-size: 13px;
            color: #666;
          }
          .upload-zone .upload-text strong {
            color: #2196F3;
          }
          .upload-zone input[type="file"] {
            display: none;
          }
          .upload-status {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }
          .upload-status.error {
            color: #ef4444;
          }
          .upload-status.uploading {
            color: #2196F3;
          }
          .image-preview {
            margin-top: 8px;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
          }
          .image-preview img {
            width: 100%;
            height: auto;
            display: block;
            max-height: 180px;
            object-fit: contain;
            background: #f9f9f9;
          }
          .or-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 10px 0;
            color: #999;
            font-size: 12px;
          }
          .or-divider::before, .or-divider::after {
            content: "";
            flex: 1;
            border-top: 1px solid #e5e7eb;
          }
        </style>
        <div class="editor-container">
          <div class="editor-section">
            <h3>${i18n.t("builder.editor.elements.image.title") !== "builder.editor.elements.image.title" ? i18n.t("builder.editor.elements.image.title") : "Imagen"}</h3>

            ${hasProvider ? `
              <div class="upload-zone" id="uploadZone">
                <div class="upload-icon">📷</div>
                <div class="upload-text">
                  <strong>${i18n.t("builder.editor.elements.image.upload") !== "builder.editor.elements.image.upload" ? i18n.t("builder.editor.elements.image.upload") : "Click to upload"}</strong>
                  ${i18n.t("builder.editor.elements.image.dragDrop") !== "builder.editor.elements.image.dragDrop" ? i18n.t("builder.editor.elements.image.dragDrop") : "or drag and drop"}
                </div>
                <input type="file" id="fileInput" accept="image/*">
                <div class="upload-status" id="uploadStatus"></div>
              </div>
              <div class="or-divider">${i18n.t("common.or") !== "common.or" ? i18n.t("common.or") : "or"}</div>
            ` : ""}

            <div class="form-group">
              <label>URL</label>
              <input type="text"
                data-property="src"
                value="${currentSrc}"
                placeholder="https://example.com/image.jpg">
            </div>

            ${currentSrc ? `
              <div class="image-preview">
                <img src="${currentSrc}" alt="Preview" onerror="this.style.display='none'">
              </div>
            ` : ""}

            <div class="form-group">
              <label>${i18n.t("builder.editor.elements.image.altText") !== "builder.editor.elements.image.altText" ? i18n.t("builder.editor.elements.image.altText") : "Texto alternativo"}</label>
              <input type="text"
                data-property="alt"
                value="${this.currentElement.attributes?.alt || ""}"
                placeholder="Descripción de la imagen">
            </div>
            <div class="form-group">
              <label>${i18n.t("builder.editor.elements.image.fit") !== "builder.editor.elements.image.fit" ? i18n.t("builder.editor.elements.image.fit") : "Ajuste"}</label>
              <select data-property="objectFit">
                <option value="cover" ${
                  this.currentElement.styles.objectFit === "cover"
                    ? "selected"
                    : ""
                }>Cover</option>
                <option value="contain" ${
                  this.currentElement.styles.objectFit === "contain"
                    ? "selected"
                    : ""
                }>Contain</option>
                <option value="fill" ${
                  this.currentElement.styles.objectFit === "fill"
                    ? "selected"
                    : ""
                }>Fill</option>
              </select>
            </div>
          </div>
          ${this.renderWrapperEditor()}
          ${this.renderSpacingEditor()}
          ${this.renderBorderEditor()}
        </div>
      `;

    if (hasProvider) {
      this._setupUpload();
    }
  }

  _setupUpload() {
    const zone = this.shadowRoot.getElementById("uploadZone");
    const fileInput = this.shadowRoot.getElementById("fileInput");
    const status = this.shadowRoot.getElementById("uploadStatus");

    if (!zone || !fileInput) return;

    zone.addEventListener("click", () => fileInput.click());

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("dragover");
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("dragover");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragover");
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        this._handleUpload(file, status);
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this._handleUpload(file, status);
      }
    });
  }

  async _handleUpload(file, statusEl) {
    statusEl.textContent = "Uploading...";
    statusEl.className = "upload-status uploading";

    try {
      const result = await MediaProvider.upload(file);
      if (result && result.url) {
        this.currentElement.attributes = {
          ...this.currentElement.attributes,
          src: result.url,
        };
        this.emitUpdateEvent();
        // Re-render to show preview
        this.render();
        this.setupEventListeners();
      }
    } catch (err) {
      statusEl.textContent = err.message || "Upload failed";
      statusEl.className = "upload-status error";
    }
  }
}

if (!customElements.get("image-editor")) {
  customElements.define("image-editor", ImageEditor);
}
