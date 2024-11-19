import { BaseElementEditor } from "./base-element-editor.js";

export class VideoEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Video</h3>
          <div class="form-group">
            <label>URL del video</label>
            <input type="text" 
              data-property="src" 
              value="${this.currentElement.attributes?.src || ""}"
              placeholder="https://www.youtube.com/embed/...">
          </div>
          <div class="form-group">
            <label>Proporción</label>
            <select data-property="aspectRatio">
              <option value="16/9" ${
                this.currentElement.attributes?.aspectRatio === "16/9"
                  ? "selected"
                  : ""
              }>16:9</option>
              <option value="4/3" ${
                this.currentElement.attributes?.aspectRatio === "4/3"
                  ? "selected"
                  : ""
              }>4:3</option>
              <option value="1/1" ${
                this.currentElement.attributes?.aspectRatio === "1/1"
                  ? "selected"
                  : ""
              }>1:1</option>
            </select>
          </div>
          <div class="form-group">
            <label>Controles</label>
            <input type="checkbox" 
              data-property="controls" 
              ${this.currentElement.attributes?.controls ? "checked" : ""}>
          </div>
          <div class="form-group">
            <label>Reproducción automática</label>
            <input type="checkbox" 
              data-property="autoplay" 
              ${this.currentElement.attributes?.autoplay ? "checked" : ""}>
          </div>
        </div>
        ${this.renderSpacingEditor()}
        ${this.renderBorderEditor()}
      </div>
    `;
  }
}
customElements.define("video-editor", VideoEditor);
