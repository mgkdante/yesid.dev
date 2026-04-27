import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import SvgIcon from './SvgIcon.svelte';

// Mock shapes utils so getMorphShapes doesn't invoke the real adapter.
vi.mock('$lib/utils/shapes', () => ({
	getMorphShapes: vi.fn(async () => [
		{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 1 },
		{ id: 'circle', label: 'Circle', path: 'M24 8 A16 16 0 1 1 23.99 8 Z', viewbox: '0 0 48 48', sort: 2 },
	]),
	pickRandomShape: vi.fn((shapes: { path: string }[], _lastIdx: number) => ({
		shape: shapes[0],
		index: 0,
	})),
}));

const MOCK_SVG = '<svg viewBox="0 0 48 48"><path d="M0 0 L10 10" /></svg>';

describe('SvgIcon', () => {
	it('renders a container with data-slot', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG } });
		const el = container.querySelector('[data-slot="svg-icon"]');
		expect(el).toBeTruthy();
	});

	it('renders SVG content via innerHTML', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG } });
		const svg = container.querySelector('svg');
		expect(svg).toBeTruthy();
	});

	it('applies size via CSS custom property', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG, size: 64 } });
		const el = container.querySelector('[data-slot="svg-icon"]') as HTMLElement;
		expect(el.style.getPropertyValue('--svg-icon-size')).toBe('64px');
	});

	it('defaults to size 48', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG } });
		const el = container.querySelector('[data-slot="svg-icon"]') as HTMLElement;
		expect(el.style.getPropertyValue('--svg-icon-size')).toBe('48px');
	});

	it('has role="presentation" and aria-hidden', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG } });
		const el = container.querySelector('[data-slot="svg-icon"]');
		expect(el?.getAttribute('role')).toBe('presentation');
		expect(el?.getAttribute('aria-hidden')).toBe('true');
	});

	it('accepts custom class', () => {
		const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG, class: 'my-custom' } });
		const el = container.querySelector('[data-slot="svg-icon"]');
		expect(el?.classList.contains('my-custom')).toBe(true);
	});
});
