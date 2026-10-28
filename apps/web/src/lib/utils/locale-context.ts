import { createIntl } from '@yesid/i18n-core';
import { createLocaleContext } from '@yesid/ui/state';
import type { Locale } from '#lib/types.ts';
import { DEFAULT_LOCALE } from '#lib/utils/locale.ts';

// The root layout provides the request locale. Page components remount per pathname, so an
// init-time getLocale() is current; persistent chrome takes `locale` as a prop instead.
export const { provide: provideLocale, get: getLocale } = createLocaleContext<Locale>(DEFAULT_LOCALE);

export const intl = createIntl<Locale>({ en: 'en-CA', fr: 'fr-CA', es: 'es' });
