// En history.js
export class History {
  constructor() {
    this.states = [];
    this.currentIndex = -1;
    this.maxStates = 50;
  }

  pushState(state) {
    if (!state) return;

    console.log("Push State - Before:", {
      statesLength: this.states.length,
      currentIndex: this.currentIndex,
      state,
    });

    // Si estamos en el medio del historial, eliminar los estados futuros
    if (this.currentIndex < this.states.length - 1) {
      this.states = this.states.slice(0, this.currentIndex + 1);
    }

    // Verificar si el nuevo estado es diferente del último
    const lastState = this.states[this.currentIndex];
    if (
      this.currentIndex >= 0 &&
      JSON.stringify(lastState) === JSON.stringify(state)
    ) {
      console.log("State unchanged, skipping...");
      return;
    }

    // Agregar el nuevo estado
    this.states.push(JSON.parse(JSON.stringify(state))); // Copia profunda
    this.currentIndex++;

    // Limitar el número de estados
    if (this.states.length > this.maxStates) {
      this.states.shift();
      this.currentIndex--;
    }

    console.log("Push State - After:", {
      statesLength: this.states.length,
      currentIndex: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    this.emitHistoryChange();
  }

  undo() {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    const previousState = JSON.parse(
      JSON.stringify(this.states[this.currentIndex])
    );

    console.log("Undo - After:", {
      newIndex: this.currentIndex,
      state: previousState,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    this.emitHistoryChange();
    return previousState;
  }

  redo() {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const nextState = JSON.parse(
      JSON.stringify(this.states[this.currentIndex])
    );

    console.log("Redo - After:", {
      newIndex: this.currentIndex,
      state: nextState,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    });

    this.emitHistoryChange();
    return nextState;
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }

  clear() {
    this.states = [];
    this.currentIndex = -1;
    this.emitHistoryChange();
  }

  emitHistoryChange() {
    console.log("Emitting history change:", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      statesCount: this.states.length,
      currentIndex: this.currentIndex,
    });

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

    if (window.builderEvents) {
      window.builderEvents.dispatchEvent(event);
    }
  }
}
