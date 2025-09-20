import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importer les traductions directement pour plus de fiabilité
import translationEN from '../public/locales/en/translation.json';
import translationAR from '../public/locales/ar/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  ar: {
    translation: translationAR,
  },
};

i18n
  .use(LanguageDetector) // Détecte la langue de l'utilisateur
  .use(initReactI18next) // Passe l'instance i18n à react-i18next
  .init({
    resources,
    supportedLngs: ['en', 'ar'],
    fallbackLng: 'en',
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
      caches: ['cookie'],
    },
    react: {
      useSuspense: false, // Désactivé pour éviter de bloquer le rendu
    },
    interpolation: {
      escapeValue: false, // React s'occupe déjà de la protection XSS
    }
  });

export default i18n;