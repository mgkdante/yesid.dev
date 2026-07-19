import { render } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { describe, expect, it, vi } from 'vitest';
import DataFlowDiagram from './DataFlowDiagram.svelte';

vi.mock('@yesid/motion/stores/reducedMotion', () => ({
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

		expect(svg?.getAttribute('aria-label')).toBe('Technology stack: SvelteKit, Directus, Neon, Vercel, Bun');
		expect(Number(svg?.getAttribute('width'))).toBeGreaterThanOrEqual(580);
		expect(Number(svg?.getAttribute('height'))).toBeGreaterThanOrEqual(58);
		expect(Number(firstLabel?.getAttribute('font-size'))).toBeGreaterThanOrEqual(11);
		expect(diagram?.getAttribute('style')).toContain('--df-svg-width');
	});

	it('lets mobile card diagrams scroll at natural width instead of forcing tiny text', () => {
		const source = readFileSync(
			join(cwd(), 'src/lib/components/projects/DataFlowDiagram.svelte'),
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
			join(cwd(), 'src/lib/components/projects/DataFlowDiagram.svelte'),
			'utf8',
		);
		expect(source).toContain('siteLabels.a11y.technologyStackTemplate');
		expect(source).not.toContain('aria-label="Technology stack: {stack.join');
		expect(source).toContain('onwheel={containHorizontalStackWheel}');
	});

	it('lets vertical wheel events bubble so project cards do not interrupt page scroll', () => {
		const { container } = render(DataFlowDiagram, {
			props: {
				stack: ['SvelteKit', 'Directus', 'Neon', 'Vercel', 'Bun'],
				size: 'sm',
			},
		});

		const diagram = container.querySelector('.data-flow-diagram');
		const onWheel = vi.fn();
		document.addEventListener('wheel', onWheel);

		try {
			diagram?.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 120 }));
			expect(onWheel).toHaveBeenCalledTimes(1);
		} finally {
			document.removeEventListener('wheel', onWheel);
		}
	});

	it('keeps horizontal-dominant wheel events inside the stack diagram', () => {
		const { container } = render(DataFlowDiagram, {
			props: {
				stack: ['SvelteKit', 'Directus', 'Neon', 'Vercel', 'Bun'],
				size: 'sm',
			},
		});

		const diagram = container.querySelector('.data-flow-diagram');
		const onWheel = vi.fn();
		document.addEventListener('wheel', onWheel);

		try {
			diagram?.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaX: 120, deltaY: 10 }));
			expect(onWheel).not.toHaveBeenCalled();
		} finally {
			document.removeEventListener('wheel', onWheel);
		}
	});
});
