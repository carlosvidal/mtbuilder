import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventBus } from "../src/js/utils/event-bus.js";

describe("EventBus", () => {
  let bus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it("calls listener when event is emitted", () => {
    const listener = vi.fn();
    bus.on("test", listener);
    bus.emit("test", { value: 42 });
    expect(listener).toHaveBeenCalledWith({ value: 42 });
  });

  it("supports multiple listeners on the same event", () => {
    const a = vi.fn();
    const b = vi.fn();
    bus.on("test", a);
    bus.on("test", b);
    bus.emit("test", "data");
    expect(a).toHaveBeenCalledWith("data");
    expect(b).toHaveBeenCalledWith("data");
  });

  it("does not call listeners for other events", () => {
    const listener = vi.fn();
    bus.on("a", listener);
    bus.emit("b", "data");
    expect(listener).not.toHaveBeenCalled();
  });

  it("off removes a specific listener", () => {
    const listener = vi.fn();
    bus.on("test", listener);
    bus.off("test", listener);
    bus.emit("test", "data");
    expect(listener).not.toHaveBeenCalled();
  });

  it("on returns an unsubscribe function", () => {
    const listener = vi.fn();
    const unsub = bus.on("test", listener);
    unsub();
    bus.emit("test", "data");
    expect(listener).not.toHaveBeenCalled();
  });

  it("off without callback removes all listeners for event", () => {
    const a = vi.fn();
    const b = vi.fn();
    bus.on("test", a);
    bus.on("test", b);
    bus.off("test");
    bus.emit("test", "data");
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("off without arguments clears all events", () => {
    const a = vi.fn();
    const b = vi.fn();
    bus.on("x", a);
    bus.on("y", b);
    bus.off();
    bus.emit("x");
    bus.emit("y");
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it("handles errors in listeners without affecting others", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const badListener = vi.fn(() => {
      throw new Error("fail");
    });
    const goodListener = vi.fn();

    bus.on("test", badListener);
    bus.on("test", goodListener);
    bus.emit("test", "data");

    expect(badListener).toHaveBeenCalled();
    expect(goodListener).toHaveBeenCalledWith("data");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("emit with no listeners does not throw", () => {
    expect(() => bus.emit("nonexistent", "data")).not.toThrow();
  });
});
