import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LocaleProbe from './fixtures/LocaleProbe.svelte';
import LocaleProvider from './fixtures/LocaleProvider.svelte';

describe('locale context', () => {
	it('getLocale() falls back to en without a provider (keeps existing component tests valid)', () => {
		render(LocaleProbe);
		expect(screen.getByTestId('probe').textContent).toBe('en');
	});
	it('getLocale() reads the provided locale', () => {
		render(LocaleProvider, { locale: 'fr' });
		expect(screen.getByTestId('probe').textContent).toBe('fr');
	});
});
