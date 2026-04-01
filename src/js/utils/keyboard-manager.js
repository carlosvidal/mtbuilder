// keyboard-manager.js
import { eventBus } from "./event-bus.js";
import { store } from "./store.js";

class KeyboardManager {
  static instance = null;

  constructor() {
    this.shortcuts = new Map();
    this._handler = this._handleKeyDown.bind(this);
    this._attached = false;
    this._registerDefaults();
  }

  static getInstance() {
    if (!KeyboardManager.instance) {
      KeyboardManager.instance = new KeyboardManager();
    }
    return KeyboardManager.instance;
  }

  attach(target = document) {
    if (this._attached) return;
    target.addEventListener("keydown", this._handler);
    this._attached = true;
    this._target = target;
  }

  detach() {
    if (!this._attached) return;
    this._target.removeEventListener("keydown", this._handler);
    this._attached = false;
    this._target = null;
  }

  register(id, shortcut) {
    this.shortcuts.set(id, shortcut);
  }

  unregister(id) {
    this.shortcuts.delete(id);
  }

  _isEditingText(e) {
    const target = e.target;
    if (!target) return false;
    const tag = target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    // Check shadow DOM — the event composedPath may include an editable element
    const path = e.composedPath?.() || [];
    return path.some(
      (el) =>
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
    );
  }

  _handleKeyDown(e) {
    // Skip if user is typing in a form field or contentEditable
    if (this._isEditingText(e)) return;

    const key = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;

    for (const [, shortcut] of this.shortcuts) {
      if (
        shortcut.key === key &&
        !!shortcut.ctrl === ctrl &&
        !!shortcut.shift === shift
      ) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  _registerDefaults() {
    this.register("undo", {
      key: "z",
      ctrl: true,
      shift: false,
      action: () => eventBus.emit("shortcut:undo"),
    });

    this.register("redo", {
      key: "z",
      ctrl: true,
      shift: true,
      action: () => eventBus.emit("shortcut:redo"),
    });

    this.register("redo-y", {
      key: "y",
      ctrl: true,
      action: () => eventBus.emit("shortcut:redo"),
    });

    this.register("save", {
      key: "s",
      ctrl: true,
      action: () => eventBus.emit("saveRequested"),
    });

    this.register("delete", {
      key: "delete",
      action: () => {
        const state = store.getState();
        if (state.selectedElement) {
          eventBus.emit("shortcut:deleteElement", {
            elementId: state.selectedElement.id,
          });
        } else if (state.selectedRow) {
          eventBus.emit("rowDeleted", { rowId: state.selectedRow.id });
        }
      },
    });

    this.register("backspace-delete", {
      key: "backspace",
      action: () => {
        const state = store.getState();
        if (state.selectedElement) {
          eventBus.emit("shortcut:deleteElement", {
            elementId: state.selectedElement.id,
          });
        } else if (state.selectedRow) {
          eventBus.emit("rowDeleted", { rowId: state.selectedRow.id });
        }
      },
    });

    this.register("duplicate", {
      key: "d",
      ctrl: true,
      action: () => {
        const state = store.getState();
        if (state.selectedRow) {
          eventBus.emit("rowDuplicated", { rowId: state.selectedRow.id });
        }
      },
    });

    this.register("escape", {
      key: "escape",
      action: () => {
        eventBus.emit("elementDeselected");
        eventBus.emit("rowDeselected");
      },
    });
  }
}

export { KeyboardManager };
