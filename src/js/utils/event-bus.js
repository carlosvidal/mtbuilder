// src/js/utils/event-bus.js
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    return () => this.off(event, callback);
  }

  emit(event, data) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event ${event} handler:`, error);
        }
      }
    }
  }

  off(event, callback) {
    // Si se proporciona un callback específico, solo remover ese callback
    if (callback) {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    }
    // Si no se proporciona callback, remover todos los listeners del evento
    else if (event) {
      this.events.delete(event);
    }
    // Si no se proporciona evento, remover todos los eventos
    else {
      this.events.clear();
    }
  }
}

export const eventBus = new EventBus();
