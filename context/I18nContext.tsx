import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, TranslationKey } from '../utils/i18n/translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  availableLanguages: Language[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

/**
 * Detect browser language
 */
function detectBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  const supportedLanguages: Language[] = ['en', 'es', 'fr', 'de'];

  if (supportedLanguages.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return 'en';
}

/**
 * I18n Provider Component
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children, defaultLanguage }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem('tissaia-language');
    if (stored && Object.keys(translations).includes(stored)) {
      return stored as Language;
    }
    // Use default language or detect from browser
    return defaultLanguage || detectBrowserLanguage();
  });

  /**
   * Set language and persist to localStorage
   */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tissaia-language', lang);
    document.documentElement.lang = lang;
  };

  /**
   * Translate function with parameter interpolation
   */
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }

    return translation;
  };

  // Set document language on mount and change
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const availableLanguages: Language[] = ['en', 'es', 'fr', 'de'];

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        availableLanguages,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to use i18n context
 */
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

/**
 * Hook to get translation function
 */
export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};
