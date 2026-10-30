import { browser } from '$app/env';
import { theme, type Theme } from '@yesid/ui/state';

function normalizeTheme(value: unknown, fallback: Theme = 'dark'): Theme {
	return value === 'light' || value === 'dark' ? value : fallback;
}

export function getActiveTheme(): Theme {
	if (!browser) return theme.current;
	return normalizeTheme(document.documentElement.dataset.theme, theme.current);
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
