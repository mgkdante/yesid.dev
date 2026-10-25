import { siteLabels } from '#lib/content/site-labels';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { gsap, ScrollTrigger } from '#lib/motion/utils/gsap.js';
import { tick } from 'svelte';
import CloserGraffiti from './CloserGraffiti.svelte';

const SVG_FIXTURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g data-letter="T">
    <path data-part="body" d="M0 0H40V40H0Z"/>
    <path data-part="drip" d="M10 40H20V70H10Z"/>
  </g>
  <g data-letter="H">
    <path data-part="body" d="M50 0H90V40H50Z"/>
    <path data-part="drip" d="M60 40H70V80H60Z"/>
  </g>
</svg>`;

const originalFetch = globalThis.fetch;

afterEach(() => {
	cleanup();
	globalThis.fetch = originalFetch;
	vi.clearAllMocks();
});

describe('CloserGraffiti', () => {
	it('ignores a decorative SVG response that finishes after navigation unmounts it', async () => {
		let finishText!: (svg: string) => void;
		const pendingText = new Promise<string>((resolve) => { finishText = resolve; });
		globalThis.fetch = vi.fn(async () => ({ ok: true, text: () => pendingText })) as unknown as typeof fetch;
		const onReady = vi.fn();
		const { unmount } = render(CloserGraffiti, { props: { onReady } });
		const host = screen.getByTestId('closer-graffiti');
		await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
		await unmount();

		finishText(SVG_FIXTURE);
		await pendingText;
		await tick();
		await Promise.resolve();

		expect(host.querySelector('svg')).toBeNull();
		expect(onReady).not.toHaveBeenCalled();
	});

	it.each([false, true])('stops detached replay and owned animation after navigation (reduced motion: %s)', async (reduced) => {
		const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: reduced } as MediaQueryList);
		globalThis.fetch = vi.fn(async () => new Response(SVG_FIXTURE, { status: 200 })) as typeof fetch;
		const onReady = vi.fn();
		try {
			const { unmount } = render(CloserGraffiti, { props: { onReady } });
			const host = screen.getByTestId('closer-graffiti');
			await waitFor(() => expect(reduced ? ScrollTrigger.create : onReady).toHaveBeenCalledTimes(1));
			host.dispatchEvent(new Event('mouseenter'));
			expect(gsap.timeline).toHaveBeenCalledTimes(1);
			const timeline = vi.mocked(gsap.timeline).mock.results[0].value;
			const scrollTrigger = vi.mocked(ScrollTrigger.create).mock.results[0]?.value;

			await unmount();
			expect(timeline.kill).toHaveBeenCalledTimes(1);
			if (reduced) expect(scrollTrigger.kill).toHaveBeenCalledTimes(1);
			vi.mocked(gsap.timeline).mockClear();
			host.dispatchEvent(new Event('mouseenter'));
			host.dispatchEvent(new Event('touchstart'));
			expect(gsap.timeline).not.toHaveBeenCalled();
		} finally {
			matchMedia.mockRestore();
		}
	});

	it.each([
		{ locale: 'en', asset: '/svg/graffiti/the-end.en.svg', label: siteLabels.a11y.closerGraffiti.en },
		{ locale: 'fr', asset: '/svg/graffiti/the-end.fr.svg', label: siteLabels.a11y.closerGraffiti.fr },
		{ locale: 'es', asset: '/svg/graffiti/the-end.es.svg', label: siteLabels.a11y.closerGraffiti.es },
	] as const)('loads the $locale artwork and exposes its localized label', async ({ locale, asset, label }) => {
		const requests: string[] = [];
		globalThis.fetch = vi.fn(async (input) => {
			requests.push(String(input));
			return new Response(SVG_FIXTURE, { status: 200 });
		}) as typeof fetch;

		render(CloserGraffiti, {
			context: new Map([[Symbol.for('yesid.locale'), () => locale]]),
		});

		await waitFor(() => expect(requests).toEqual([asset]));
		expect(screen.getByTestId('closer-graffiti')).toHaveAttribute('aria-label', label);
	});

	it('finishes every letter fill before starting any downward drip', async () => {
		globalThis.fetch = vi.fn(async () => new Response(SVG_FIXTURE, { status: 200 })) as typeof fetch;
		let animate: (() => gsap.core.Timeline) | undefined;

		render(CloserGraffiti, {
			props: {
				onReady: (animateFn) => {
					animate = animateFn;
				},
			},
		});

		await waitFor(() => expect(animate).toBeTypeOf('function'));
		animate!();

		const timeline = vi.mocked(gsap.timeline).mock.results.at(-1)?.value as {
			set: ReturnType<typeof vi.fn>;
			to: ReturnType<typeof vi.fn>;
		};
		const fillStarts = timeline.set.mock.calls
			.filter(([, vars]) => typeof vars === 'object' && vars !== null && 'fill' in vars)
			.map(([, , position]) => position as number);
		const bodyEnds = timeline.to.mock.calls
			.filter(([, vars]) => typeof vars === 'object' && vars !== null && 'drawSVG' in vars)
			.map(([, vars, position]) =>
				(position as number) + ((vars as { duration: number }).duration ?? 0),
			);
		const dripStarts = timeline.to.mock.calls
			.filter(([targets]) =>
				Array.from(targets as Iterable<SVGPathElement>).some(
					(path) => path.getAttribute('data-part') === 'drip',
				),
			)
			.map(([, , position]) => position as number);

		expect(fillStarts).toHaveLength(2);
		expect(bodyEnds).toHaveLength(2);
		expect(dripStarts.length).toBeGreaterThan(0);
		expect(Math.min(...dripStarts)).toBeGreaterThan(Math.max(...fillStarts, ...bodyEnds));
	});
});
