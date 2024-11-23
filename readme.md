# Web Page Builder

A modern, lightweight web page builder created with vanilla JavaScript and Web Components. This project aims to provide a drag-and-drop interface for building responsive web pages without dependencies.

## ⚠️ Project Status
This project is currently in early development and not ready for production use. Many features are still being implemented and the API is subject to change.

## 🌟 Features
- 📦 Zero dependencies
- 🎨 Drag and drop interface
- 🧩 Web Components architecture
- 📱 Responsive grid system
- 🎯 Component-based design
- 🔌 Extensible element system
- 📚 Multi-page management
- ↩️ Undo/Redo functionality
- 📱 Responsive preview (Desktop/Tablet/Mobile)
- 🔄 Local storage persistence
- 📋 Copy HTML/JSON output
- 🖼️ Visual page builder interface
- 🔌 Backend Integration API

## 🛠️ Element Types
- 📝 Text blocks
- 🎯 Headings (H1-H6)
- 🖼️ Images
- 🔘 Buttons
- 📊 Tables
- 📝 Lists
- 🎥 Videos
- ➖ Dividers
- ↕️ Spacers
- </> Custom HTML

## 🔌 Integration API
The page builder can be integrated with any backend system using our flexible integration API. It supports three modes of operation:

### Usage Modes
- **Local Mode**: Works completely client-side using localStorage (default)
- **API Mode**: Direct integration with a backend API
- **Hybrid Mode**: Combines local storage with backend synchronization

### Basic Usage
```html
<!-- Local Storage Only -->
<page-manager></page-manager>

<!-- With Backend Integration -->
<page-manager 
  api-endpoint="https://your-api.com/v1"
  api-key="your-api-key"
  mode="hybrid">
</page-manager>
```

### API Endpoints Required
For backend integration, implement these endpoints:
```javascript
GET    /api/pages      // List all pages
POST   /api/pages      // Create new page
GET    /api/pages/{id} // Get specific page
PUT    /api/pages/{id} // Update page
DELETE /api/pages/{id} // Delete page
```

### Data Format
```javascript
// Example page data structure
{
  "id": "page-123",
  "name": "Home Page",
  "lastModified": "2024-03-22T10:30:00Z",
  "content": {
    "rows": [
      {
        "id": "row-1",
        "type": "row-2",
        "columns": [
          {
            "id": "col-1",
            "elements": [/* elements data */]
          }
        ]
      }
    ]
  }
}
```

### Event System
Subscribe to builder events:
```javascript
const pageManager = document.querySelector('page-manager');

// Listen for changes
pageManager.addEventListener('contentChanged', (event) => {
  console.log('Content updated:', event.detail);
});

// Listen for saves
pageManager.addEventListener('pageSaved', (event) => {
  console.log('Page saved:', event.detail.page);
});

// Listen for errors
pageManager.addEventListener('saveError', (event) => {
  console.error('Save error:', event.detail.error);
});
```

### Custom Storage Adapters
Create custom storage adapters for different backends:
```javascript
class CustomStorageAdapter {
  async getPages() { /* ... */ }
  async savePage(pageData) { /* ... */ }
  async deletePage(pageId) { /* ... */ }
}

// Use custom adapter
const pageManager = document.querySelector('page-manager');
pageManager.setStorageAdapter(new CustomStorageAdapter());
```

## Installation
```bash
# Clone the repository
git clone https://github.com/carlosvidal/mtbuilder.git

# Navigate to the project directory
cd mtbuilder

# Open index.html in your browser
```

## Project Structure
```
.
├── css
├── js
│   ├── components
│   │   ├── editors
│   │   │   ├── base-element-editor.js
│   │   │   ├── button-editor.js
│   │   │   ├── divider-editor.js
│   │   │   ├── heading-editor.js
│   │   │   ├── html-editor.js
│   │   │   ├── image-editor.js
│   │   │   ├── list-editor.js
│   │   │   ├── spacer-editor.js
│   │   │   ├── table-editor.js
│   │   │   ├── text-editor.js
│   │   │   └── video-editor.js
│   │   ├── .DS_Store
│   │   ├── builder-canvas.js
│   │   ├── builder-sidebar.js
│   │   ├── canvas-view-switcher.js
│   │   ├── element-editor-factory.js
│   │   ├── element-editor.js
│   │   ├── page-builder-data-provider.js
│   │   ├── page-builder-events.js
│   │   ├── page-builder.js
│   │   ├── page-manager.js
│   │   └── register-editors.js
│   ├── utils
│   │   ├── canvas-storage.js
│   │   ├── export-utils.js
│   │   └── history.js
│   ├── .DS_Store
│   └── index.js
└── index.html
```

## 🚀 Demo
You can try out the live demo at: https://carlosvidal.github.io/mtbuilder/

## Contributing
As this project is in early development, contributions are welcome but please note that major changes to the architecture may still occur.

## License
[MIT License](LICENSE)

## Development Roadmap
- [x] Complete core builder functionality
- [x] Implement undo/redo system
- [x] Add backend integration API
- [ ] Add theme support
- [ ] Create comprehensive documentation
- [ ] Add unit tests
- [ ] Optimize performance
- [ ] Add more element types