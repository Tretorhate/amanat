import { Locale } from '@/i18n/routing';

type NestedMessages = {
  [key: string]: string | NestedMessages;
};

// Load messages for a specific locale
async function loadMessages(locale: Locale): Promise<NestedMessages> {
  return (await import(`@/locales/${locale}.json`)).default;
}

// Get a nested value from an object using dot notation
function getNestedValue(obj: NestedMessages, path: string): string {
  const keys = path.split('.');
  let current: string | NestedMessages = obj;

  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = current[key];
    } else {
      return path; // Return the key if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

// Create a translator function for server components
export async function getServerTranslations(locale: Locale) {
  const messages = await loadMessages(locale);

  return function t(key: string, params?: Record<string, string | number>): string {
    let value = getNestedValue(messages, key);

    // Replace parameters like {name} with actual values
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return value;
  };
}
