// src/js/utils/store.js
export class Store {
  constructor(initialState = {}) {
    // Estado inicial seguro con valores por defecto
    this._state = {
      currentPage: null,
      pages: [],
      selectedElement: null,
      selectedRow: null,
      globalSettings: {
        maxWidth: "1200px",
        padding: "20px",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, sans-serif",
        ...(initialState.globalSettings || {}),
      },
      rows: Array.isArray(initialState.rows) ? initialState.rows : [],
      pageId: null,
      ...initialState,
    };

    this._listeners = new Set();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    // Notificar estado inicial
    try {
      listener(this.getState(), this.getState());
    } catch (error) {
      console.error("Error in initial state notification:", error);
    }
    return () => this._listeners.delete(listener);
  }

  getState() {
    return { ...this._state };
  }

  setState(updater) {
    console.log("🔄 Store setState called", {
      timestamp: new Date().toISOString(),
      isFunction: typeof updater === "function",
    });

    const prevState = { ...this._state };
    const nextState =
      typeof updater === "function" ? updater(this._state) : updater;

    console.log("🔄 State diff:", {
      rowCountBefore: prevState.rows?.length,
      rowCountAfter: nextState.rows?.length,
      selectedRowBefore: prevState.selectedRow?.id,
      selectedRowAfter: nextState.selectedRow?.id,
    });

    this._state = {
      ...this._state,
      ...nextState,
      rows: Array.isArray(nextState.rows) ? nextState.rows : this._state.rows,
    };

    for (const listener of this._listeners) {
      try {
        listener(this._state, prevState);
      } catch (error) {
        console.error("🔄 Error in state listener:", error);
      }
    }
  }

  updateGlobalSettings(settings) {
    this.setState((state) => ({
      ...state,
      globalSettings: {
        ...state.globalSettings,
        ...settings,
      },
    }));
  }
}

export const store = new Store();
