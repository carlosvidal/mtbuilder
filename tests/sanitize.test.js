import { describe, it, expect } from "vitest";
import { sanitizeHTML } from "../src/js/utils/sanitize.js";

describe("sanitizeHTML", () => {
  it("returns empty string for falsy input", () => {
    expect(sanitizeHTML(null)).toBe("");
    expect(sanitizeHTML(undefined)).toBe("");
    expect(sanitizeHTML("")).toBe("");
  });

  it("preserves safe HTML tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    expect(sanitizeHTML(input)).toBe(input);
  });

  it("removes script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHTML(input)).toBe("<p>Hello</p>");
  });

  it("removes event handler attributes", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    expect(sanitizeHTML(input)).toBe("<p>Click me</p>");
  });

  it("removes onerror attributes", () => {
    const input = '<img src="x" onerror="alert(1)">';
    expect(sanitizeHTML(input)).toBe('<img src="x">');
  });

  it("removes javascript: URLs from href", () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain("javascript:");
  });

  it("removes javascript: URLs from src", () => {
    const input = '<img src="javascript:alert(1)">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain("javascript:");
  });

  it("removes data: URLs", () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain("data:");
  });

  it("removes iframe tags", () => {
    const input = '<iframe src="https://evil.com"></iframe>';
    expect(sanitizeHTML(input)).toBe("");
  });

  it("removes form tags", () => {
    const input = '<form action="/steal"><input></form>';
    expect(sanitizeHTML(input)).toBe("");
  });

  it("preserves safe attributes", () => {
    const input = '<a href="https://example.com" title="Example">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('title="Example"');
  });

  it("adds rel=noopener noreferrer to links", () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHTML(input);
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it("preserves table structure", () => {
    const input = "<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>";
    const result = sanitizeHTML(input);
    expect(result).toContain("<table>");
    expect(result).toContain("<th>Header</th>");
    expect(result).toContain("<td>Cell</td>");
  });

  it("preserves style attributes", () => {
    const input = '<div style="color: red;">Text</div>';
    expect(sanitizeHTML(input)).toBe(input);
  });

  it("removes style tags", () => {
    const input = "<style>body { display: none; }</style><p>Text</p>";
    expect(sanitizeHTML(input)).toBe("<p>Text</p>");
  });
});
