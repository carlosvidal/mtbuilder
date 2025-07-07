// link-editor.js
import { BaseElementEditor } from "./base-element-editor.js";

export class LinkEditor extends BaseElementEditor {
  render() {
    this.shadowRoot.innerHTML = `
      ${this.getCommonStyles()}
      <div class="editor-container">
        <div class="editor-section">
          <h3>Enlace</h3>
          
          <div class="form-group">
            <label>Texto del enlace</label>
            <input type="text" 
              data-property="content" 
              value="${this.currentElement.content || 'Enlace'}"
              placeholder="Texto que se muestra">
          </div>
          
          <div class="form-group">
            <label>URL</label>
            <input type="url" 
              data-property="href" 
              value="${this.currentElement.attributes?.href || '#'}"
              placeholder="https://ejemplo.com">
          </div>
          
          <div class="form-group">
            <label>Abrir en</label>
            <select data-property="target">
              <option value="_self" ${this.currentElement.attributes?.target === '_self' ? 'selected' : ''}>Misma ventana</option>
              <option value="_blank" ${this.currentElement.attributes?.target === '_blank' || !this.currentElement.attributes?.target ? 'selected' : ''}>Nueva ventana</option>
            </select>
          </div>
        </div>
        
        <div class="editor-section">
          <h3>Estilos</h3>
          
          <div class="form-group">
            <label>Color</label>
            <input type="color" 
              data-property="color" 
              value="${this.currentElement.styles?.color || '#2196F3'}">
          </div>
          
          <div class="form-group">
            <label>Tamaño de fuente</label>
            <input type="number" 
              data-property="fontSize" 
              value="${parseInt(this.currentElement.styles?.fontSize) || 16}"
              min="8" max="72">
            <span>px</span>
          </div>
          
          <div class="form-group">
            <label>Decoración</label>
            <select data-property="textDecoration">
              <option value="none" ${this.currentElement.styles?.textDecoration === 'none' ? 'selected' : ''}>Sin decoración</option>
              <option value="underline" ${this.currentElement.styles?.textDecoration === 'underline' || !this.currentElement.styles?.textDecoration ? 'selected' : ''}>Subrayado</option>
              <option value="line-through" ${this.currentElement.styles?.textDecoration === 'line-through' ? 'selected' : ''}>Tachado</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Peso de fuente</label>
            <select data-property="fontWeight">
              <option value="normal" ${this.currentElement.styles?.fontWeight === 'normal' || !this.currentElement.styles?.fontWeight ? 'selected' : ''}>Normal</option>
              <option value="bold" ${this.currentElement.styles?.fontWeight === 'bold' ? 'selected' : ''}>Negrita</option>
            </select>
          </div>
        </div>
        
        ${this.getSpacingControls()}
      </div>
    `;
  }
}