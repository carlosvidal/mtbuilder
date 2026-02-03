# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MT Builder is a zero-dependency drag-and-drop page builder built with vanilla JavaScript and native Web Components. It produces a UMD/ESM library (`dist/page-builder.js`) consumable via `<page-manager>` custom element.

## Commands

```bash
npm run dev        # Vite dev server with HMR (localhost:5173)
npm run build      # Production build (Terser minified)
npm run build:dev  # Unminified development build
npm run preview    # Preview production build
npm run clean      # Clean dist/
npm run analyze    # Build with analysis mode
npm run lint       # ESLint check
npm run lint:fix   # ESLint auto-fix
npm test           # Run all tests (vitest)
npm run test:watch # Run tests in watch mode
```

Run a single test file: `npx vitest run tests/store.test.js`

## Architecture

### Component Hierarchy

```
<page-manager>           — Root. Page listing, creation, API integration
  └─ <page-builder>      — Layout shell (sidebar + canvas grid)
       ├─ <builder-sidebar>       — Element palette, row templates, settings, editors
       └─ <canvas-view-switcher>  — Design / Preview / HTML / JSON views
            └─ <builder-canvas>   — Core: rendering, drag-and-drop, selection, undo/redo
```

All components use Shadow DOM for style encapsulation. Styles are currently inline (no external CSS files).

### State & Communication

- **Store** (`src/js/utils/store.js`) — Singleton with subscribe/setState pattern. Single source of truth for rows, selected element, global settings, pages.
- **EventBus** (`src/js/utils/event-bus.js`) — Map-based pub/sub. Decouples components. Key events: `rowDeleted`, `rowDuplicated`, `elementSelected`, `historyChange`, `contentChanged`.
- **History** (`src/js/utils/history.js`) — Stack-based undo/redo (max 50 states). Integrates with Store and EventBus.

State flows unidirectionally: user action → Store update → subscribers re-render. EventBus handles cross-cutting domain events.

### Element Editors (Factory Pattern)

`ElementEditorFactory` maps element types to editors. All editors extend `BaseElementEditor` (`src/js/components/editors/base-element-editor.js`). Supported types: heading, text, image, button, link, table, list, video, divider, spacer, html, row.

To add a new element type: create an editor in `src/js/components/editors/`, extend `BaseElementEditor`, register it in `src/js/components/register-editors.js`.

### Data Persistence

`PageBuilderDataProvider` supports three modes set via `<page-manager mode="...">`:
- **local** (default) — localStorage via `canvas-storage.js`
- **api** — REST endpoints (`GET/POST/PUT/DELETE /api/pages[/{id}]`)
- **hybrid** — API with localStorage fallback

LocalStorage keys: `pageBuilderPages` (metadata), `pageBuilder_canvas_{pageId}` (content).

### Internationalization

`src/js/utils/i18n.js` — Singleton with browser language detection, localStorage persistence. Translation files in `src/locales/` (en, es, fr). Supports nested keys, placeholders (`t('key', {param})`), pluralization (`p('key', count)`), and Intl formatting.

### Build Configuration

Vite 5 with Rollup. Entry: `src/js/index.js`. Output: UMD library named `PageBuilder`. File watch uses polling for compatibility. Path aliases defined in `jsconfig.json`: `@/*` → `src/*`, `@js/*` → `src/js/*`, `@utils/*` → `src/js/utils/*`, `@components/*` → `src/js/components/*`.

## Data Model

Rows contain columns, columns contain elements:
```
rows[] → { id, type: "row-1"|"row-2"|"row-3"|"row-4", columns[] → { id, elements[] → { id, type, content, styles } } }
```

`globalSettings` holds page-wide defaults (maxWidth, padding, backgroundColor, fontFamily).

## HTML Entry

```html
<page-manager api-endpoint="..." api-key="..." mode="local" lang="en"></page-manager>
```

The library auto-initializes on DOMContentLoaded via `app-init.js`.

## npm Publishing

Package: `@carlosvidalperu/mtbuilder` — https://www.npmjs.com/package/@carlosvidalperu/mtbuilder

```bash
# Publish workflow (requires clean git working directory):
git add . && git commit -m "description"

# Bump version + publish (2FA OTP required):
npm version patch && npm publish --otp=CODE   # bug fix: 1.0.0 → 1.0.1
npm version minor && npm publish --otp=CODE   # new feature: 1.0.x → 1.1.0
npm version major && npm publish --otp=CODE   # breaking change: 1.x.x → 2.0.0
```

`prepublishOnly` script runs `npm run build` automatically before publish. The `files` field limits the package to `dist/` and `src/locales/`.
