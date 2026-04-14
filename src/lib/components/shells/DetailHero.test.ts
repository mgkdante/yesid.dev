import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import DetailHero from './DetailHero.svelte';

describe('DetailHero', () => {
	it('renders with data-slot', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/work', backLabel: '← All Projects', title: 'My Project' }
		});
		const el = container.querySelector('[data-slot="detail-hero"]');
		expect(el).toBeTruthy();
	});

	it('renders back link with correct href', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/work', backLabel: '← All Projects', title: 'My Project' }
		});
		const link = container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('/work');
		expect(link?.textContent).toBe('← All Projects');
	});

	it('renders h1 with title', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/work', backLabel: '← Back', title: 'Test Title' }
		});
		const h1 = container.querySelector('h1');
		expect(h1?.textContent).toBe('Test Title');
	});

	it('renders subtitle when provided', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/', backLabel: '← Back', title: 'Title', subtitle: 'A description' }
		});
		const subtitle = container.querySelector('[data-detail-subtitle]');
		expect(subtitle?.textContent).toBe('A description');
	});

	it('does not render subtitle when not provided', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/', backLabel: '← Back', title: 'Title' }
		});
		const subtitle = container.querySelector('[data-detail-subtitle]');
		expect(subtitle).toBeNull();
	});

	it('accepts custom class', () => {
		const { container } = render(DetailHero, {
			props: { backHref: '/', backLabel: '← Back', title: 'T', class: 'custom' }
		});
		const el = container.querySelector('[data-slot="detail-hero"]');
		expect(el?.classList.contains('custom')).toBe(true);
	});
});
