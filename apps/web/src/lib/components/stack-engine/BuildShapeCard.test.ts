import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import BuildShapeCard from './BuildShapeCard.svelte';

const defaultViewport = { width: window.innerWidth, height: window.innerHeight };
const happyDOM = (
	window as unknown as {
		happyDOM: { setViewport: (viewport: { width?: number; height?: number }) => void };
	}
).happyDOM;

afterEach(() => {
	happyDOM.setViewport(defaultViewport);
});

const renderCard = (
	pickedTechs: ReadonlySet<string>,
	options: {
		animate?: boolean;
		onViewChange?: (view: 'drawing' | 'product') => void;
		context?: Map<unknown, unknown>;
	} = {},
) =>
	render(BuildShapeCard, {
		props: {
			pickedTechs,
			animate: options.animate ?? false,
			onViewChange: options.onViewChange ?? vi.fn(),
		},
		context: options.context,
	});

describe('BuildShapeCard', () => {
	it('recomputes the build shape when the live picked-tech set mutates', async () => {
		const pickedTechs = new SvelteSet(['node-js']);
		renderCard(pickedTechs);

		expect(screen.getByTestId('shape-phrase').textContent).not.toContain('keeps clean records');

		pickedTechs.add('postgresql');
		await tick();

		expect(screen.getByTestId('shape-phrase').textContent).toContain('keeps clean records');
		expect(
			[...screen.getByTestId('build-shape').querySelectorAll('.shape-roster li')].map((item) =>
				item.textContent?.trim(),
			),
		).toEqual(['Node.js', expect.stringMatching(/^PostgreSQL, .+/)]);
	});

	it('keeps the encoded blueprint href separate from the localized availability href', () => {
		renderCard(new SvelteSet(['node-js', 'postgresql']), {
			context: new Map([[Symbol.for('yesid.locale'), () => 'fr']]),
		});

		expect(screen.getByTestId('shape-link').getAttribute('href')).toBe(
			'/contact?bp=custom~node-js.postgresql',
		);
		expect(screen.getByTestId('shape-availability').getAttribute('href')).toBe('/fr/contact');
	});

	it('emits both animate=false view transitions', async () => {
		const onViewChange = vi.fn();
		renderCard(new SvelteSet(['postgresql']), { animate: false, onViewChange });

		await fireEvent.click(screen.getByTestId('shape-view-toggle'));
		expect(screen.getByTestId('shape-product')).toBeTruthy();
		expect(onViewChange).toHaveBeenLastCalledWith('product');

		await fireEvent.click(screen.getByTestId('shape-view-toggle'));
		expect(screen.queryByTestId('shape-product')).toBeNull();
		expect(onViewChange.mock.calls).toEqual([['product'], ['drawing']]);
	});

	it.each([
		{ width: 768, visibleVariant: 'stacked' },
		{ width: 1023, visibleVariant: 'stacked' },
		{ width: 1024, visibleVariant: 'wide' },
	])(
		'keeps one visible flip id per pick at $width px',
		({ width, visibleVariant }) => {
			happyDOM.setViewport({ width });
			renderCard(new SvelteSet(['node-js', 'postgresql']));

			const card = screen.getByTestId('build-shape');
			const wide = screen.getByTestId('shape-blueprint');
			const stacked = screen.getByTestId('shape-blueprint-stacked');
			const visible = visibleVariant === 'wide' ? wide : stacked;
			const hidden = visibleVariant === 'wide' ? stacked : wide;

			for (const id of ['node-js', 'postgresql']) {
				expect(card.querySelectorAll(`[data-flip-id="${id}"]`)).toHaveLength(1);
				expect(visible.querySelectorAll(`[data-flip-id="${id}"]`)).toHaveLength(1);
				expect(hidden.querySelectorAll(`[data-flip-id="${id}"]`)).toHaveLength(0);
			}
		},
	);
});
