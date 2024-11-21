// En history.js
export class History {
  constructor() {
    this.states = [];
    this.currentIndex = -1;
    this.maxStates = 50;
  }

  pushState(state) {
    if (!state) return;

    // Si estamos en medio del historial, eliminar los estados futuros
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Añadir el nuevo estado
    this.states.push(this.cloneState(state));
    this.currentIndex++;

    // Limitar el número de estados
    if (this.states.length > this.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }

    console.log("History: Pushed state", {
      statesCount: this.states.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    this.emitHistoryChange();
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      console.log("History: Undo", {
        statesCount: this.states.length,
        currentIndex: this.currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
      this.emitHistoryChange();
      return this.cloneState(this.states[this.currentIndex]);
    }
    return null;
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      console.log("History: Redo", {
        statesCount: this.states.length,
        currentIndex: this.currentIndex,
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
      });
      this.emitHistoryChange();
      return this.cloneState(this.states[this.currentIndex]);
    }
    return null;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }

  emitHistoryChange() {
    const event = new CustomEvent("historyChange", {
      detail: {
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        statesCount: this.states.length,
        currentIndex: this.currentIndex,
      },
      bubbles: true,
      composed: true,
    });
    window.builderEvents.dispatchEvent(event);
  }

  cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }

  clear() {
    this.states = [];
    this.currentIndex = -1;
    this.emitHistoryChange();
  }
}
