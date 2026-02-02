// export-utils.js
import { sanitizeHTML } from "./sanitize.js";
import { BREAKPOINT, getResponsiveClass } from "./responsive-config.js";

export class ExportUtils {
  static generateExportableHTML(data) {
    const globalStyles = data.globalSettings || {};
    const bodyStyle = [
      `font-family: ${globalStyles.fontFamily || "system-ui, -apple-system, sans-serif"}`,
      "line-height: 1.5",
      "color: #333",
      "margin: 0",
      "padding: 0",
      "box-sizing: border-box",
    ].join("; ");

    const wrapperStyle = [
      `max-width: ${globalStyles.maxWidth || "1200px"}`,
      "margin: 0 auto",
      `padding: ${globalStyles.padding || "20px"}`,
      `background-color: ${globalStyles.backgroundColor || "#ffffff"}`,
    ].join("; ");

    const responsiveStyles = this.generateResponsiveStyles(data.rows || []);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  ${responsiveStyles ? `<style>\n${responsiveStyles}\n</style>` : ""}
</head>
<body style="${bodyStyle}">
  <div style="${wrapperStyle}">
    ${this.generateHTML(data)}
  </div>
</body>
</html>`;
  }

  static generatePreviewHTML(data) {
    if (!data || !data.rows) return "";

    const globalStyles = data.globalSettings || {};
    const wrapperStyle = [
      `max-width: ${globalStyles.maxWidth || "1200px"}`,
      `padding: ${globalStyles.padding || "20px"}`,
      `background-color: ${globalStyles.backgroundColor || "#ffffff"}`,
      `font-family: ${globalStyles.fontFamily || "system-ui, -apple-system, sans-serif"}`,
      "margin: 0 auto",
    ].join("; ");

    const responsiveStyles = this.generateResponsiveStyles(data.rows || []);
    const styleBlock = responsiveStyles ? `<style>${responsiveStyles}</style>` : "";

    return `${styleBlock}<div style="${wrapperStyle}">${this._renderRows(data.rows)}</div>`;
  }

  static generateHTML(data) {
    if (!data || !data.rows) return "";
    return this._renderRows(data.rows);
  }

  static _renderRows(rows) {
    return rows
      .map((row) => {
        const rowCustomStyles = this.generateStyleString(row.styles || {});
        const numCols = row.columns?.length || 1;
        const pct = (100 / numCols).toFixed(4);
        const responsive = row.responsive;
        const cssClass = responsive
          ? getResponsiveClass(responsive.desktop, responsive.mobile)
          : "";

        const rowStyle = [
          "display: flex",
          "flex-wrap: wrap",
          rowCustomStyles,
        ]
          .filter(Boolean)
          .join("; ");

        const columns = row.columns
          .map((column) => {
            const colStyle = `flex: 0 0 ${pct}%; max-width: ${pct}%; min-width: 0; padding: 10px; box-sizing: border-box`;
            const elements = column.elements
              .map((element) => this._renderElement(element))
              .join("\n");
            return `<div style="${colStyle}">${elements}</div>`;
          })
          .join("\n");

        return `<div${cssClass ? ` class="${cssClass}"` : ""} style="${rowStyle}">${columns}</div>`;
      })
      .join("\n");
  }

  static _renderElement(element) {
    const styles = this.generateStyleString(element.styles || {});

    switch (element.type) {
      case "row": {
        const nestedColumns = element.columns || [];
        const numCols = nestedColumns.length;
        const pct = (100 / numCols).toFixed(4);
        const responsive = element.responsive;
        const cssClass = responsive
          ? getResponsiveClass(responsive.desktop, responsive.mobile)
          : "";

        const nestedRowStyle = [
          "display: flex",
          "flex-wrap: wrap",
          styles,
        ].filter(Boolean).join("; ");

        const nestedColumnsHTML = nestedColumns.map((col) => {
          const colStyle = `flex: 0 0 ${pct}%; max-width: ${pct}%; min-width: 0; padding: 10px; box-sizing: border-box`;
          const elements = (col.elements || [])
            .map((el) => this._renderElement(el))
            .join("\n");
          return `<div style="${colStyle}">${elements}</div>`;
        }).join("\n");

        return `<div${cssClass ? ` class="${cssClass}"` : ""} style="${nestedRowStyle}">${nestedColumnsHTML}</div>`;
      }

      case "text":
        return `<div style="${styles}">${element.content || ""}</div>`;

      case "heading": {
        const tag = element.tag || "h2";
        return `<${tag} style="${styles}">${element.content || ""}</${tag}>`;
      }

      case "image": {
        const attrs = this._renderAttributes(element.attributes);
        const imgStyle = styles
          ? `max-width: 100%; height: auto; ${styles}`
          : "max-width: 100%; height: auto";
        return `<img ${attrs} style="${imgStyle}">`;
      }

      case "button": {
        const href = element.attributes?.href || "#";
        const target = element.attributes?.target || "_self";
        const btnStyle = [
          "display: inline-block",
          "text-decoration: none",
          "cursor: pointer",
          styles,
        ]
          .filter(Boolean)
          .join("; ");
        return `<a href="${href}" target="${target}" style="${btnStyle}">${element.content || ""}</a>`;
      }

      case "link": {
        const href = element.attributes?.href || "#";
        const target = element.attributes?.target || "_blank";
        return `<a href="${href}" target="${target}" style="${styles}">${element.content || ""}</a>`;
      }

      case "video": {
        const src = element.attributes?.src || "";
        const containerStyle = [
          "position: relative",
          "padding-bottom: 56.25%",
          "height: 0",
          "overflow: hidden",
          styles,
        ]
          .filter(Boolean)
          .join("; ");
        const iframeStyle =
          "position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0";
        return `<div style="${containerStyle}"><iframe src="${src}" style="${iframeStyle}" allowfullscreen></iframe></div>`;
      }

      case "divider":
        return `<hr style="${styles}">`;

      case "spacer":
        return `<div style="${styles}"></div>`;

      case "list": {
        const tag = element.tag || "ul";
        const items = (element.content || "")
          .split("\n")
          .map((item) => `<li>${item.trim()}</li>`)
          .join("");
        return `<${tag} style="${styles}">${items}</${tag}>`;
      }

      case "table":
        return `<div style="overflow-x: auto;"><table style="${styles}">${element.content || ""}</table></div>`;

      case "html":
        return sanitizeHTML(element.content) || "";

      default:
        return `<div style="${styles}">${element.content || ""}</div>`;
    }
  }

  static _renderAttributes(attributes) {
    return Object.entries(attributes || {})
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
  }

  static generateStyleString(styles) {
    return Object.entries(styles || {})
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        if (
          typeof value === "number" &&
          (cssKey.includes("width") ||
            cssKey.includes("height") ||
            cssKey.includes("margin") ||
            cssKey.includes("padding"))
        ) {
          value = `${value}px`;
        }
        return `${cssKey}: ${value}`;
      })
      .join("; ");
  }

  static generateResponsiveStyles(rows) {
    const classes = new Set();

    const collectClasses = (items) => {
      for (const item of items) {
        const responsive = item.responsive;
        if (responsive && responsive.desktop !== responsive.mobile) {
          classes.add(getResponsiveClass(responsive.desktop, responsive.mobile));
        }
        // Check nested row elements inside columns
        if (item.columns) {
          for (const col of item.columns) {
            if (col.elements) {
              collectClasses(col.elements);
            }
          }
        }
      }
    };

    collectClasses(rows);

    if (classes.size === 0) return "";

    const rules = [];
    for (const cls of classes) {
      // Parse desktop and mobile from class name: mt-row-d{desktop}-m{mobile}
      const match = cls.match(/mt-row-d(\d+)-m(\d+)/);
      if (!match) continue;
      const mobile = parseInt(match[2], 10);
      const mobilePct = (100 / mobile).toFixed(4);
      rules.push(`  .${cls} > div { flex: 0 0 ${mobilePct}% !important; max-width: ${mobilePct}% !important; }`);
    }

    return `@media (max-width: ${BREAKPOINT}px) {\n${rules.join("\n")}\n}`;
  }

  static formatHTML(html, indent = "  ") {
    let result = "";
    let level = 0;
    const tokens = html.replace(/>\s*</g, ">\n<").split("\n");

    for (const token of tokens) {
      const trimmed = token.trim();
      if (!trimmed) continue;

      if (/^<\//.test(trimmed)) {
        level = Math.max(0, level - 1);
      }

      result += indent.repeat(level) + trimmed + "\n";

      if (
        /^<[^/!][^>]*[^/]>$/.test(trimmed) &&
        !/^<(img|br|hr|input|meta|link)\b/i.test(trimmed)
      ) {
        level++;
      }
    }

    return result.trim();
  }

  static downloadHTML(html, filename = "page.html") {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
