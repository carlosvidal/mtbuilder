// canvas-storage.js
export class CanvasStorage {
  static getStorageKey(pageId) {
    return `pageBuilder_canvas_${pageId}`;
  }

  static saveCanvas(pageId, data) {
    console.log("Saving canvas for pageId:", pageId, "Data:", data);
    if (!pageId) return;

    try {
      const key = this.getStorageKey(pageId);
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      console.log("Canvas saved successfully:", { key, data });
    } catch (error) {
      console.error("Error saving canvas:", error);
    }
  }

  static loadCanvas(pageId) {
    console.log("Loading canvas for pageId:", pageId);
    if (!pageId) return null;

    try {
      const key = this.getStorageKey(pageId);
      const savedData = localStorage.getItem(key);
      const parsedData = savedData ? JSON.parse(savedData) : null;
      console.log("Loaded canvas data:", parsedData);
      return parsedData;
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
