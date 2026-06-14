// Core configurations for i18n localization
import en from '../locales/en.json';
import mr from '../locales/mr.json';
import hi from '../locales/hi.json';

const translations = {
  en,
  mr,
  hi
};

export const getTranslation = (language, key) => {
  return translations[language]?.[key] || translations['en'][key] || key;
};

export default translations;
