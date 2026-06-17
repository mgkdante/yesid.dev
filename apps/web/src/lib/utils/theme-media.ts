import { browser } from '$app/environment';
import { themeStore, type Theme } from '$lib/stores/theme.svelte';

export type { Theme } from '$lib/stores/theme.svelte';

function normalizeTheme(value: unknown, fallback: Theme = 'dark'): Theme {
	return value === 'light' || value === 'dark' ? value : fallback;
}

export function getActiveTheme(): Theme {
	if (!browser) return themeStore.theme;
	return normalizeTheme(document.documentElement.dataset.theme, themeStore.theme);
}

export function resolveThemeValue<T>(theme: Theme, darkValue: T, lightValue?: T): T {
	return theme === 'light' && lightValue ? lightValue : darkValue;
}

export function watchTheme(callback: (theme: Theme) => void): () => void {
	if (!browser) return () => {};

	const syncFromDocument = () => callback(getActiveTheme());
	const syncFromEvent = (event: Event) => {
		const theme = (event as CustomEvent<{ theme?: Theme }>).detail?.theme;
		callback(normalizeTheme(theme, getActiveTheme()));
	};

	syncFromDocument();
	const observer = new MutationObserver(syncFromDocument);
	observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
	document.addEventListener('themechange', syncFromEvent);

	return () => {
		observer.disconnect();
		document.removeEventListener('themechange', syncFromEvent);
	};
}
