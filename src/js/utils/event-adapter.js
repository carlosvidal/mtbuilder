//file: event-adapter.js
export class LegacyEventAdapter {
  static init() {
    console.log("🔄 Initializing LegacyEventAdapter");

    if (!window.builderEvents) {
      window.builderEvents = new EventTarget();
      console.log("✅ Created global EventTarget");
    }

    // Debug actual state
    const initialState = store.getState();
    console.log("🔄 Initial store state:", initialState);

    this.setupLegacyToEventBus();
    this.setupEventBusToStore();
    this.setupEventDebugging();

    console.log("✅ LegacyEventAdapter initialized");
  }

  static setupLegacyToEventBus() {
    const eventsToMap = [
      "rowUpdated",
      "rowSelected",
      "rowMoved",
      "elementSelected",
      "elementMoved",
      "contentChanged",
      "globalSettingsUpdated",
    ];

    eventsToMap.forEach((eventName) => {
      window.builderEvents.addEventListener(eventName, (e) => {
        console.log(`🔄 Legacy -> EventBus: ${eventName}`, {
          detail: e.detail,
          timestamp: new Date().toISOString(),
        });
        eventBus.emit(eventName, e.detail);
      });
    });
  }

  static setupEventBusToStore() {
    eventBus.on("rowMoved", (detail) => {
      console.log("🔄 EventBus -> Store: rowMoved", detail);
      const state = store.getState();
      const { sourceIndex, targetIndex } = detail;

      const rows = [...state.rows];
      const [movedRow] = rows.splice(sourceIndex, 1);
      rows.splice(targetIndex, 0, movedRow);

      console.log("🔄 Updating store with new rows:", rows);
      store.setState({ ...state, rows });
    });

    eventBus.on("rowUpdated", (detail) => {
      console.log("🔄 EventBus -> Store: rowUpdated", detail);
      const state = store.getState();
      const updatedRows = state.rows.map((row) =>
        row.id === detail.rowId ? { ...row, ...detail } : row
      );
      store.setState({ ...state, rows: updatedRows });
    });
  }

  static setupEventDebugging() {
    // Debug DOM events
    const dragEvents = ["dragstart", "dragover", "drop", "dragend"];
    dragEvents.forEach((eventName) => {
      window.addEventListener(
        eventName,
        (e) => {
          const target = e.target.closest(".builder-row");
          if (target) {
            console.log(`🎯 DOM ${eventName}:`, {
              rowId: target.dataset.id,
              type: e.type,
              timestamp: new Date().toISOString(),
            });
          }
        },
        true
      );
    });

    // Debug store changes
    store.subscribe((newState, prevState) => {
      console.log("🔄 Store changed:", {
        timestamp: new Date().toISOString(),
        rowsChanged: newState.rows !== prevState?.rows,
        rowCount: newState.rows?.length,
        selectedRowChanged: newState.selectedRow !== prevState?.selectedRow,
      });
    });
  }
}
