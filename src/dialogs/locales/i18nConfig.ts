const { I18n } = require('i18n');
import { join } from 'path';

// Initialise the local
// Configure i18n
const i18n = new I18n();
i18n.configure({
  locales: ['en', 'fr'],
  directory: join(__dirname),
  defaultLocale: 'fr'
});

export default i18n;
