# MT Builder

A lightweight, zero-dependency page builder using Web Components. Drag-and-drop interface for building responsive web pages. Works with any backend.

**[Live Demo](https://carlosvidal.github.io/mtbuilder/)** | **[Examples](https://carlosvidal.github.io/mtbuilder/examples/page-manager.html)**

## Features

- **Zero dependencies** — No React, no Vue, no jQuery. Under 35KB gzipped.
- **Web Components** — Standard Custom Elements with Shadow DOM. Works anywhere.
- **Two usage modes** — Standalone `<page-builder>` or full `<page-manager>` with page listing.
- **Event-driven API** — `builder:ready`, `builder:save`, `builder:content-changed` CustomEvents.
- **i18n built-in** — English, Spanish and French. Set via `lang` attribute.
- **XSS sanitized** — Built-in HTML sanitizer for user content.
- **Undo/Redo** — Full history stack with keyboard support.
- **Responsive preview** — Desktop, tablet and mobile preview modes.
- **10 element types** — Heading, text, image, button, table, list, video, divider, spacer, HTML.

## Quick Start

### Installation

```bash
git clone https://github.com/carlosvidal/mtbuilder.git
cd mtbuilder
npm install
npm run dev
```

### Standalone Builder (recommended for integration)

Use `<page-builder>` when your application manages pages externally (PHP, Rails, Django, etc.):

```html
<page-builder page-id="42" lang="es"></page-builder>

<script type="module">
  import "./dist/page-builder.js";

  const builder = document.querySelector("page-builder");

  // Load data when the builder is ready
  builder.addEventListener("builder:ready", () => {
    builder.setPageData(pageDataFromServer);
  });

  // Handle save
  builder.addEventListener("builder:save", async (e) => {
    await fetch(`/api/pages/${e.detail.pageId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(e.detail.data),
    });
  });

  // Optional: listen for content changes (autosave)
  builder.addEventListener("builder:content-changed", (e) => {
    console.log("Content changed:", e.detail.data);
  });
</script>
```

### Page Manager (built-in page management)

Use `<page-manager>` for a complete solution with page listing and localStorage:

```html
<page-manager lang="es"></page-manager>
<script type="module" src="./dist/page-builder.js"></script>
```

With backend API:

```html
<page-manager
  lang="en"
  api-endpoint="https://api.example.com/pages"
  api-key="your-key"
  mode="hybrid"
></page-manager>
```

## API Reference

### `<page-builder>` Attributes

| Attribute  | Description | Default |
|-----------|-------------|---------|
| `page-id` | Page identifier | `""` |
| `lang`    | Language (`en`, `es`, `fr`) | browser default |
| `mode`    | `"external"` (events only) or `"local"` (localStorage) | `"external"` |

### `<page-builder>` Methods

| Method | Description |
|--------|-------------|
| `setPageData(data)` | Load `{ rows, globalSettings }` into the editor |
| `getPageData()` | Returns current `{ rows, globalSettings }` |
| `save()` | Dispatches `builder:save` event with current data |

### `<page-builder>` Events

All events use `CustomEvent` with `bubbles: true, composed: true`.

| Event | Detail | When |
|-------|--------|------|
| `builder:ready` | `{ pageId }` | Editor is ready to receive data |
| `builder:save` | `{ pageId, data }` | User clicked Save or `save()` was called |
| `builder:content-changed` | `{ pageId, data }` | Content was modified in the editor |

### `<page-manager>` Attributes

| Attribute | Description | Default |
|-----------|-------------|---------|
| `lang` | Language (`en`, `es`, `fr`) | browser default |
| `api-endpoint` | Backend API URL | — (uses localStorage) |
| `api-key` | API authentication key | — |
| `mode` | `"local"`, `"api"`, `"hybrid"` | `"local"` |

### Data Format

```json
{
  "rows": [
    {
      "id": "row-1",
      "type": "row-2",
      "columns": [
        {
          "id": "col-1",
          "elements": [
            {
              "id": "el-1",
              "type": "heading",
              "content": "Hello World",
              "tagName": "h1",
              "styles": {}
            }
          ]
        }
      ],
      "styles": {}
    }
  ],
  "globalSettings": {
    "maxWidth": "1200px",
    "padding": "20px",
    "backgroundColor": "#ffffff",
    "fontFamily": "system-ui, -apple-system, sans-serif"
  }
}
```

### API Endpoints (for backend integration)

```
GET    /api/pages      — List all pages
POST   /api/pages      — Create new page
GET    /api/pages/{id} — Get specific page
PUT    /api/pages/{id} — Update page
DELETE /api/pages/{id} — Delete page
```

## Framework Integration

Since MT Builder uses standard Web Components, it works with any framework.

### React

```jsx
import { useRef, useEffect } from "react";
import "./dist/page-builder.js";

function PageEditor({ pageId, pageData, onSave }) {
  const ref = useRef(null);

  useEffect(() => {
    const builder = ref.current;
    const handleReady = () => builder.setPageData(pageData);
    const handleSave = (e) => onSave(e.detail.data);

    builder.addEventListener("builder:ready", handleReady);
    builder.addEventListener("builder:save", handleSave);

    return () => {
      builder.removeEventListener("builder:ready", handleReady);
      builder.removeEventListener("builder:save", handleSave);
    };
  }, [pageData, onSave]);

  return <page-builder ref={ref} page-id={pageId} lang="es" />;
}
```

### Vue 3

```vue
<template>
  <page-builder
    ref="builder"
    :page-id="pageId"
    lang="es"
    @builder:ready="onReady"
    @builder:save="onSave"
  />
</template>

<script setup>
import { ref } from "vue";
import "./dist/page-builder.js";

const props = defineProps(["pageId", "pageData"]);
const emit = defineEmits(["save"]);
const builder = ref(null);

function onReady() {
  builder.value.setPageData(props.pageData);
}

function onSave(e) {
  emit("save", e.detail.data);
}
</script>
```

Configure Vue to recognize the custom elements in `vite.config.js`:

```js
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) =>
            ["page-builder", "page-manager"].includes(tag),
        },
      },
    }),
  ],
});
```

## Adding Languages

1. Create `src/locales/{code}.json` following the existing structure
2. Add the locale code to `I18n.supportedLocales` in `src/js/utils/i18n.js`

## Development

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build to dist/
npm test           # Run tests (47 tests)
npm run lint       # Run ESLint
```

## Project Structure

```
mtbuilder/
├── src/
│   ├── js/
│   │   ├── components/
│   │   │   ├── editors/          # Element-specific editors
│   │   │   ├── builder-canvas.js # Main canvas with drag & drop
│   │   │   ├── builder-sidebar.js
│   │   │   ├── canvas-view-switcher.js
│   │   │   ├── page-builder.js   # Standalone builder component
│   │   │   └── page-manager.js   # Full page management
│   │   ├── utils/
│   │   │   ├── store.js          # State management
│   │   │   ├── event-bus.js      # Internal pub/sub
│   │   │   ├── history.js        # Undo/redo stack
│   │   │   ├── sanitize.js       # XSS protection
│   │   │   ├── i18n.js           # Internationalization
│   │   │   └── export-utils.js   # HTML/JSON export
│   │   └── index.js              # Entry point
│   └── locales/                  # en.json, es.json, fr.json
├── examples/
│   ├── page-manager.html         # Page manager demo
│   └── php-integration.html      # Standalone builder demo
├── tests/                        # Vitest tests
├── dist/                         # Built output
└── index.html                    # Project landing page
```

## License

[MIT License](LICENSE)
