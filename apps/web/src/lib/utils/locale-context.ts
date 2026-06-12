// Svelte context bridge for the request locale — slice-28.6.
//
// WHY context, not $page.data, for the mechanically-converted call sites:
//   - page components remount under +layout.svelte's {#key $page.url.pathname},
//     so an init-time `const locale = getLocale()` is always current;
//   - without a provider (component unit tests) it returns DEFAULT_LOCALE,
//     which is byte-identical to the previous hardcoded 'en' — zero test churn.
// Persistent chrome (Nav/MenuOverlay/Footer/SeoHead) does NOT use this — it
// receives `locale` as a prop and derives reactively, because it never
// remounts. Any NEW persistent component must follow the prop pattern.
import { getContext, setContext } from 'svelte';
import type { Locale } from '$lib/types';
import { DEFAULT_LOCALE } from '$lib/utils/locale';

const KEY = Symbol.for('yesid.locale');

/** Call once from +layout.svelte during init. `read` closes over reactive data. */
export function provideLocale(read: () => Locale): void {
	setContext(KEY, read);
}

/** Current request locale; DEFAULT_LOCALE when rendered without the app layout. */
export function getLocale(): Locale {
	const read = getContext<(() => Locale) | undefined>(KEY);
	return read ? read() : DEFAULT_LOCALE;
}
