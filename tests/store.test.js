import { describe, it, expect, beforeEach, vi } from "vitest";
import { Store } from "../src/js/utils/store.js";

describe("Store", () => {
  let store;

  beforeEach(() => {
    store = new Store();
  });

  it("initializes with default state", () => {
    const state = store.getState();
    expect(state.rows).toEqual([]);
    expect(state.globalSettings).toBeDefined();
    expect(state.globalSettings.maxWidth).toBe("1200px");
    expect(state.selectedElement).toBeNull();
    expect(state.pageId).toBeNull();
  });

  it("initializes with custom state", () => {
    const custom = new Store({ rows: [{ id: "r1" }], pageId: "p1" });
    const state = custom.getState();
    expect(state.rows).toEqual([{ id: "r1" }]);
    expect(state.pageId).toBe("p1");
  });

  it("setState merges state correctly", () => {
    store.setState({ pageId: "p1" });
    expect(store.getState().pageId).toBe("p1");
    expect(store.getState().rows).toEqual([]);
  });

  it("setState accepts a function updater", () => {
    store.setState({ rows: [{ id: "r1" }] });
    store.setState((state) => ({
      ...state,
      rows: [...state.rows, { id: "r2" }],
    }));
    expect(store.getState().rows).toHaveLength(2);
  });

  it("protects rows from invalid values", () => {
    store.setState({ rows: [{ id: "r1" }] });
    store.setState({ rows: "not-an-array" });
    // Should keep previous valid rows
    expect(Array.isArray(store.getState().rows)).toBe(true);
    expect(store.getState().rows).toEqual([{ id: "r1" }]);
  });

  it("notifies subscribers on state change", () => {
    const listener = vi.fn();
    store.subscribe(listener);
    // Called once on subscribe with initial state
    expect(listener).toHaveBeenCalledTimes(1);

    store.setState({ pageId: "p1" });
    expect(listener).toHaveBeenCalledTimes(2);

    const [newState, prevState] = listener.mock.calls[1];
    expect(newState.pageId).toBe("p1");
    expect(prevState.pageId).toBeNull();
  });

  it("unsubscribe stops notifications", () => {
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    listener.mockClear();

    unsubscribe();
    store.setState({ pageId: "p1" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("getState returns a shallow copy", () => {
    const state1 = store.getState();
    const state2 = store.getState();
    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2);
  });

  it("updateGlobalSettings merges settings", () => {
    store.updateGlobalSettings({ maxWidth: "800px" });
    const settings = store.getState().globalSettings;
    expect(settings.maxWidth).toBe("800px");
    expect(settings.padding).toBe("20px"); // unchanged
  });

  it("handles errors in listeners gracefully", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    store.subscribe(() => {
      throw new Error("listener error");
    });

    // Should not throw
    expect(() => store.setState({ pageId: "test" })).not.toThrow();
    errorSpy.mockRestore();
  });
});
