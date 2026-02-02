// src/js/utils/sanitize.js
// Lightweight HTML sanitizer.
// Strips dangerous tags/attributes to prevent XSS without external dependencies.

const ALLOWED_TAGS = new Set([
  "a", "abbr", "b", "blockquote", "br", "caption", "cite", "code",
  "col", "colgroup", "dd", "div", "dl", "dt", "em", "figcaption",
  "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img",
  "li", "mark", "ol", "p", "pre", "q", "s", "small", "span",
  "strike", "strong", "sub", "sup", "table", "tbody", "td", "tfoot",
  "th", "thead", "tr", "u", "ul",
]);

const ALLOWED_ATTRS = new Set([
  "href", "src", "alt", "title", "class", "id", "style",
  "width", "height", "target", "rel", "colspan", "rowspan",
  "cellpadding", "cellspacing", "border",
]);

const DANGEROUS_URL_PATTERN = /^\s*(javascript|data|vbscript)\s*:/i;

function sanitizeNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return;

  if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      node.remove();
      return;
    }

    // Remove disallowed attributes
    const attrs = Array.from(node.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(name) || name.startsWith("on")) {
        node.removeAttribute(attr.name);
        continue;
      }
      // Sanitize URL attributes
      if ((name === "href" || name === "src") && DANGEROUS_URL_PATTERN.test(attr.value)) {
        node.removeAttribute(attr.name);
      }
    }

    // Force safe target for links
    if (tagName === "a") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  }

  // Process children in reverse to handle removals safely
  const children = Array.from(node.childNodes);
  for (const child of children) {
    sanitizeNode(child);
  }
}

/**
 * Sanitize an HTML string, stripping dangerous tags and attributes.
 * Returns a safe HTML string suitable for innerHTML assignment.
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== "string") return "";

  // Use a template element to parse HTML safely across environments
  // (DOMParser with text/html may not work in all jsdom versions)
  const template = document.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content);
  const div = document.createElement("div");
  div.appendChild(template.content.cloneNode(true));
  return div.innerHTML;
}
