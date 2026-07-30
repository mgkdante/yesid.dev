import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

	it('keeps the crosshair SVG caller-owned', () => {
		const shellSource = readFileSync(
			join(process.cwd(), 'src/lib/components/shared/DetailHeaderShell.svelte'),
			'utf8',
		);
		const projectSource = readFileSync(
			join(process.cwd(), 'src/lib/components/projects/ProjectDetailHeader.svelte'),
			'utf8',
		);

		expect(shellSource.match(/<svg\b/g) ?? []).toHaveLength(0);
		expect(projectSource.match(/<svg\b/g) ?? []).toHaveLength(1);
	});
});
