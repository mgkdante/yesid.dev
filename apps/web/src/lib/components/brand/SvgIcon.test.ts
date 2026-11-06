import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { gsap } from '@yesid/motion/utils/gsap';
import SvgIcon from './SvgIcon.svelte';

// Mock shapes utils so getMorphShapes doesn't invoke the real adapter.
vi.mock('#lib/utils/shapes.ts', () => ({
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

	describe('morph timing', () => {
		const flush = () => new Promise((resolve) => setTimeout(resolve));
		const morphTweens = () =>
			vi.mocked(gsap.to).mock.calls.filter(([, vars]) => 'morphSVG' in (vars as object));

		/** Complete the entrance the way GSAP does, through the timeline's onComplete. */
		function finishEntrance() {
			const vars = vi.mocked(gsap.timeline).mock.calls.at(-1)![0] as { onComplete: () => void };
			flushSync(() => vars.onComplete());
		}

		beforeEach(() => vi.clearAllMocks());

		it('holds a parent hover during the entrance and morphs when it finishes', async () => {
			render(SvgIcon, { props: { svgContent: MOCK_SVG, hovered: true } });
			await flush();
			expect(morphTweens()).toHaveLength(0);

			finishEntrance();
			await flush();
			expect(morphTweens()).toHaveLength(1);
		});

		it('holds its own hover during the entrance and morphs when it finishes', async () => {
			const { container } = render(SvgIcon, { props: { svgContent: MOCK_SVG } });
			await flush();

			container
				.querySelector('[data-slot="svg-icon"]')!
				.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
			await flush();
			expect(morphTweens()).toHaveLength(0);

			finishEntrance();
			await flush();
			expect(morphTweens()).toHaveLength(1);
		});

		it('does not morph after the entrance when nothing is hovering', async () => {
			render(SvgIcon, { props: { svgContent: MOCK_SVG } });
			await flush();

			finishEntrance();
			await flush();
			expect(morphTweens()).toHaveLength(0);
		});
	});
});
