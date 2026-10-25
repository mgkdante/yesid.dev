import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import DataFlowDiagram from './DataFlowDiagram.svelte';

vi.mock('@yesid/motion/stores/reducedMotion', () => ({
	isPrefersReducedMotion: () => true,
}));

vi.mock('#lib/content/index.ts', () => ({
	siteLabels: { a11y: { technologyStackTemplate: { en: 'Fixture stack: {stack}' } } },
}));

describe('DataFlowDiagram content and interaction', () => {
	it.each([
		{ size: 'sm' as const, stack: ['TypeScript'] },
		{ size: 'sm' as const, stack: ['SvelteKit', 'Directus', 'Neon', 'Vercel', 'Bun'] },
		{ size: 'lg' as const, stack: ['A longer technology label', 'A second technology'] },
	])('renders supplied stack nodes and accessible data in $size mode', ({ size, stack }) => {
		const { container } = render(DataFlowDiagram, {
			props: { stack, size },
		});

		const svg = screen.getByRole('img');
		expect(svg).toHaveAccessibleName(`Fixture stack: ${stack.join(', ')}`);
		const viewBox = svg.getAttribute('viewBox')!.split(/\s+/).map(Number);
		expect(viewBox.every(Number.isFinite)).toBe(true);
		expect(viewBox[2]).toBeGreaterThan(0);
		expect(viewBox[3]).toBeGreaterThan(0);
		const nodes = container.querySelectorAll('.df-node');
		expect(nodes).toHaveLength(stack.length);
		for (const node of nodes) {
			expect(node.querySelector('text')?.textContent?.trim()).toBeTruthy();
			expect(Number(node.querySelector('rect')?.getAttribute('width'))).toBeGreaterThan(0);
			expect(Number(node.querySelector('rect')?.getAttribute('height'))).toBeGreaterThan(0);
		}
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
