// page-builder-events.js
export class PageBuilderEventHandler {
  constructor(pageManager) {
    this.pageManager = pageManager;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Eventos de carga
    this.pageManager.addEventListener(
      "pagesLoaded",
      this.handlePagesLoaded.bind(this)
    );
    this.pageManager.addEventListener(
      "loadError",
      this.handleLoadError.bind(this)
    );

    // Eventos de guardado
    this.pageManager.addEventListener(
      "pageSaved",
      this.handlePageSaved.bind(this)
    );
    this.pageManager.addEventListener(
      "saveError",
      this.handleSaveError.bind(this)
    );

    // Eventos de eliminación
    this.pageManager.addEventListener(
      "pageDeleted",
      this.handlePageDeleted.bind(this)
    );
    this.pageManager.addEventListener(
      "deleteError",
      this.handleDeleteError.bind(this)
    );

    // Eventos de sincronización
    this.pageManager.addEventListener(
      "syncStarted",
      this.handleSyncStarted.bind(this)
    );
    this.pageManager.addEventListener(
      "syncCompleted",
      this.handleSyncCompleted.bind(this)
    );
    this.pageManager.addEventListener(
      "syncError",
      this.handleSyncError.bind(this)
    );
  }

  handlePagesLoaded(event) {
    const { pages } = event.detail;
    // Aquí puedes implementar lógica adicional cuando se cargan las páginas
  }

  handleLoadError(event) {
    const { error } = event.detail;
    console.error("Error loading pages:", error);
    this.showNotification("error", "Error loading pages", error.message);
  }

  handlePageSaved(event) {
    const { page } = event.detail;
    this.showNotification("success", "Page saved successfully");
  }

  handleSaveError(event) {
    const { error } = event.detail;
    console.error("Error saving page:", error);
    this.showNotification("error", "Error saving page", error.message);
  }

  handlePageDeleted(event) {
    const { pageId } = event.detail;
    this.showNotification("success", "Page deleted successfully");
  }

  handleDeleteError(event) {
    const { error } = event.detail;
    console.error("Error deleting page:", error);
    this.showNotification("error", "Error deleting page", error.message);
  }

  handleSyncStarted() {
    this.showNotification("info", "Synchronizing pages...");
  }

  handleSyncCompleted(event) {
    const { pages } = event.detail;
    this.showNotification("success", "Pages synchronized successfully");
  }

  handleSyncError(event) {
    const { error } = event.detail;
    console.error("Sync error:", error);
    this.showNotification("error", "Error synchronizing pages", error.message);
  }

  showNotification(type, message, details = "") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
          <p class="notification-message">${message}</p>
          ${details ? `<p class="notification-details">${details}</p>` : ""}
        </div>
        <button class="notification-close">×</button>
      `;

    document.body.appendChild(notification);

    notification
      .querySelector(".notification-close")
      .addEventListener("click", () => {
        notification.remove();
      });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Método para añadir estilos de notificación al documento
  static addNotificationStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          min-width: 300px;
          padding: 1rem;
          border-radius: 4px;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          z-index: 1000;
          animation: slideIn 0.3s ease-out;
        }
  
        .notification-content {
          flex: 1;
        }
  
        .notification-message {
          margin: 0;
          font-weight: 500;
        }
  
        .notification-details {
          margin: 0.5rem 0 0;
          font-size: 0.875rem;
          color: #666;
        }
  
        .notification-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 0.5rem;
          color: #666;
        }
  
        .notification-success {
          border-left: 4px solid #4caf50;
        }
  
        .notification-error {
          border-left: 4px solid #f44336;
        }
  
        .notification-info {
          border-left: 4px solid #2196f3;
        }
  
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;

    document.head.appendChild(style);
  }
}

// Agregar estilos de notificación cuando se carga el script
PageBuilderEventHandler.addNotificationStyles();
