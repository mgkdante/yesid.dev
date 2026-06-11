import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ThemeToggle from './ThemeToggle.svelte';
import { themeStore } from '$lib/stores/theme.svelte';

describe('ThemeToggle', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.dataset.theme = 'dark';
		themeStore.set('dark');
		localStorage.clear();
	});

	it('renders an aria-correct switch, checked in dark', () => {
		render(ThemeToggle);
		const btn = screen.getByTestId('theme-toggle');
		expect(btn).toHaveAttribute('role', 'switch');
		expect(btn).toHaveAttribute('aria-checked', 'true');
		expect(btn).toHaveAccessibleName('Dark theme');
	});

	it('click flips the document theme and aria state', async () => {
		render(ThemeToggle);
		await fireEvent.click(screen.getByTestId('theme-toggle'));
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(screen.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'false');
		expect(localStorage.getItem('theme')).toBe('light');
	});
});
