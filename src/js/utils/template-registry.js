// template-registry.js

const templates = new Map();

export class TemplateRegistry {
  static register(id, template) {
    templates.set(id, template);
  }

  static unregister(id) {
    templates.delete(id);
  }

  static get(id) {
    return templates.get(id);
  }

  static getAll() {
    return Array.from(templates.values());
  }

  static getByCategory(category) {
    return Array.from(templates.values()).filter(
      (t) => t.category === category
    );
  }

  static getCategories() {
    const cats = new Set();
    for (const t of templates.values()) {
      cats.add(t.category || "general");
    }
    return Array.from(cats);
  }
}

// --- Built-in templates ---

TemplateRegistry.register("blank", {
  id: "blank",
  name: "Blank Page",
  nameKey: "templates.blank.name",
  description: "Start from scratch",
  descriptionKey: "templates.blank.description",
  category: "basic",
  thumbnail: null,
  data: {
    rows: [],
    globalSettings: {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
});

TemplateRegistry.register("hero-landing", {
  id: "hero-landing",
  name: "Hero Landing",
  nameKey: "templates.heroLanding.name",
  description: "Hero section with CTA button",
  descriptionKey: "templates.heroLanding.description",
  category: "landing",
  thumbnail: null,
  data: {
    rows: [
      {
        id: "hero-row",
        type: "row-1",
        columns: [
          {
            id: "hero-col",
            elements: [
              {
                id: "hero-heading",
                type: "heading",
                tag: "h1",
                content: "Welcome to Our Platform",
                styles: {
                  fontSize: "48px",
                  fontWeight: "700",
                  textAlign: "center",
                  color: "#1a1a2e",
                  marginBottom: "16px",
                },
              },
              {
                id: "hero-text",
                type: "text",
                content:
                  "Build beautiful pages effortlessly with our drag-and-drop builder. No coding required.",
                styles: {
                  fontSize: "20px",
                  textAlign: "center",
                  color: "#555",
                  maxWidth: "600px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                  marginBottom: "32px",
                },
              },
              {
                id: "hero-button",
                type: "button",
                content: "Get Started",
                attributes: { href: "#", target: "_self" },
                styles: {
                  backgroundColor: "#2196F3",
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontSize: "18px",
                  fontWeight: "600",
                  border: "none",
                },
                wrapperStyles: { justifyContent: "center" },
              },
            ],
          },
        ],
        styles: {
          padding: "80px 20px",
          backgroundColor: "#f0f4ff",
        },
      },
      {
        id: "features-row",
        type: "row-3",
        responsive: { desktop: 3, mobile: 1 },
        columns: [
          {
            id: "feat-col-1",
            elements: [
              {
                id: "feat-1-title",
                type: "heading",
                tag: "h3",
                content: "Easy to Use",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "feat-1-text",
                type: "text",
                content:
                  "Drag and drop elements to build your perfect page in minutes.",
                styles: {
                  textAlign: "center",
                  color: "#666",
                  lineHeight: "1.6",
                },
              },
            ],
          },
          {
            id: "feat-col-2",
            elements: [
              {
                id: "feat-2-title",
                type: "heading",
                tag: "h3",
                content: "Fully Responsive",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "feat-2-text",
                type: "text",
                content:
                  "Your pages look great on desktop, tablet, and mobile automatically.",
                styles: {
                  textAlign: "center",
                  color: "#666",
                  lineHeight: "1.6",
                },
              },
            ],
          },
          {
            id: "feat-col-3",
            elements: [
              {
                id: "feat-3-title",
                type: "heading",
                tag: "h3",
                content: "No Code Required",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "feat-3-text",
                type: "text",
                content:
                  "Visual editing with instant preview. Export clean HTML anytime.",
                styles: {
                  textAlign: "center",
                  color: "#666",
                  lineHeight: "1.6",
                },
              },
            ],
          },
        ],
        styles: { padding: "60px 20px" },
      },
    ],
    globalSettings: {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
});

TemplateRegistry.register("product-page", {
  id: "product-page",
  name: "Product Page",
  nameKey: "templates.productPage.name",
  description: "Product showcase with image and details",
  descriptionKey: "templates.productPage.description",
  category: "ecommerce",
  thumbnail: null,
  data: {
    rows: [
      {
        id: "product-row",
        type: "row-2",
        responsive: { desktop: 2, mobile: 1 },
        columns: [
          {
            id: "product-img-col",
            elements: [
              {
                id: "product-img",
                type: "image",
                attributes: {
                  src: "https://placehold.co/600x400/e8f4f8/1a1a2e?text=Product+Image",
                  alt: "Product image",
                },
                styles: { borderRadius: "8px" },
              },
            ],
          },
          {
            id: "product-info-col",
            elements: [
              {
                id: "product-title",
                type: "heading",
                tag: "h1",
                content: "Product Name",
                styles: {
                  fontSize: "32px",
                  color: "#1a1a2e",
                  marginBottom: "8px",
                },
              },
              {
                id: "product-price",
                type: "heading",
                tag: "h2",
                content: "$99.99",
                styles: {
                  fontSize: "28px",
                  color: "#2196F3",
                  marginBottom: "16px",
                  fontWeight: "700",
                },
              },
              {
                id: "product-desc",
                type: "text",
                content:
                  "This is a detailed description of the product. Highlight key features, materials, dimensions, and any other information that helps the customer make a purchase decision.",
                styles: {
                  color: "#555",
                  lineHeight: "1.7",
                  marginBottom: "24px",
                },
              },
              {
                id: "product-cta",
                type: "button",
                content: "Add to Cart",
                attributes: { href: "#", target: "_self" },
                styles: {
                  backgroundColor: "#4CAF50",
                  color: "#ffffff",
                  padding: "14px 32px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  border: "none",
                },
              },
            ],
          },
        ],
        styles: { padding: "40px 20px", gap: "40px" },
      },
      {
        id: "details-row",
        type: "row-1",
        columns: [
          {
            id: "details-col",
            elements: [
              {
                id: "details-divider",
                type: "divider",
                styles: {
                  borderColor: "#e0e0e0",
                  borderWidth: "1px",
                  margin: "20px 0",
                },
              },
              {
                id: "details-heading",
                type: "heading",
                tag: "h2",
                content: "Product Details",
                styles: {
                  fontSize: "24px",
                  color: "#1a1a2e",
                  marginBottom: "16px",
                },
              },
              {
                id: "details-list",
                type: "list",
                tag: "ul",
                content:
                  "Premium quality materials\nHandcrafted with attention to detail\nAvailable in multiple colors\n30-day money-back guarantee\nFree shipping on orders over $50",
                styles: {
                  color: "#555",
                  lineHeight: "2",
                  fontSize: "16px",
                },
              },
            ],
          },
        ],
        styles: { padding: "20px" },
      },
    ],
    globalSettings: {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
});

TemplateRegistry.register("about-page", {
  id: "about-page",
  name: "About Page",
  nameKey: "templates.aboutPage.name",
  description: "Company or personal about page",
  descriptionKey: "templates.aboutPage.description",
  category: "basic",
  thumbnail: null,
  data: {
    rows: [
      {
        id: "about-hero",
        type: "row-1",
        columns: [
          {
            id: "about-hero-col",
            elements: [
              {
                id: "about-title",
                type: "heading",
                tag: "h1",
                content: "About Us",
                styles: {
                  fontSize: "42px",
                  textAlign: "center",
                  color: "#1a1a2e",
                  marginBottom: "16px",
                },
              },
              {
                id: "about-subtitle",
                type: "text",
                content:
                  "We are passionate about creating tools that empower people to build beautiful things on the web.",
                styles: {
                  fontSize: "20px",
                  textAlign: "center",
                  color: "#666",
                  maxWidth: "700px",
                  margin: "0 auto",
                  lineHeight: "1.6",
                },
              },
            ],
          },
        ],
        styles: { padding: "60px 20px", backgroundColor: "#fafafa" },
      },
      {
        id: "about-content",
        type: "row-2",
        responsive: { desktop: 2, mobile: 1 },
        columns: [
          {
            id: "about-col-1",
            elements: [
              {
                id: "about-mission-title",
                type: "heading",
                tag: "h2",
                content: "Our Mission",
                styles: { color: "#1a1a2e", marginBottom: "12px" },
              },
              {
                id: "about-mission-text",
                type: "text",
                content:
                  "We believe that everyone should have access to professional-quality web design tools. Our mission is to democratize web creation by making it accessible, intuitive, and fun.",
                styles: { color: "#555", lineHeight: "1.7" },
              },
            ],
          },
          {
            id: "about-col-2",
            elements: [
              {
                id: "about-values-title",
                type: "heading",
                tag: "h2",
                content: "Our Values",
                styles: { color: "#1a1a2e", marginBottom: "12px" },
              },
              {
                id: "about-values-list",
                type: "list",
                tag: "ul",
                content:
                  "Simplicity in design\nQuality in execution\nTransparency in communication\nContinuous improvement",
                styles: {
                  color: "#555",
                  lineHeight: "2",
                  fontSize: "16px",
                },
              },
            ],
          },
        ],
        styles: { padding: "40px 20px" },
      },
    ],
    globalSettings: {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
});

TemplateRegistry.register("contact-page", {
  id: "contact-page",
  name: "Contact Page",
  nameKey: "templates.contactPage.name",
  description: "Contact information layout",
  descriptionKey: "templates.contactPage.description",
  category: "basic",
  thumbnail: null,
  data: {
    rows: [
      {
        id: "contact-header",
        type: "row-1",
        columns: [
          {
            id: "contact-header-col",
            elements: [
              {
                id: "contact-title",
                type: "heading",
                tag: "h1",
                content: "Contact Us",
                styles: {
                  fontSize: "42px",
                  textAlign: "center",
                  color: "#1a1a2e",
                  marginBottom: "12px",
                },
              },
              {
                id: "contact-subtitle",
                type: "text",
                content:
                  "Have a question or want to work together? We'd love to hear from you.",
                styles: {
                  fontSize: "18px",
                  textAlign: "center",
                  color: "#666",
                  marginBottom: "40px",
                },
              },
            ],
          },
        ],
        styles: { padding: "60px 20px 20px" },
      },
      {
        id: "contact-info",
        type: "row-3",
        responsive: { desktop: 3, mobile: 1 },
        columns: [
          {
            id: "contact-col-1",
            elements: [
              {
                id: "contact-email-title",
                type: "heading",
                tag: "h3",
                content: "Email",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "contact-email",
                type: "text",
                content: "hello@example.com",
                styles: { textAlign: "center", color: "#2196F3" },
              },
            ],
          },
          {
            id: "contact-col-2",
            elements: [
              {
                id: "contact-phone-title",
                type: "heading",
                tag: "h3",
                content: "Phone",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "contact-phone",
                type: "text",
                content: "+1 (555) 123-4567",
                styles: { textAlign: "center", color: "#555" },
              },
            ],
          },
          {
            id: "contact-col-3",
            elements: [
              {
                id: "contact-address-title",
                type: "heading",
                tag: "h3",
                content: "Address",
                styles: { textAlign: "center", color: "#1a1a2e" },
              },
              {
                id: "contact-address",
                type: "text",
                content: "123 Main St, Suite 100\nSan Francisco, CA 94105",
                styles: { textAlign: "center", color: "#555" },
              },
            ],
          },
        ],
        styles: {
          padding: "40px 20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        },
      },
    ],
    globalSettings: {
      maxWidth: "1200px",
      padding: "20px",
      backgroundColor: "#ffffff",
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
  },
});
