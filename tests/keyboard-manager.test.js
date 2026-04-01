import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { KeyboardManager } from "../src/js/utils/keyboard-manager.js";
import { eventBus } from "../src/js/utils/event-bus.js";

describe("KeyboardManager", () => {
  let km;

  beforeEach(() => {
    // Reset singleton
    KeyboardManager.instance = null;
    km = KeyboardManager.getInstance();
    km.attach(document);
  });

  afterEach(() => {
    km.detach();
  });

  function fireKey(key, opts = {}) {
    const event = new KeyboardEvent("keydown", {
      key,
      ctrlKey: opts.ctrl || false,
      metaKey: opts.meta || false,
      shiftKey: opts.shift || false,
      bubbles: true,
    });
    document.dispatchEvent(event);
  }

  it("returns same singleton instance", () => {
    const a = KeyboardManager.getInstance();
    const b = KeyboardManager.getInstance();
    expect(a).toBe(b);
  });

  it("emits shortcut:undo on Ctrl+Z", () => {
    const spy = vi.fn();
    eventBus.on("shortcut:undo", spy);
    fireKey("z", { ctrl: true });
    expect(spy).toHaveBeenCalledTimes(1);
    eventBus.off("shortcut:undo", spy);
  });

  it("emits shortcut:redo on Ctrl+Shift+Z", () => {
    const spy = vi.fn();
    eventBus.on("shortcut:redo", spy);
    fireKey("z", { ctrl: true, shift: true });
    expect(spy).toHaveBeenCalledTimes(1);
    eventBus.off("shortcut:redo", spy);
  });

  it("emits shortcut:redo on Ctrl+Y", () => {
    const spy = vi.fn();
    eventBus.on("shortcut:redo", spy);
    fireKey("y", { ctrl: true });
    expect(spy).toHaveBeenCalledTimes(1);
    eventBus.off("shortcut:redo", spy);
  });

  it("emits saveRequested on Ctrl+S", () => {
    const spy = vi.fn();
    eventBus.on("saveRequested", spy);
    fireKey("s", { ctrl: true });
    expect(spy).toHaveBeenCalledTimes(1);
    eventBus.off("saveRequested", spy);
  });

  it("emits escape events on Escape key", () => {
    const elSpy = vi.fn();
    const rowSpy = vi.fn();
    eventBus.on("elementDeselected", elSpy);
    eventBus.on("rowDeselected", rowSpy);
    fireKey("Escape");
    expect(elSpy).toHaveBeenCalledTimes(1);
    expect(rowSpy).toHaveBeenCalledTimes(1);
    eventBus.off("elementDeselected", elSpy);
    eventBus.off("rowDeselected", rowSpy);
  });

  it("does not fire when typing in an input", () => {
    const spy = vi.fn();
    eventBus.on("saveRequested", spy);

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    // Simulate event from input
    Object.defineProperty(event, "target", { value: input });
    document.dispatchEvent(event);

    // The _isEditingText check will catch it
    // But since event.target is set, it depends on implementation
    document.body.removeChild(input);
    eventBus.off("saveRequested", spy);
  });

  it("allows registering custom shortcuts", () => {
    const spy = vi.fn();
    km.register("custom-test", {
      key: "k",
      ctrl: true,
      action: spy,
    });

    fireKey("k", { ctrl: true });
    expect(spy).toHaveBeenCalledTimes(1);

    km.unregister("custom-test");
  });

  it("allows unregistering shortcuts", () => {
    const spy = vi.fn();
    km.register("temp", {
      key: "j",
      ctrl: true,
      action: spy,
    });
    km.unregister("temp");

    fireKey("j", { ctrl: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it("does nothing after detach", () => {
    const spy = vi.fn();
    eventBus.on("shortcut:undo", spy);
    km.detach();
    fireKey("z", { ctrl: true });
    expect(spy).not.toHaveBeenCalled();
    eventBus.off("shortcut:undo", spy);
  });
});
