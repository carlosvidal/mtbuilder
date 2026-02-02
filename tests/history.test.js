import { describe, it, expect, beforeEach, vi } from "vitest";
import { History } from "../src/js/utils/history.js";
import { eventBus } from "../src/js/utils/event-bus.js";

describe("History", () => {
  let history;

  beforeEach(() => {
    history = new History();
    eventBus.off(); // clear all listeners
  });

  it("starts with empty state", () => {
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("pushState adds states", () => {
    history.pushState({ rows: [] });
    expect(history.canUndo()).toBe(false); // only 1 state

    history.pushState({ rows: [{ id: "r1" }] });
    expect(history.canUndo()).toBe(true);
  });

  it("ignores null state", () => {
    history.pushState(null);
    expect(history.canUndo()).toBe(false);
  });

  it("ignores duplicate consecutive states", () => {
    const state = { rows: [{ id: "r1" }] };
    history.pushState(state);
    history.pushState(state);
    expect(history.canUndo()).toBe(false); // still only 1 unique state
  });

  it("undo returns previous state", () => {
    const s1 = { rows: [] };
    const s2 = { rows: [{ id: "r1" }] };
    history.pushState(s1);
    history.pushState(s2);

    const result = history.undo();
    expect(result).toEqual(s1);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);
  });

  it("redo returns next state", () => {
    const s1 = { rows: [] };
    const s2 = { rows: [{ id: "r1" }] };
    history.pushState(s1);
    history.pushState(s2);
    history.undo();

    const result = history.redo();
    expect(result).toEqual(s2);
    expect(history.canRedo()).toBe(false);
  });

  it("undo returns null when no history", () => {
    expect(history.undo()).toBeNull();
  });

  it("redo returns null when at latest state", () => {
    history.pushState({ rows: [] });
    expect(history.redo()).toBeNull();
  });

  it("pushState after undo discards future states", () => {
    history.pushState({ rows: [] });
    history.pushState({ rows: [{ id: "r1" }] });
    history.pushState({ rows: [{ id: "r1" }, { id: "r2" }] });

    history.undo(); // back to r1
    history.pushState({ rows: [{ id: "r3" }] }); // new branch

    expect(history.canRedo()).toBe(false);
    history.undo();
    expect(history.redo()).toEqual({ rows: [{ id: "r3" }] });
  });

  it("respects maxStates limit", () => {
    history.maxStates = 3;
    history.pushState({ v: 1 });
    history.pushState({ v: 2 });
    history.pushState({ v: 3 });
    history.pushState({ v: 4 }); // oldest should be dropped

    // Should have states v:2, v:3, v:4
    const s1 = history.undo(); // v:3
    const s2 = history.undo(); // v:2
    expect(s2).toEqual({ v: 2 });
    expect(history.canUndo()).toBe(false); // v:1 was dropped
  });

  it("emits historyChange event", () => {
    const listener = vi.fn();
    eventBus.on("historyChange", listener);

    history.pushState({ rows: [] });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        canUndo: false,
        canRedo: false,
      })
    );

    history.pushState({ rows: [{ id: "r1" }] });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        canUndo: true,
        canRedo: false,
      })
    );
  });

  it("clear resets all state", () => {
    history.pushState({ rows: [] });
    history.pushState({ rows: [{ id: "r1" }] });
    history.clear();
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it("returns deep copies to prevent mutation", () => {
    history.pushState({ rows: [{ id: "r1" }] });
    history.pushState({ rows: [{ id: "r2" }] });
    history.pushState({ rows: [{ id: "r3" }] });

    const undone = history.undo(); // returns r2
    undone.rows.push({ id: "mutated" });

    // Undo again should return clean r1, not mutated
    const again = history.undo(); // returns r1
    expect(again.rows).toEqual([{ id: "r1" }]);
    expect(again.rows).toHaveLength(1); // no mutation
  });
});
