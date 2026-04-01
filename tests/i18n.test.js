import { describe, it, expect, beforeEach, vi } from "vitest";
import { I18n } from "../src/js/utils/i18n.js";

describe("I18n", () => {
  let i18n;

  beforeEach(() => {
    // Reset singleton
    I18n.instance = null;
    // Mock document and navigator for locale detection
    Object.defineProperty(document.documentElement, "lang", { value: "", writable: true, configurable: true });
    localStorage.clear();
    i18n = new I18n();
  });

  describe("normalizeLocale", () => {
    it("extracts language code from locale string", () => {
      expect(i18n.normalizeLocale("en-US")).toBe("en");
      expect(i18n.normalizeLocale("es-PE")).toBe("es");
      expect(i18n.normalizeLocale("fr-FR")).toBe("fr");
    });

    it("returns fallback for null/undefined", () => {
      expect(i18n.normalizeLocale(null)).toBe("en");
      expect(i18n.normalizeLocale(undefined)).toBe("en");
    });

    it("lowercases the locale", () => {
      expect(i18n.normalizeLocale("EN")).toBe("en");
      expect(i18n.normalizeLocale("Es")).toBe("es");
    });
  });

  describe("isLocaleSupported", () => {
    it("returns true for supported locales", () => {
      expect(i18n.isLocaleSupported("en")).toBe(true);
      expect(i18n.isLocaleSupported("es")).toBe(true);
      expect(i18n.isLocaleSupported("fr")).toBe(true);
    });

    it("returns false for unsupported locales", () => {
      expect(i18n.isLocaleSupported("de")).toBe(false);
      expect(i18n.isLocaleSupported("zh")).toBe(false);
    });

    it("normalizes before checking", () => {
      expect(i18n.isLocaleSupported("en-US")).toBe(true);
      expect(i18n.isLocaleSupported("es-PE")).toBe(true);
    });
  });

  describe("flattenTranslations", () => {
    it("flattens nested object to dot notation", () => {
      const nested = {
        builder: {
          sidebar: {
            title: "Sidebar",
            elements: { heading: "Heading" }
          }
        }
      };
      const flat = i18n.flattenTranslations(nested);
      expect(flat["builder.sidebar.title"]).toBe("Sidebar");
      expect(flat["builder.sidebar.elements.heading"]).toBe("Heading");
    });

    it("handles flat input", () => {
      const flat = i18n.flattenTranslations({ key: "value" });
      expect(flat["key"]).toBe("value");
    });

    it("handles empty object", () => {
      expect(i18n.flattenTranslations({})).toEqual({});
    });
  });

  describe("loadTranslations", () => {
    it("loads bundled English translations", async () => {
      const loaded = await i18n.loadTranslations("en");
      expect(loaded).toBe(true);
      expect(i18n.translations["en"]).toBeDefined();
    });

    it("loads bundled Spanish translations", async () => {
      const loaded = await i18n.loadTranslations("es");
      expect(loaded).toBe(true);
      expect(i18n.translations["es"]).toBeDefined();
    });

    it("loads bundled French translations", async () => {
      const loaded = await i18n.loadTranslations("fr");
      expect(loaded).toBe(true);
      expect(i18n.translations["fr"]).toBeDefined();
    });

    it("returns cached translations on second call", async () => {
      await i18n.loadTranslations("en");
      const translations = i18n.translations["en"];
      await i18n.loadTranslations("en");
      // Same reference means it was cached
      expect(i18n.translations["en"]).toBe(translations);
    });
  });

  describe("t (translate)", () => {
    beforeEach(async () => {
      await i18n.loadTranslations("en");
      await i18n.loadTranslations("es");
      i18n.currentLocale = "en";
    });

    it("returns translation for existing key", () => {
      // We know en.json has builder keys
      const result = i18n.t("pages.list.title");
      expect(typeof result).toBe("string");
      expect(result).not.toBe("pages.list.title"); // Should not return key itself
    });

    it("returns key when translation is missing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = i18n.t("nonexistent.key");
      expect(result).toBe("nonexistent.key");
      warnSpy.mockRestore();
    });

    it("replaces parameters in translation", () => {
      // Manually set a translation with placeholder
      i18n.translations["en"]["test.greeting"] = "Hello {name}!";
      const result = i18n.t("test.greeting", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    it("keeps placeholder when param not provided", () => {
      i18n.translations["en"]["test.placeholder"] = "Value is {value}";
      const result = i18n.t("test.placeholder", {});
      expect(result).toBe("Value is {value}");
    });

    it("falls back to fallback locale when key missing in current", () => {
      i18n.currentLocale = "es";
      // Add key only to en
      i18n.translations["en"]["test.only_en"] = "English only";
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = i18n.t("test.only_en");
      expect(result).toBe("English only");
      warnSpy.mockRestore();
    });
  });

  describe("p (pluralize)", () => {
    beforeEach(async () => {
      await i18n.loadTranslations("en");
      i18n.currentLocale = "en";
    });

    it("uses singular form for count 1", () => {
      i18n.translations["en"]["items.one"] = "{count} item";
      i18n.translations["en"]["items.other"] = "{count} items";
      expect(i18n.p("items", 1)).toBe("1 item");
    });

    it("uses plural form for count > 1", () => {
      i18n.translations["en"]["items.one"] = "{count} item";
      i18n.translations["en"]["items.other"] = "{count} items";
      expect(i18n.p("items", 5)).toBe("5 items");
    });

    it("uses plural form for count 0", () => {
      i18n.translations["en"]["items.one"] = "{count} item";
      i18n.translations["en"]["items.other"] = "{count} items";
      expect(i18n.p("items", 0)).toBe("0 items");
    });
  });

  describe("setLocale", () => {
    it("changes locale and dispatches event", async () => {
      const eventSpy = vi.fn();
      window.addEventListener("localeChanged", eventSpy);

      const result = await i18n.setLocale("es");
      expect(result).toBe(true);
      expect(i18n.currentLocale).toBe("es");
      expect(eventSpy).toHaveBeenCalledTimes(1);

      window.removeEventListener("localeChanged", eventSpy);
    });

    it("returns false for unsupported locale", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const result = await i18n.setLocale("de");
      expect(result).toBe(false);
      warnSpy.mockRestore();
    });

    it("normalizes locale before setting", async () => {
      await i18n.setLocale("es-PE");
      expect(i18n.currentLocale).toBe("es");
    });
  });

  describe("getInstance (singleton)", () => {
    it("returns same instance", () => {
      const a = I18n.getInstance();
      const b = I18n.getInstance();
      expect(a).toBe(b);
    });
  });

  describe("Intl formatting", () => {
    beforeEach(() => {
      i18n.currentLocale = "en";
    });

    it("formats numbers", () => {
      const result = i18n.formatNumber(1234.5);
      expect(result).toContain("1");
      expect(result).toContain("234");
    });

    it("formats currency", () => {
      const result = i18n.formatCurrency(99.99, "USD");
      expect(result).toContain("99.99");
    });

    it("formats dates", () => {
      const date = new Date(2025, 0, 15);
      const result = i18n.formatDate(date);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
