// export-utils.js
export class ExportUtils {
  static generateExportableHTML(data, styles = {}) {
    const cssRules = this.generateCSS(styles);
    const responsiveCSS = this.generateResponsiveCSS();

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Exported Page</title>
      <style>
        /* Reset CSS */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #333;
        }
        
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        
        /* Layout */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .row {
          display: flex;
          flex-wrap: wrap;
          margin: -1rem;
        }
        
        .column {
          flex: 1;
          padding: 1rem;
          min-width: 0;
        }
  
        /* Component Styles */
        .button {
          display: inline-block;
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: 4px;
          cursor: pointer;
        }
  
        .video-container {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
        }
  
        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
  
        /* Custom Styles */
        ${cssRules}
        
        /* Responsive Styles */
        ${responsiveCSS}
      </style>
  </head>
  <body>
      ${this.generateHTML(data)}
  </body>
  </html>`;
  }

  static generateHTML(data) {
    if (!data || !data.rows) return "";

    return data.rows
      .map((row) => {
        const columns = row.columns
          .map((column) => {
            const elements = column.elements
              .map((element) => {
                const elementStyles = this.generateInlineStyles(
                  element.styles || {}
                );

                switch (element.type) {
                  case "text":
                    return `<div style="${elementStyles}">${
                      element.content || ""
                    }</div>`;

                  case "heading":
                    const tag = element.tag || "h2";
                    return `<${tag} style="${elementStyles}">${
                      element.content || ""
                    }</${tag}>`;

                  case "image":
                    const imgAttrs = Object.entries(element.attributes || {})
                      .map(([key, value]) => `${key}="${value}"`)
                      .join(" ");
                    return `<img ${imgAttrs} style="${elementStyles}">`;

                  case "button":
                    const href = element.attributes?.href
                      ? `href="${element.attributes.href}"`
                      : "";
                    return `<a ${href} class="button" style="${elementStyles}">${
                      element.content || ""
                    }</a>`;

                  case "video":
                    return `
                  <div class="video-container" style="${elementStyles}">
                    <iframe src="${element.attributes?.src || ""}" 
                      frameborder="0" 
                      allowfullscreen>
                    </iframe>
                  </div>`;

                  case "divider":
                    return `<hr style="${elementStyles}">`;

                  case "spacer":
                    return `<div style="${elementStyles}"></div>`;

                  case "list":
                    const items = element.content
                      .split("\n")
                      .map((item) => `<li>${item.trim()}</li>`)
                      .join("");
                    return `<${element.tag} style="${elementStyles}">${items}</${element.tag}>`;

                  case "table":
                    return `
                  <div style="overflow-x: auto;">
                    <table style="${elementStyles}">${element.content}</table>
                  </div>`;

                  case "html":
                    return element.content || "";

                  default:
                    return `<div style="${elementStyles}">${
                      element.content || ""
                    }</div>`;
                }
              })
              .join("\n");

            return `<div class="column">${elements}</div>`;
          })
          .join("\n");

        return `<div class="container"><div class="row">${columns}</div></div>`;
      })
      .join("\n");
  }

  static generateInlineStyles(styles) {
    return Object.entries(styles)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join("; ");
  }

  static generateCSS(styles) {
    return Object.entries(styles)
      .map(([selector, rules]) => {
        const cssRules = Object.entries(rules)
          .map(([property, value]) => {
            const cssProperty = property
              .replace(/([A-Z])/g, "-$1")
              .toLowerCase();
            return `${cssProperty}: ${value};`;
          })
          .join("\n    ");

        return `${selector} {\n    ${cssRules}\n}`;
      })
      .join("\n\n");
  }

  static generateResponsiveCSS() {
    return `
        @media (max-width: 768px) {
          .row {
            flex-direction: column;
          }
          
          .column {
            flex: 0 0 100%;
          }
          
          [data-mobile-hide="true"] {
            display: none !important;
          }
        }
        
        @media (max-width: 480px) {
          .container {
            padding: 0 0.5rem;
          }
        }
      `;
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
