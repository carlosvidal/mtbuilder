// i18n.js
export class I18n {
  // Define las propiedades estáticas
  static supportedLocales = ["en", "es", "fr"];
  static fallbackLocale = "en";
  static instance = null;

  constructor() {
    this.translations = {};
    this.supportedLocales = I18n.supportedLocales;
    this.fallbackLocale = I18n.fallbackLocale;
    this.currentLocale = this.detectLocale();
  }

  static getInstance() {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  isLocaleSupported(locale) {
    const normalizedLocale = this.normalizeLocale(locale);
    return I18n.supportedLocales.includes(normalizedLocale);
  }

  normalizeLocale(locale) {
    if (!locale) return this.fallbackLocale;
    return locale.split("-")[0].toLowerCase();
  }

  detectLocale() {
    // 1. Primero intentar obtener del HTML
    const htmlLang = document.documentElement.lang;
    if (htmlLang && this.isLocaleSupported(htmlLang)) {
      return this.normalizeLocale(htmlLang);
    }

    // 2. Intentar obtener del localStorage
    const savedLocale = localStorage.getItem("preferredLocale");
    if (savedLocale && this.isLocaleSupported(savedLocale)) {
      return savedLocale;
    }

    // 3. Intentar obtener del navegador
    const browserLocale = navigator.language || navigator.userLanguage;
    const normalizedBrowserLocale = this.normalizeLocale(browserLocale);
    if (this.isLocaleSupported(normalizedBrowserLocale)) {
      return normalizedBrowserLocale;
    }

    // 4. Si todo falla, usar el idioma por defecto
    return this.fallbackLocale;
  }

  // En i18n.js
  async loadTranslations(locale) {
    try {
      const normalizedLocale = this.normalizeLocale(locale);
      console.log(
        `🌍 Attempting to load translations for locale: ${normalizedLocale}`
      );

      if (this.translations[normalizedLocale]) {
        console.log("✅ Using cached translations");
        return true;
      }

      // Detectar base URL dinámica
      const basePath =
        window.location.hostname === "carlosvidal.github.io"
          ? "/mtbuilder" // Cambia esto por tu nombre de repositorio
          : "";
      const path = `${basePath}/src/locales/${normalizedLocale}.json`;

      console.log(`🔍 Loading from: ${path}`);
      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const translations = await response.json();
      console.log("✅ Successfully loaded translations from file");
      this.translations[normalizedLocale] =
        this.flattenTranslations(translations);
      return true;
    } catch (error) {
      console.log(`⚠️ Could not load from file: ${error.message}`);
      console.log("↪️ Using built-in translations as fallback");

      const builtInTranslations = await this.getBuiltInTranslations(
        normalizedLocale
      );
      this.translations[normalizedLocale] =
        this.flattenTranslations(builtInTranslations);
      return true;
    }
  }

  // Método para obtener las traducciones incorporadas
  getBuiltInTranslations(locale) {
    // Definir las traducciones directamente en el código
    const translations = {
      en: {
        "pages.list.title": "My Pages",
        "pages.list.empty": "No pages created yet",
        "pages.list.empty.description": "Start by creating your first page",
        "pages.list.create": "Create New Page",
        "pages.list.actions.edit": "Edit",
        "pages.list.actions.delete": "Delete",
        "pages.lastModified": "Last modified",
        "builder.untitled": "Untitled Page",
      },
      es: {
        "pages.list.title": "Mis páginas",
        "pages.list.empty": "No hay páginas creadas",
        "pages.list.empty.description": "Comienza creando tu primera página",
        "pages.list.create": "Crear nueva página",
        "pages.list.actions.edit": "Editar",
        "pages.list.actions.delete": "Eliminar",
        "pages.lastModified": "Última modificación",
        "builder.untitled": "Página sin título",
      },
    };

    return Promise.resolve(
      translations[locale] || translations[this.fallbackLocale]
    );
  }

  flattenTranslations(obj, prefix = "") {
    return Object.keys(obj).reduce((acc, key) => {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null) {
        Object.assign(acc, this.flattenTranslations(obj[key], prefixedKey));
      } else {
        acc[prefixedKey] = obj[key];
      }
      return acc;
    }, {});
  }

  async setLocale(locale) {
    const normalizedLocale = this.normalizeLocale(locale);

    if (!this.isLocaleSupported(normalizedLocale)) {
      console.warn(
        `Locale ${normalizedLocale} is not supported, falling back to ${this.fallbackLocale}`
      );
      return false;
    }

    const loaded = await this.loadTranslations(normalizedLocale);
    if (!loaded) {
      console.warn(
        `Could not load translations for ${normalizedLocale}, falling back to ${this.fallbackLocale}`
      );
      return false;
    }

    this.currentLocale = normalizedLocale;

    window.dispatchEvent(
      new CustomEvent("localeChanged", {
        detail: { locale: normalizedLocale },
      })
    );

    return true;
  }

  t(key, params = {}) {
    let translation = this.translations[this.currentLocale]?.[key];

    if (!translation && this.currentLocale !== this.fallbackLocale) {
      translation = this.translations[this.fallbackLocale]?.[key];
    }

    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    return translation.replace(/\{(\w+)\}/g, (_, param) => {
      return params[param] !== undefined ? params[param] : `{${param}}`;
    });
  }

  p(key, count, params = {}) {
    const pluralKey = `${key}.${this.getPluralForm(count)}`;
    return this.t(pluralKey, { ...params, count });
  }

  getPluralForm(count) {
    switch (this.currentLocale) {
      case "es":
        return count === 1 ? "one" : "other";
      case "en":
      default:
        return count === 1 ? "one" : "other";
    }
  }

  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.currentLocale, options).format(number);
  }

  formatDate(date, options = {}) {
    return new Intl.DateTimeFormat(this.currentLocale, options).format(date);
  }

  formatCurrency(amount, currency = "EUR") {
    return new Intl.NumberFormat(this.currentLocale, {
      style: "currency",
      currency,
    }).format(amount);
  }
}
