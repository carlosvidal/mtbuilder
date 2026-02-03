// inline-editor.js
// Lightweight bubble-style WYSIWYG toolbar for contentEditable elements.
// Uses document.execCommand for basic formatting (bold, italic, underline, link, blockquote, fontSize).

export class InlineEditor {
  constructor(shadowRoot) {
    this.shadowRoot = shadowRoot;
    this.toolbar = null;
    this.activeElement = null;
    this._savedRange = null;
    this._linkMode = false;
    this._onSelectionChange = this._handleSelectionChange.bind(this);
    this._onScroll = this._positionToolbar.bind(this);
    this._onClickOutside = this._handleClickOutside.bind(this);
  }

  attach(element) {
    if (this.activeElement === element) return;
    if (this.activeElement) this.detach();

    this.activeElement = element;
    element.contentEditable = "true";
    element.focus();

    // Select all text
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    if (!this.toolbar) {
      this._createToolbar();
    }
    this._showButtonsPanel();
    this.toolbar.style.display = "flex";
    this._positionToolbar();
    this._updateButtonStates();

    document.addEventListener("selectionchange", this._onSelectionChange);
    const scrollParent = this.shadowRoot.querySelector(".canvas-content") || this.shadowRoot;
    if (scrollParent.addEventListener) {
      scrollParent.addEventListener("scroll", this._onScroll, { passive: true });
    }
    this.shadowRoot.addEventListener("mousedown", this._onClickOutside);
  }

  detach() {
    if (!this.activeElement) return null;

    const html = this.activeElement.innerHTML;
    this.activeElement.contentEditable = false;
    this.activeElement = null;
    this._savedRange = null;
    this._linkMode = false;

    if (this.toolbar) {
      this.toolbar.style.display = "none";
    }

    document.removeEventListener("selectionchange", this._onSelectionChange);
    const scrollParent = this.shadowRoot.querySelector(".canvas-content") || this.shadowRoot;
    if (scrollParent.removeEventListener) {
      scrollParent.removeEventListener("scroll", this._onScroll);
    }
    this.shadowRoot.removeEventListener("mousedown", this._onClickOutside);

    return html;
  }

  _handleClickOutside(e) {
    if (!this.activeElement) return;
    if (this.toolbar && this.toolbar.contains(e.target)) return;
    if (this.activeElement.contains(e.target)) return;
    const el = this.activeElement;
    const html = this.detach();
    if (this._onDetach) {
      this._onDetach(el, html);
    }
  }

