// canvas-storage.js
export class CanvasStorage {
  static getStorageKey(pageId) {
    return `pageBuilder_canvas_${pageId}`;
  }

  static saveCanvas(pageId, data) {
    if (!pageId) return;

    try {
      const key = this.getStorageKey(pageId);
      // Asegurar que los estilos estén presentes en las filas
      const processedData = {
        ...data,
        rows: data.rows.map((row) => ({
          ...row,
          styles: row.styles || {},
          columns: row.columns.map((column) => ({
            ...column,
            elements: column.elements.map((element) => ({
              ...element,
              styles: element.styles || {},
            })),
          })),
        })),
      };

      const serializedData = JSON.stringify(processedData);
      localStorage.setItem(key, serializedData);
      console.log("Canvas saved successfully:", { key, data: processedData });
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  }

  static loadCanvas(pageId) {
    if (!pageId) return null;

    try {
      const key = this.getStorageKey(pageId);
      const savedData = localStorage.getItem(key);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);

      // Asegurar que los estilos existan
      return {
        ...parsedData,
        rows: parsedData.rows.map((row) => ({
          ...row,
          styles: row.styles || {},
          columns: row.columns.map((column) => ({
            ...column,
            elements: column.elements.map((element) => ({
              ...element,
              styles: element.styles || {},
            })),
          })),
        })),
      };
    } catch (error) {
      console.error("Error loading canvas:", error);
      return null;
    }
  }

  static clearCanvas(pageId) {
    if (!pageId) return;

    try {
      const key = this.getStorageKey(pageId);
      localStorage.removeItem(key);
      console.log("Canvas cleared successfully:", key);
    } catch (error) {
      console.error("Error clearing canvas:", error);
    }
  }
}
