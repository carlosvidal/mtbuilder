// En history.js
import { eventBus } from "./event-bus.js";

export class History {
  constructor() {
    this.states = [];
    this.currentIndex = -1;
    this.maxStates = 50;
  }

  pushState(state) {
    if (!state) return;

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

    this.emitHistoryChange();
  }

  undo() {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    const previousState = JSON.parse(
      JSON.stringify(this.states[this.currentIndex])
    );

    this.emitHistoryChange();
    return previousState;
  }

  redo() {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const nextState = JSON.parse(
      JSON.stringify(this.states[this.currentIndex])
    );

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
    eventBus.emit("historyChange", {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      statesCount: this.states.length,
      currentIndex: this.currentIndex,
    });
  }
}
