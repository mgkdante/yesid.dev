import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import AsidePanel from './AsidePanel.svelte';

describe('AsidePanel', () => {
	it('renders an aside element with data-slot', () => {
		const { container } = render(AsidePanel);
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el).toBeTruthy();
		expect(el?.tagName).toBe('ASIDE');
	});

	it('applies position as data attribute', () => {
		const { container } = render(AsidePanel, { props: { position: 'left' } });
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el?.getAttribute('data-position')).toBe('left');
	});

	it('defaults to right position', () => {
		const { container } = render(AsidePanel);
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el?.getAttribute('data-position')).toBe('right');
	});

	it('applies sticky class when prop is true', () => {
		const { container } = render(AsidePanel, { props: { sticky: true } });
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el?.classList.contains('aside-sticky')).toBe(true);
	});

	it('does not apply sticky class by default', () => {
		const { container } = render(AsidePanel);
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el?.classList.contains('aside-sticky')).toBe(false);
	});

	it('accepts custom class', () => {
		const { container } = render(AsidePanel, { props: { class: 'my-aside' } });
		const el = container.querySelector('[data-slot="aside-panel"]');
		expect(el?.classList.contains('my-aside')).toBe(true);
	});
});
