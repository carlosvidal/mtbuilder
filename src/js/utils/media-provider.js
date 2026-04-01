// media-provider.js

let currentProvider = null;

export class MediaProvider {
  /**
   * Set the active media provider.
   * @param {object} provider - { upload(file): Promise<{url, width?, height?}> }
   */
  static setProvider(provider) {
    currentProvider = provider;
  }

  static getProvider() {
    return currentProvider;
  }

  static hasProvider() {
    return currentProvider !== null && typeof currentProvider.upload === "function";
  }

  /**
   * Upload a file using the current provider.
   * @param {File} file
   * @returns {Promise<{url: string, width?: number, height?: number}>}
   */
  static async upload(file) {
    if (!currentProvider || typeof currentProvider.upload !== "function") {
      throw new Error("No media provider configured. Use MediaProvider.setProvider({ upload: fn })");
    }
    return currentProvider.upload(file);
  }
}
