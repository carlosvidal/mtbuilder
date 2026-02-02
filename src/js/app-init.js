// src/js/app-init.js
import { store } from "./utils/store.js";
import { eventBus } from "./utils/event-bus.js";

export function initializeApp() {

  // Crear el EventTarget global si no existe
  if (!window.builderEvents) {
    window.builderEvents = new EventTarget();
  }

  // Conectar el EventTarget con el EventBus
  window.builderEvents.addEventListener("globalSettingsUpdated", (e) => {
    store.setState((state) => ({
      ...state,
      globalSettings: {
        ...state.globalSettings,
        ...e.detail.settings,
      },
    }));
  });

  window.builderEvents.addEventListener("contentChanged", (e) => {
    if (e.detail) {
      store.setState((state) => ({
        ...state,
        rows: e.detail.rows || [],
        globalSettings: e.detail.globalSettings || state.globalSettings,
      }));
    }
  });

  // Configurar suscripción al store para debug
  if (process.env.NODE_ENV !== "production") {
    store.subscribe((state, prevState) => {
    });
  }
}
