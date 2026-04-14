import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ListingShell from './ListingShell.svelte';

describe('ListingShell', () => {
	it('renders with data-slot', () => {
		const { container } = render(ListingShell, { props: { title: 'Work' } });
		const el = container.querySelector('[data-slot="listing-shell"]');
		expect(el).toBeTruthy();
	});

	it('renders h1 with title', () => {
		const { container } = render(ListingShell, { props: { title: 'Dispatches' } });
		const h1 = container.querySelector('h1');
		expect(h1?.textContent).toContain('Dispatches');
	});

	it('renders subtitle when provided', () => {
		const { container } = render(ListingShell, { props: { title: 'Work', subtitle: '// projects' } });
		const sub = container.querySelector('[data-listing-subtitle]');
		expect(sub?.textContent).toBe('// projects');
	});

	it('does not render subtitle when not provided', () => {
		const { container } = render(ListingShell, { props: { title: 'Work' } });
		const sub = container.querySelector('[data-listing-subtitle]');
		expect(sub).toBeNull();
	});

	it('renders sidebar area', () => {
		const { container } = render(ListingShell, { props: { title: 'Work' } });
		const sidebar = container.querySelector('[data-listing-sidebar]');
		expect(sidebar).toBeTruthy();
	});

	it('renders content area', () => {
		const { container } = render(ListingShell, { props: { title: 'Work' } });
		const content = container.querySelector('[data-listing-content]');
		expect(content).toBeTruthy();
	});

	it('accepts custom class', () => {
		const { container } = render(ListingShell, { props: { title: 'T', class: 'custom' } });
		const el = container.querySelector('[data-slot="listing-shell"]');
		expect(el?.classList.contains('custom')).toBe(true);
	});
});
