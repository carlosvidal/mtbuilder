import { describe, it, expect, beforeEach, vi } from "vitest";
import { MediaProvider } from "../src/js/utils/media-provider.js";

describe("MediaProvider", () => {
  beforeEach(() => {
    MediaProvider.setProvider(null);
  });

  it("hasProvider returns false when no provider set", () => {
    expect(MediaProvider.hasProvider()).toBe(false);
  });

  it("hasProvider returns true when provider with upload is set", () => {
    MediaProvider.setProvider({ upload: vi.fn() });
    expect(MediaProvider.hasProvider()).toBe(true);
  });

  it("hasProvider returns false for provider without upload function", () => {
    MediaProvider.setProvider({ notUpload: true });
    expect(MediaProvider.hasProvider()).toBe(false);
  });

  it("getProvider returns the set provider", () => {
    const provider = { upload: vi.fn() };
    MediaProvider.setProvider(provider);
    expect(MediaProvider.getProvider()).toBe(provider);
  });

  it("upload calls the provider upload function", async () => {
    const mockResult = { url: "https://example.com/image.jpg", width: 800, height: 600 };
    const upload = vi.fn().mockResolvedValue(mockResult);
    MediaProvider.setProvider({ upload });

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const result = await MediaProvider.upload(file);

    expect(upload).toHaveBeenCalledWith(file);
    expect(result).toEqual(mockResult);
  });

  it("upload throws when no provider configured", async () => {
    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    await expect(MediaProvider.upload(file)).rejects.toThrow("No media provider configured");
  });

  it("upload propagates provider errors", async () => {
    MediaProvider.setProvider({
      upload: vi.fn().mockRejectedValue(new Error("Network error")),
    });

    const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
    await expect(MediaProvider.upload(file)).rejects.toThrow("Network error");
  });
});
