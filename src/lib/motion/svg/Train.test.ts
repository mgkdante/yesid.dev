import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Train from './Train.svelte';
import { TRAIN_TARGETS } from './train-targets';

describe('Train SVG component', () => {
	it('renders without crashing', () => {
		expect(() => render(Train)).not.toThrow();
	});

	it('SVG has id="yesid-train"', () => {
		const { container } = render(Train);
		const svg = container.querySelector('#yesid-train');
		expect(svg).toBeInTheDocument();
		expect(svg?.tagName.toLowerCase()).toBe('svg');
	});

	it('all 7 animated group ids are present', () => {
		const { container } = render(Train);
		const expectedIds = [
			'train-glow',
			'train-body',
			'train-cab',
			'train-stripe',
			'train-windows',
			'train-wheels',
			'train-lights'
		];
		for (const id of expectedIds) {
			expect(container.querySelector(`#${id}`)).toBeInTheDocument();
		}
	});

	it('trainClass prop is applied to the svg element', () => {
		const { container } = render(Train, { props: { trainClass: 'my-custom-class' } });
		const svg = container.querySelector('#yesid-train');
		expect(svg?.classList.contains('my-custom-class')).toBe(true);
	});

	it('aria-hidden is "true"', () => {
		const { container } = render(Train);
		const svg = container.querySelector('#yesid-train');
		expect(svg?.getAttribute('aria-hidden')).toBe('true');
	});

	it('TRAIN_TARGETS selectors all resolve to at least 1 element', () => {
		const { container } = render(Train);
		for (const [key, selector] of Object.entries(TRAIN_TARGETS)) {
			const matches = container.querySelectorAll(selector);
			expect(matches.length, `TRAIN_TARGETS.${key} ("${selector}") should match at least 1 element`).toBeGreaterThanOrEqual(1);
		}
	});

	it('has 3 radial gradient defs with train- prefix', () => {
		const { container } = render(Train);
		const gradients = container.querySelectorAll('radialGradient');
		expect(gradients.length).toBe(3);
		for (const g of gradients) {
			expect(g.id.startsWith('train-')).toBe(true);
		}
	});

	it('has 4 wheel groups (12 circles total in #train-wheels)', () => {
		const { container } = render(Train);
		const wheelCircles = container.querySelectorAll('#train-wheels circle');
		// 4 wheels × 3 concentric circles = 12
		expect(wheelCircles.length).toBe(12);
	});
});
