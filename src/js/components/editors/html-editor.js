import { BaseElementEditor } from "./base-element-editor.js";
import { I18n } from "../../utils/i18n.js";

export class HtmlEditor extends BaseElementEditor {
  render() {
    const i18n = I18n.getInstance();
    this.shadowRoot.innerHTML = `
        ${this.getCommonStyles()}
        <style>
          textarea {
            font-family: 'Courier New', Consolas, monospace;
            font-size: 13px;
            line-height: 1.5;
            tab-size: 2;
            background: #1e1e1e;
            color: #d4d4d4;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 12px;
            min-height: 300px;
            resize: vertical;
          }
          textarea:focus {
            outline: none;
            border-color: #2196F3;
          }
        </style>
        <div class="editor-container">
          <div class="editor-section">
            <h3>${i18n.t("builder.editor.elements.html.title")}</h3>
            <div class="form-group">
              <label>${i18n.t("builder.editor.elements.html.code")}</label>
              <textarea
                data-property="content"
                rows="20"
                spellcheck="false"
                placeholder="<div>HTML</div>"
              >${this.currentElement.content || ""}</textarea>
            </div>
          </div>
        </div>
      `;
  }
}
customElements.define("html-editor", HtmlEditor);
