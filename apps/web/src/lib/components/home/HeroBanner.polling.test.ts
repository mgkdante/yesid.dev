import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HeroBanner from './HeroBanner.svelte';
import { heroContent, heroAnimContent } from '$lib/content/site-content';
import { INITIAL_HERO_DATA, LIVE_KPIS_URL, LIVE_POLL_MS } from '$lib/live';

afterEach(() => {
	cleanup();
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('HeroBanner live KPI polling boundary', () => {
	it('polls while mounted and stops polling after unmount', async () => {
		vi.useFakeTimers();
		vi.spyOn(navigator, 'webdriver', 'get').mockReturnValue(false);
		vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
		const fetchKpis = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
			new Response('null', { headers: { 'Content-Type': 'application/json' } }),
		);

		const { unmount } = render(HeroBanner, {
			metroSvg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
			hero: heroContent,
			heroAnim: heroAnimContent,
			initialHeroData: INITIAL_HERO_DATA,
		});

		expect(fetchKpis).toHaveBeenCalledExactlyOnceWith(LIVE_KPIS_URL, { cache: 'no-store' });
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS * 2);
		expect(fetchKpis).toHaveBeenCalledTimes(3);

		await unmount();
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS * 2);
		document.dispatchEvent(new Event('visibilitychange'));
		expect(fetchKpis).toHaveBeenCalledTimes(3);
	});
});
