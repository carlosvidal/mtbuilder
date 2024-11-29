// builder-icon.js
class BuilderIcon extends HTMLElement {
  static get observedAttributes() {
    return ["name", "size", "color"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get iconName() {
    return this.getAttribute("name") || "help-circle";
  }

  get size() {
    return this.getAttribute("size") || "20";
  }

  get color() {
    return this.getAttribute("color") || "currentColor";
  }

  render() {
    // Definir el mapa de iconos usando las funciones de renderizado de Lucide
    const icons = {
      // Iconos de layout
      "row-1": {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
        ],
      },
      "row-2": {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "line", x1: "12", y1: "3", x2: "12", y2: "21" },
        ],
      },
      "row-3": {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "line", x1: "9", y1: "3", x2: "9", y2: "21" },
          { type: "line", x1: "15", y1: "3", x2: "15", y2: "21" },
        ],
      },

      "row-4": {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "line", x1: "7.5", y1: "3", x2: "7.5", y2: "21" },
          { type: "line", x1: "12", y1: "3", x2: "12", y2: "21" },
          { type: "line", x1: "16.5", y1: "3", x2: "16.5", y2: "21" },
        ],
      },

      // Iconos de elementos
      heading: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M4 12h8" },
          { type: "path", d: "M4 18V6" },
          { type: "path", d: "M12 18V6" },
          { type: "path", d: "m17 12 3-2v8" },
        ],
      },
      text: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "polyline", points: "4 7 4 4 20 4 20 7" },
          { type: "line", x1: "9", y1: "20", x2: "15", y2: "20" },
          { type: "line", x1: "12", y1: "4", x2: "12", y2: "20" },
        ],
      },
      image: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "circle", cx: "9", cy: "9", r: "2" },
          { type: "path", d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" },
        ],
      },
      list: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "line", x1: "8", y1: "6", x2: "21", y2: "6" },
          { type: "line", x1: "8", y1: "12", x2: "21", y2: "12" },
          { type: "line", x1: "8", y1: "18", x2: "21", y2: "18" },
          { type: "line", x1: "3", y1: "6", x2: "3.01", y2: "6" },
          { type: "line", x1: "3", y1: "12", x2: "3.01", y2: "12" },
          { type: "line", x1: "3", y1: "18", x2: "3.01", y2: "18" },
        ],
      },
      video: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "path", d: "m10 8 6 4-6 4Z" },
        ],
      },
      divider: {
        viewBox: "0 0 24 24",
        elements: [{ type: "line", x1: "3", y1: "12", x2: "21", y2: "12" }],
      },
      spacer: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "line", x1: "12", y1: "20", x2: "12", y2: "4" },
          { type: "line", x1: "4", y1: "12", x2: "20", y2: "12" },
        ],
      },

      // Iconos de control
      back: {
        viewBox: "0 0 24 24",
        elements: [{ type: "polyline", points: "15 18 9 12 15 6" }],
      },
      close: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "line", x1: "18", y1: "6", x2: "6", y2: "18" },
          { type: "line", x1: "6", y1: "6", x2: "18", y2: "18" },
        ],
      },
      move: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "polyline", points: "5 9 2 12 5 15" },
          { type: "polyline", points: "9 5 12 2 15 5" },
          { type: "polyline", points: "15 19 12 22 9 19" },
          { type: "polyline", points: "19 9 22 12 19 15" },
          { type: "line", x1: "2", y1: "12", x2: "22", y2: "12" },
          { type: "line", x1: "12", y1: "2", x2: "12", y2: "22" },
        ],
      },
      edit: {
        viewBox: "0 0 24 24",
        elements: [
          {
            type: "path",
            d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z",
          },
        ],
      },
      delete: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M3 6h18" },
          { type: "path", d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" },
          { type: "path", d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" },
        ],
      },
      undo: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M3 7v6h6" },
          { type: "path", d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" },
        ],
      },
      redo: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M21 7v6h-6" },
          { type: "path", d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" },
        ],
      },
      copy: {
        viewBox: "0 0 24 24",
        elements: [
          {
            type: "rect",
            width: "14",
            height: "14",
            x: "8",
            y: "8",
            rx: "2",
            ry: "2",
          },
          {
            type: "path",
            d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
          },
        ],
      },
      plus: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "line", x1: "12", y1: "5", x2: "12", y2: "19" },
          { type: "line", x1: "5", y1: "12", x2: "19", y2: "12" },
        ],
      },
      minus: {
        viewBox: "0 0 24 24",
        elements: [{ type: "line", x1: "5", y1: "12", x2: "19", y2: "12" }],
      },
      desktop: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "20", height: "14", x: "2", y: "3", rx: "2" },
          { type: "line", x1: "8", y1: "21", x2: "16", y2: "21" },
          { type: "line", x1: "12", y1: "17", x2: "12", y2: "21" },
        ],
      },
      tablet: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "16", height: "20", x: "4", y: "2", rx: "2" },
          { type: "line", x1: "12", y1: "18", x2: "12.01", y2: "18" },
        ],
      },
      mobile: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "14", height: "20", x: "5", y: "2", rx: "2" },
          { type: "path", d: "M12 18h.01" },
        ],
      },
      button: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M9 17H7A5 5 0 0 1 7 7h2" },
          { type: "path", d: "M15 7h2a5 5 0 1 1 0 10h-2" },
          { type: "line", x1: "8", x2: "16", y1: "12", y2: "12" },
        ],
      },
      download: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" },
          { type: "polyline", points: "7 10 12 15 17 10" },
          { type: "line", x1: "12", y1: "15", x2: "12", y2: "3" },
        ],
      },
      // Actualizar el icono de tabla para usar rect y paths
      table: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2" },
          { type: "path", d: "M12 3v18" },
          { type: "path", d: "M3 9h18" },
          { type: "path", d: "M3 15h18" },
        ],
      },

      // Mantener los demás iconos pero convertirlos al nuevo formato
      home: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { type: "path", d: "M9 22V12h6v10" },
        ],
      },
      html: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "polyline", points: "16 18 22 12 16 6" },
          { type: "polyline", points: "8 6 2 12 8 18" },
        ],
      },
      css: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { type: "path", d: "M9 22V12h6v10" },
        ],
      },
      javascript: {
        viewBox: "0 0 24 24",
        elements: [
          { type: "path", d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { type: "path", d: "M9 22V12h6v10" },
          { type: "path", d: "M13 17v4" },
          { type: "path", d: "M17 17v4" },
          { type: "path", d: "M21 17v4" },
        ],
      },
    };

    const icon = icons[this.iconName];
    if (!icon) return;

    this.shadowRoot.innerHTML = `
        <style>
        :host {
          display: inline-flex;
          width: ${this.size}px;
          height: ${this.size}px;
        }
        svg {
          width: 100%;
          height: 100%;
          stroke: ${this.color};
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
      </style>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="${icon.viewBox}"
        aria-hidden="true"
      >
        ${icon.elements
          .map((elem) => {
            switch (elem.type) {
              case "path":
                return `<path d="${elem.d}" />`;
              case "line":
                return `<line x1="${elem.x1}" y1="${elem.y1}" x2="${elem.x2}" y2="${elem.y2}" />`;
              case "rect":
                return `<rect width="${elem.width}" height="${
                  elem.height
                }" x="${elem.x}" y="${elem.y}" rx="${elem.rx || 0}" />`;
              case "circle":
                return `<circle cx="${elem.cx}" cy="${elem.cy}" r="${elem.r}" />`;
              case "polyline":
                return `<polyline points="${elem.points}" />`;
              default:
                return "";
            }
          })
          .join("")}
      </svg>
      `;
  }
}

customElements.define("builder-icon", BuilderIcon);
export { BuilderIcon };
