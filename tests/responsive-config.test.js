import { describe, it, expect } from "vitest";
import { BREAKPOINT, ROW_LAYOUTS, getMobileOptionsForDesktop, getResponsiveClass } from "../src/js/utils/responsive-config.js";

describe("responsive-config", () => {
  describe("BREAKPOINT", () => {
    it("is 768", () => {
      expect(BREAKPOINT).toBe(768);
    });
  });

  describe("ROW_LAYOUTS", () => {
    it("has 10 layout combinations", () => {
      expect(ROW_LAYOUTS).toHaveLength(10);
    });

    it("all layouts have desktop and mobile properties", () => {
      ROW_LAYOUTS.forEach((layout) => {
        expect(layout).toHaveProperty("desktop");
        expect(layout).toHaveProperty("mobile");
        expect(layout.mobile).toBeLessThanOrEqual(layout.desktop);
      });
    });
  });

  describe("getMobileOptionsForDesktop", () => {
    it("returns mobile options for 2-column desktop", () => {
      const options = getMobileOptionsForDesktop(2);
      expect(options).toContain(1);
      expect(options).toContain(2);
    });

    it("returns mobile options for 6-column desktop", () => {
      const options = getMobileOptionsForDesktop(6);
      expect(options).toContain(1);
      expect(options).toContain(2);
      expect(options).toContain(3);
    });

    it("returns [1] for 1-column desktop", () => {
      expect(getMobileOptionsForDesktop(1)).toEqual([1]);
    });

    it("returns empty array for unsupported desktop count", () => {
      expect(getMobileOptionsForDesktop(5)).toEqual([]);
    });
  });

  describe("getResponsiveClass", () => {
    it("generates correct class name", () => {
      expect(getResponsiveClass(2, 1)).toBe("mt-row-d2-m1");
      expect(getResponsiveClass(6, 3)).toBe("mt-row-d6-m3");
    });
  });
});
