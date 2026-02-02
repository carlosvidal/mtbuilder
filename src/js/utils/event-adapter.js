//file: event-adapter.js
export class LegacyEventAdapter {
  static init() {
    if (!window.builderEvents) {
      window.builderEvents = new EventTarget();
    }

    this.setupLegacyToEventBus();
    this.setupEventBusToStore();
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
        eventBus.emit(eventName, e.detail);
      });
    });
  }

  static setupEventBusToStore() {
    eventBus.on("rowMoved", (detail) => {
      const state = store.getState();
      const { sourceIndex, targetIndex } = detail;

      const rows = [...state.rows];
      const [movedRow] = rows.splice(sourceIndex, 1);
      rows.splice(targetIndex, 0, movedRow);

      store.setState({ ...state, rows });
    });

    eventBus.on("rowUpdated", (detail) => {
      const state = store.getState();
      const updatedRows = state.rows.map((row) =>
        row.id === detail.rowId ? { ...row, ...detail } : row
      );
      store.setState({ ...state, rows: updatedRows });
    });
  }
}
