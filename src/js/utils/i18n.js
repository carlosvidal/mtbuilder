// i18n.js
export class I18n {
  constructor() {
    this.translations = {};
    this.currentLocale = "es";
    this.fallbackLocale = "en";
  }

  static getInstance() {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  async loadTranslations(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      const translations = await response.json();
      this.translations[locale] = this.flattenTranslations(translations);
      return true;
    } catch (error) {
      console.error(`Error loading translations for ${locale}:`, error);
      return false;
    }
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
    if (!this.translations[locale]) {
      const loaded = await this.loadTranslations(locale);
      if (!loaded) {
        console.warn(
          `Could not load translations for ${locale}, falling back to ${this.fallbackLocale}`
        );
        return false;
      }
    }
    this.currentLocale = locale;
    // Disparar evento de cambio de idioma
    window.dispatchEvent(
      new CustomEvent("localeChanged", { detail: { locale } })
    );
    return true;
  }

  t(key, params = {}) {
    const translation =
      this.translations[this.currentLocale]?.[key] ||
      this.translations[this.fallbackLocale]?.[key] ||
      key;

    return translation.replace(/\{(\w+)\}/g, (_, param) => {
      return params[param] !== undefined ? params[param] : `{${param}}`;
    });
  }

  // Método para pluralización
  p(key, count, params = {}) {
    const pluralKey = `${key}.${this.getPluralForm(count)}`;
    return this.t(pluralKey, { ...params, count });
  }

  getPluralForm(count) {
    // Implementación básica para español
    return count === 1 ? "one" : "other";
  }
}

// Decorador para hacer que los componentes web sean traducibles
export function Translatable(Base) {
  return class extends Base {
    constructor() {
      super();
      this.i18n = I18n.getInstance();

      // Re-renderizar cuando cambie el idioma
      window.addEventListener("localeChanged", () => {
        this.requestUpdate?.();
      });
    }

    // Método de ayuda para traducir
    t(key, params = {}) {
      return this.i18n.t(key, params);
    }

    // Método de ayuda para pluralizar
    p(key, count, params = {}) {
      return this.i18n.p(key, count, params);
    }
  };
}
