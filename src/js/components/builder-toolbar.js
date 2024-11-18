class BuilderToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
            <div>Builder Toolbar</div>
        `;
  }
}

customElements.define("builder-toolbar", BuilderToolbar);
export { BuilderToolbar };
