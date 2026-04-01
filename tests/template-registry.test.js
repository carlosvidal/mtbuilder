import { describe, it, expect } from "vitest";
import { TemplateRegistry } from "../src/js/utils/template-registry.js";

describe("TemplateRegistry", () => {
  it("has built-in templates registered", () => {
    const all = TemplateRegistry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(5);
  });

  it("can get a template by id", () => {
    const blank = TemplateRegistry.get("blank");
    expect(blank).toBeDefined();
    expect(blank.id).toBe("blank");
    expect(blank.data).toHaveProperty("rows");
    expect(blank.data).toHaveProperty("globalSettings");
  });

  it("built-in templates have required properties", () => {
    const all = TemplateRegistry.getAll();
    all.forEach((t) => {
      expect(t).toHaveProperty("id");
      expect(t).toHaveProperty("name");
      expect(t).toHaveProperty("category");
      expect(t).toHaveProperty("data");
      expect(t.data).toHaveProperty("rows");
      expect(t.data).toHaveProperty("globalSettings");
    });
  });

  it("hero-landing template has rows with elements", () => {
    const hero = TemplateRegistry.get("hero-landing");
    expect(hero.data.rows.length).toBeGreaterThan(0);
    const firstRow = hero.data.rows[0];
    expect(firstRow.columns.length).toBeGreaterThan(0);
    expect(firstRow.columns[0].elements.length).toBeGreaterThan(0);
  });

  it("getCategories returns unique categories", () => {
    const cats = TemplateRegistry.getCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(new Set(cats).size).toBe(cats.length);
  });

  it("getByCategory filters correctly", () => {
    const basic = TemplateRegistry.getByCategory("basic");
    basic.forEach((t) => {
      expect(t.category).toBe("basic");
    });
  });

  it("can register and unregister custom templates", () => {
    TemplateRegistry.register("test-tpl", {
      id: "test-tpl",
      name: "Test",
      category: "test",
      data: { rows: [], globalSettings: {} },
    });
    expect(TemplateRegistry.get("test-tpl")).toBeDefined();

    TemplateRegistry.unregister("test-tpl");
    expect(TemplateRegistry.get("test-tpl")).toBeUndefined();
  });

  it("returns undefined for non-existent template", () => {
    expect(TemplateRegistry.get("nonexistent")).toBeUndefined();
  });
});
