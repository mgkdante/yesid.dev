import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import DetailHeaderShell from './DetailHeaderShell.svelte';

const snippet = (testId: string, text: string) =>
	createRawSnippet(() => ({
		render: () => `<div data-testid="${testId}">${text}</div>`,
	}));

describe('DetailHeaderShell', () => {
	it('renders the typed shell contract in surface order', () => {
		render(DetailHeaderShell, {
			props: {
				accent: 'var(--accent)',
				testId: 'detail-header',
				rootClass: 'retained-surface',
				mobileMinHeight: 380,
				backHref: '/blog',
				backLabel: 'Back to blog',
				pills: ['sql', 'svelte'],
				pillsAriaLabel: 'Post tags',
				decorations: snippet('decorations', 'Decoration'),
				beforePills: snippet('before-pills', 'Title'),
				afterPills: snippet('after-pills', 'Metadata'),
			},
		});

		const header = screen.getByTestId('detail-header');
		expect(header).toHaveClass('retained-surface');
		expect(header.style.getPropertyValue('--header-accent')).toBe('var(--accent)');
		expect(header.style.getPropertyValue('--detail-header-mobile-min-height')).toBe('380px');

		expect(screen.getByRole('link', { name: 'Back to blog' })).toHaveAttribute('href', '/blog');
		const pills = screen.getByRole('navigation', { name: 'Post tags' });
		expect(pills).toHaveTextContent('sql');
		expect(pills).toHaveTextContent('svelte');
		expect(screen.getByTestId('quiet-mode-controls')).toBeInTheDocument();

		const contentOrder = [
			...header.querySelectorAll(
				'.header__back, [data-testid="before-pills"], .header__pills, [data-testid="after-pills"], .header__quiet',
			),
		].map((element) => {
			if (!(element instanceof HTMLElement)) return '';
			if (element.dataset.testid) return element.dataset.testid;
			return ['header__back', 'header__pills', 'header__quiet'].find((className) =>
				element.classList.contains(className),
			);
		});
		expect(contentOrder).toEqual([
			'header__back',
			'before-pills',
			'header__pills',
			'after-pills',
			'header__quiet',
		]);
	});

	it.each([[], ['Un libellé traduit beaucoup plus long', 'Short']])(
		'keeps optional metadata and changing pill sets independent of decorations',
		(...pills) => {
			const values = pills.filter((value): value is string => typeof value === 'string');
			render(DetailHeaderShell, {
				accent: 'var(--primary)',
				testId: 'detail-header',
				rootClass: 'fixture',
				mobileMinHeight: 420,
				backHref: '/archive',
				backLabel: 'Return',
				pills: values,
				pillsAriaLabel: 'Fixture labels',
				decorations: snippet('custom-decoration', 'Caller artwork'),
				beforePills: snippet('before-pills', 'A variable title'),
			});
			expect(screen.getByTestId('custom-decoration')).toHaveTextContent('Caller artwork');
			expect(screen.getByTestId('before-pills')).toHaveTextContent('A variable title');
			expect(document.querySelectorAll('.header__pill')).toHaveLength(values.length);
			expect(screen.queryByTestId('after-pills')).toBeNull();
			expect(screen.getByRole('link', { name: 'Return' })).toHaveAttribute('href', '/archive');
		},
	);
});
