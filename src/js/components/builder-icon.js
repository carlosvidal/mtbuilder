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
        path: "M3 3h18v18H3z",
      },
      "row-2": {
        viewBox: "0 0 24 24",
        path: "M3 3h8v18H3zM13 3h8v18h-8z",
      },
      "row-3": {
        viewBox: "0 0 24 24",
        path: "M3 3h5v18H3zM9.5 3h5v18h-5zM16 3h5v18h-5z",
      },
      "row-4": {
        viewBox: "0 0 24 24",
        path: "M3 3h3.5v18H3zM8 3h3.5v18H8zM13 3h3.5v18H13zM18 3h3v18h-3z",
      },
      // Iconos de elementos
      heading: {
        viewBox: "0 0 24 24",
        path: "M6 4v6h8V4h2v14h-2v-6H6v6H4V4z",
      },
      text: {
        viewBox: "0 0 24 24",
        path: "M13 6v15h-2V6H5V4h14v2z",
      },
      image: {
        viewBox: "0 0 24 24",
        path: "M21 3H3C2 3 1 4 1 5v14c0 1.1.9 2 2 2h18c1 0 2-1 2-2V5c0-1-1-2-2-2zM5 17l4-4 2 2 6-6 3 3v5H5z",
      },
      button: {
        viewBox: "0 0 24 24",
        path: "M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z",
      },
      table: {
        viewBox: "0 0 24 24",
        path: "M3 3v18h18V3H3zm6 4h4v4H9V7zm0 6h4v4H9v-4zm-6-6h4v4H3V7zm0 6h4v4H3v-4zm12 4v-4h4v4h-4zm0-6V7h4v4h-4z",
      },
      list: {
        viewBox: "0 0 24 24",
        path: "M3 12h.01 M3 18h.01 M3 6h.01 M8 12h13 M8 18h13 M8 6h13",
      },
      video: {
        viewBox: "0 0 24 24",
        path: "M8 5v14l11-7z",
      },
      divider: {
        viewBox: "0 0 24 24",
        path: "M3 12h18",
      },
      spacer: {
        viewBox: "0 0 24 24",
        path: "M12 20V4M4 12h16",
      },
      html: {
        viewBox: "0 0 24 24",
        path: "M16 18L22 12L16 6M8 6L2 12L8 18",
      },
      // Iconos de control
      home: {
        viewBox: "0 0 24 24",
        path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
      },
      back: {
        viewBox: "0 0 24 24",
        path: "M15 18l-6-6l6-6",
      },
      close: {
        viewBox: "0 0 24 24",
        path: "M18 6L6 18M6 6l12 12",
      },
      move: {
        viewBox: "0 0 24 24",
        path: "M5 9l-3 3l3 3M9 5l3-3l3 3M15 19l-3 3l-3-3M19 9l3 3l-3 3M2 12h20M12 2v20",
      },
      edit: {
        viewBox: "0 0 24 24",
        path: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5L2 22l1.5-5.5L17 3z",
      },
      delete: {
        viewBox: "0 0 24 24",
        path: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
      },
      undo: {
        viewBox: "0 0 24 24",
        path: "M3 7v6h6 M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",
      },
      redo: {
        viewBox: "0 0 24 24",
        path: "M21 7v6h-6 M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",
      },
      desktop: {
        viewBox: "0 0 24 24",
        path: "M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM4 16V5h16v11H4z",
      },
      tablet: {
        viewBox: "0 0 24 24",
        path: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
      },
      mobile: {
        viewBox: "0 0 24 24",
        path: "M15 2H9c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z",
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
          <path d="${icon.path}"></path>
        </svg>
      `;
  }
}

customElements.define("builder-icon", BuilderIcon);
export { BuilderIcon };
