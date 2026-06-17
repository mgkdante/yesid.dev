import { render } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it, vi } from 'vitest';
import DataFlowDiagram from './DataFlowDiagram.svelte';

vi.mock('$lib/motion/stores/reducedMotion.js', () => ({
	isPrefersReducedMotion: () => true,
}));

describe('DataFlowDiagram card sizing', () => {
	it('keeps the card stack diagram readable instead of shrinking on mobile', () => {
		const { container } = render(DataFlowDiagram, {
			props: {
				stack: ['SvelteKit', 'Directus', 'Neon', 'Vercel', 'Bun'],
				size: 'sm',
			},
		});

		const diagram = container.querySelector('.data-flow-diagram');
		const svg = container.querySelector('svg');
		const firstLabel = container.querySelector('.df-node text');

		expect(Number(svg?.getAttribute('width'))).toBeGreaterThanOrEqual(580);
		expect(Number(svg?.getAttribute('height'))).toBeGreaterThanOrEqual(58);
		expect(Number(firstLabel?.getAttribute('font-size'))).toBeGreaterThanOrEqual(11);
		expect(diagram?.getAttribute('style')).toContain('--df-svg-width');
	});

	it('lets mobile card diagrams scroll at natural width instead of forcing tiny text', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/home/DataFlowDiagram.svelte'),
			'utf8',
		);

		expect(source).toContain('.data-flow-diagram.size-sm svg');
		expect(source).toContain('width: max(100%, var(--df-svg-width));');
		expect(source).toContain('max-width: none;');
	});

	it('marks the scrollable stack as a nested carousel drag surface', () => {
		const { container } = render(DataFlowDiagram, {
			props: {
				stack: ['SvelteKit', 'Directus', 'Neon', 'Vercel', 'Bun'],
				size: 'sm',
			},
		});

		const diagram = container.querySelector('.data-flow-diagram');
		expect(diagram?.getAttribute('data-carousel-drag-ignore')).toBe('true');

		const source = readFileSync(
			join(cwd(), 'src/lib/components/home/DataFlowDiagram.svelte'),
			'utf8',
		);
		expect(source).toContain('onwheel={stopCarouselGesturePropagation}');
	});
});
