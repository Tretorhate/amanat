import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ru', 'kz'],
  defaultLocale: 'ru'
});

export type Locale = (typeof routing.locales)[number];