  _createToolbar() {
    this.toolbar = document.createElement("div");
    this.toolbar.className = "inline-editor-toolbar";
    this.toolbar.style.display = "none";

    // --- Buttons panel (default view) ---
    this._buttonsPanel = document.createElement("div");
    this._buttonsPanel.className = "toolbar-buttons-panel";

    const buttons = [
      { command: "bold", label: "B", title: "Bold", style: "font-weight:bold" },
      { command: "italic", label: "I", title: "Italic", style: "font-style:italic" },
      { command: "underline", label: "U", title: "Underline", style: "text-decoration:underline" },
      { command: "createLink", label: "&#128279;", title: "Link", style: "" },
      { command: "formatBlock", label: "&#8220;", title: "Blockquote", value: "blockquote", style: "" },
    ];

    buttons.forEach(({ command, label, title, style, value }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerHTML = label;
      btn.title = title;
      if (style) btn.setAttribute("style", style);
      btn.dataset.command = command;
      if (value) btn.dataset.value = value;
      btn.addEventListener("mousedown", (e) => {
        e.preventDefault(); // Prevents focus from leaving contentEditable
        e.stopPropagation();
      });
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (command === "createLink") {
          this._showLinkPanel();
        } else {
          // Selection is kept alive by mousedown preventDefault — just execute
          this._execCommand(command, value);
        }
      });
      this._buttonsPanel.appendChild(btn);
    });

    // Font size selector
    const sizeSelect = document.createElement("select");
    sizeSelect.title = "Font size";
    sizeSelect.className = "toolbar-font-size";
    [12, 14, 16, 18, 20, 24, 28, 32, 36, 48].forEach((size) => {
      const opt = document.createElement("option");
      opt.value = size;
      opt.textContent = `${size}px`;
      sizeSelect.appendChild(opt);
    });
    sizeSelect.value = "16";
    sizeSelect.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      // Save selection before the <select> dropdown steals focus
      this._saveSelection();
    });
    sizeSelect.addEventListener("change", (e) => {
      e.stopPropagation();
      // Restore selection that was saved on mousedown, then apply size
      this._restoreSelection();
      this._setFontSize(e.target.value);
    });
    this._buttonsPanel.appendChild(sizeSelect);

    this.toolbar.appendChild(this._buttonsPanel);

    // --- Link panel (shown when link button is clicked) ---
    this._linkPanel = document.createElement("div");
    this._linkPanel.className = "toolbar-link-panel";
    this._linkPanel.style.display = "none";

    this._linkInput = document.createElement("input");
    this._linkInput.type = "text";
    this._linkInput.className = "toolbar-link-input";
    this._linkInput.placeholder = "https://";
    this._linkInput.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
    this._linkInput.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        this._applyLink();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this._showButtonsPanel();
      }
    });

    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.innerHTML = "&#10003;"; // checkmark
    applyBtn.title = "Aplicar enlace";
    applyBtn.className = "link-apply-btn";
    applyBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    applyBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._applyLink();
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.innerHTML = "&#10005;"; // X
    removeBtn.title = "Eliminar enlace";
    removeBtn.className = "link-remove-btn";
    removeBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._removeLink();
    });

    this._linkPanel.appendChild(this._linkInput);
    this._linkPanel.appendChild(applyBtn);
    this._linkPanel.appendChild(removeBtn);
    this.toolbar.appendChild(this._linkPanel);

    this.shadowRoot.appendChild(this.toolbar);
  }

  _saveSelection() {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0) {
      this._savedRange = selection.getRangeAt(0).cloneRange();
    }
  }

  _restoreSelection() {
    if (!this._savedRange) return false;
    if (this.activeElement) {
      this.activeElement.focus();
    }
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(this._savedRange);
    return true;
  }

  _showLinkPanel() {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // Check if cursor is inside an existing link
    const node = selection.anchorNode;
    const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    const parentA = el?.closest?.("a");
    let existingUrl = parentA ? (parentA.getAttribute("href") || "") : "";

    if (selection.isCollapsed) {
      if (parentA) {
        // Cursor inside existing link — select the whole link for editing
        const range = document.createRange();
        range.selectNodeContents(parentA);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // No selection and not in a link — select all text in the element
        if (this.activeElement) {
          const range = document.createRange();
          range.selectNodeContents(this.activeElement);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          return;
        }
      }
    }

    // Save the selection before switching to link panel (input will steal focus)
    this._saveSelection();

    this._buttonsPanel.style.display = "none";
    this._linkPanel.style.display = "flex";
    this._linkInput.value = existingUrl;
    this._linkMode = true;

    requestAnimationFrame(() => {
      this._linkInput.focus();
      this._linkInput.select();
    });
  }

  _showButtonsPanel() {
    this._linkPanel.style.display = "none";
    this._buttonsPanel.style.display = "flex";
    this._linkMode = false;

    if (this.activeElement) {
      this.activeElement.focus();
      this._restoreSelection();
    }
  }

  _applyLink() {
    const url = this._linkInput.value.trim();
    if (!url) {
      this._showButtonsPanel();
      return;
    }

    // Restore selection inside contentEditable, then create the link
    if (this.activeElement) {
      this.activeElement.focus();
    }
    this._restoreSelection();
    document.execCommand("createLink", false, url);

    // Set target="_blank" on the newly created link
    if (this.activeElement) {
      const links = this.activeElement.querySelectorAll("a");
      links.forEach((a) => {
        if (a.getAttribute("href") === url) {
          a.setAttribute("target", "_blank");
        }
      });
    }

    this._savedRange = null;
    this._showButtonsPanel();
    this._updateButtonStates();
  }

  _removeLink() {
    if (this.activeElement) {
      this.activeElement.focus();
    }
    this._restoreSelection();
    document.execCommand("unlink", false, null);
    this._savedRange = null;
    this._showButtonsPanel();
    this._updateButtonStates();
  }

  _positionToolbar() {
    if (!this.toolbar || !this.activeElement) return;

    const elRect = this.activeElement.getBoundingClientRect();
    const hostEl = this.shadowRoot.host;
    const hostRect = hostEl ? hostEl.getBoundingClientRect() : { top: 0, left: 0 };

    const toolbarHeight = this.toolbar.offsetHeight || 36;
    const top = elRect.top - hostRect.top - toolbarHeight - 8;
    const left = elRect.left - hostRect.left;

    this.toolbar.style.top = `${Math.max(0, top)}px`;
    this.toolbar.style.left = `${left}px`;
  }

  _execCommand(command, value) {
    // execCommand works on the current live selection.
    // mousedown preventDefault on toolbar buttons keeps focus and selection
    // in the contentEditable, so we just execute directly.
    if (command === "formatBlock") {
      const current = document.queryCommandValue("formatBlock");
      if (current === "blockquote") {
        document.execCommand("formatBlock", false, "p");
      } else {
        document.execCommand("formatBlock", false, value || "blockquote");
      }
    } else {
      document.execCommand(command, false, value || null);
    }

    this._updateButtonStates();
    if (this.activeElement) {
      this.activeElement.focus();
    }
  }

  _setFontSize(sizePx) {
    // Selection was restored by the change handler before calling this method.
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return; // Nothing selected — do nothing

    // Use execCommand("fontSize") with a placeholder, then replace
    // the generated <font> tags with proper <span style="font-size:...">
    document.execCommand("fontSize", false, "7");

    if (this.activeElement) {
      const fonts = this.activeElement.querySelectorAll('font[size="7"]');
      fonts.forEach((font) => {
        const span = document.createElement("span");
        span.style.fontSize = `${sizePx}px`;
        span.innerHTML = font.innerHTML;
        font.replaceWith(span);
      });
    }

    this._updateButtonStates();
    if (this.activeElement) {
      this.activeElement.focus();
    }
  }

  _handleSelectionChange() {
    if (!this.activeElement || this._linkMode) return;
    this._updateButtonStates();
  }

  _updateButtonStates() {
    if (!this.toolbar || !this._buttonsPanel) return;

    const commands = ["bold", "italic", "underline"];
    commands.forEach((cmd) => {
      const btn = this._buttonsPanel.querySelector(`[data-command="${cmd}"]`);
      if (btn) {
        btn.classList.toggle("active", document.queryCommandState(cmd));
      }
    });

    // Link state
    const linkBtn = this._buttonsPanel.querySelector('[data-command="createLink"]');
    if (linkBtn) {
      const selection = document.getSelection();
      let isLink = false;
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode;
        const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        isLink = !!el?.closest?.("a");
      }
      linkBtn.classList.toggle("active", isLink);
    }

    // Blockquote state
    const bqBtn = this._buttonsPanel.querySelector('[data-command="formatBlock"]');
    if (bqBtn) {
      const current = document.queryCommandValue("formatBlock");
      bqBtn.classList.toggle("active", current === "blockquote");
    }

    // Font size
    const sizeSelect = this._buttonsPanel.querySelector(".toolbar-font-size");
    if (sizeSelect) {
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        const node = selection.anchorNode;
        const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        if (el) {
          const computed = window.getComputedStyle(el).fontSize;
          const size = parseInt(computed);
          if (size && sizeSelect.querySelector(`option[value="${size}"]`)) {
            sizeSelect.value = size;
          }
        }
      }
    }
  }

  destroy() {
    this.detach();
    if (this.toolbar && this.toolbar.parentNode) {
      this.toolbar.parentNode.removeChild(this.toolbar);
    }
    this.toolbar = null;
  }
}
