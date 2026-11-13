import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HeroBanner from './HeroBanner.svelte';
import { heroContent, heroAnimContent } from '#lib/content/site-content.ts';
import { INITIAL_HERO_DATA, LIVE_KPIS_URL, LIVE_POLL_MS } from '#lib/live/index.ts';
import { tick } from 'svelte';
import contract from '../../../../../../contracts/kpis-v1.examples.json';

function mountHero() {
	return render(HeroBanner, {
		metroSvg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
		hero: heroContent,
		heroAnim: heroAnimContent,
		initialHeroData: INITIAL_HERO_DATA,
		bookingHref: 'https://cal.com/fixture',
	});
}

async function settle() {
	await vi.advanceTimersByTimeAsync(0);
	await tick();
}

function liveFetch() {
	vi.useFakeTimers();
	vi.spyOn(navigator, 'webdriver', 'get').mockReturnValue(false);
	vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
	return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json(contract.examples[0].body));
}

afterEach(() => {
	cleanup();
	vi.clearAllTimers();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe('HeroBanner live KPI polling boundary', () => {
	it('keeps DEMO values unchanged across two further failed polls after dropping', async () => {
		const fetchKpis = liveFetch();
		const view = mountHero();
		await settle();
		fetchKpis.mockRejectedValue(new Error('offline'));
		vi.spyOn(Math, 'random').mockReturnValue(0.1);
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS * 2);
		const rows = view.getAllByTestId('sql-results')[0];
		const metrics = view.getByTestId('hero-metrics-desktop');
		const meta = view.getAllByTestId('sql-meta')[0];
		const demo = { rows: rows.textContent, metrics: metrics.textContent, meta: meta.textContent };
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'failure');
		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		for (let poll = 0; poll < 2; poll++) {
			await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
			expect({ rows: rows.textContent, metrics: metrics.textContent, meta: meta.textContent }).toEqual(demo);
		}
	});

	it('keeps a never-live page on its initial DEMO values across failed polls', async () => {
		liveFetch().mockRejectedValue(new Error('offline'));
		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		const view = mountHero();
		const rows = view.getAllByTestId('sql-results')[0];
		const metrics = view.getByTestId('hero-metrics-desktop');
		const meta = view.getAllByTestId('sql-meta')[0];
		const initial = { rows: rows.textContent, metrics: metrics.textContent, meta: meta.textContent };
		await settle();
		for (let poll = 0; poll < 4; poll++) {
			await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
			expect({ rows: rows.textContent, metrics: metrics.textContent, meta: meta.textContent }).toEqual(initial);
			expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'failure');
		}
	});

	it('manual refresh in DEMO regenerates with the just-now stamp even during a failed initial poll', async () => {
		let finish!: (response: Response) => void;
		liveFetch().mockImplementation(() => new Promise(resolve => { finish = resolve; }));
		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		const view = mountHero();
		const rows = view.getAllByTestId('sql-results')[0];
		const initial = rows.textContent;
		await fireEvent.click(view.getByTestId('hero-refresh'));
		finish(new Response('cold', { status: 503 }));
		await settle();
		expect(rows.textContent).not.toBe(initial);
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'failure');
		expect(view.getAllByTestId('sql-meta')[0]).toHaveTextContent(heroContent.sqlPanel.stamps.refreshed.en);
	});

	it('holds real values and their original ageing clock once, then labels DEMO, and recovers', async () => {
		const fetchKpis = liveFetch();
		const view = mountHero();
		await settle();
		const badge = view.getAllByTestId('sql-live')[0];
		const meta = view.getAllByTestId('sql-meta')[0];
		const rows = () => view.getAllByTestId('sql-results')[0].querySelector('tbody')!.textContent;
		const realRows = rows();
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'live');
		expect(meta).toHaveTextContent('5s ago');

		fetchKpis.mockResolvedValue(new Response('cold', { status: 503 }));
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'held');
		expect(rows()).toBe(realRows);
		expect(meta).toHaveTextContent('50s ago');
		await vi.advanceTimersByTimeAsync(5_000);
		expect(meta).toHaveTextContent('55s ago');
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS - 5_000);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'failure');
		expect(meta).not.toHaveTextContent(/\d+s ago/);

		fetchKpis.mockImplementation(async () => Response.json(contract.examples[0].body));
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'live');
		fetchKpis.mockRejectedValue(new Error('offline'));
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'held');
	});

	it('uses the same consecutive failure budget for manual refresh and automatic polls', async () => {
		const fetchKpis = liveFetch();
		const view = mountHero();
		await settle();
		const badge = view.getAllByTestId('sql-live')[0];
		fetchKpis.mockRejectedValue(new Error('offline'));
		await fireEvent.click(view.getByTestId('hero-refresh'));
		await settle();
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'held');
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'failure');

		fetchKpis.mockImplementation(async () => Response.json(contract.examples[0].body));
		await fireEvent.click(view.getByTestId('hero-refresh'));
		await settle();
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'live');
		fetchKpis.mockRejectedValue(new Error('offline'));
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'held');
		await fireEvent.click(view.getByTestId('hero-refresh'));
		await settle();
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'failure');
	});

	it('a success between failures resets the budget before DEMO', async () => {
		const fetchKpis = liveFetch();
		const view = mountHero();
		await settle();
		const badge = view.getAllByTestId('sql-live')[0];
		for (const fail of [true, false, true, true]) {
			fetchKpis.mockImplementation(async () => fail
				? new Response('cold', { status: 503 })
				: Response.json(contract.examples[0].body));
			await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
			if (!fail) expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'live');
			else if (fetchKpis.mock.calls.length < 5) expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'held');
		}
		expect(badge.closest('[data-state]')).toHaveAttribute('data-state', 'failure');
	});

	it('keeps the webdriver bypass for unrelated suites and labels failed initial checks DEMO', async () => {
		const fetchKpis = liveFetch();
		vi.spyOn(navigator, 'webdriver', 'get').mockReturnValue(true);
		const view = mountHero();
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS * 2);
		expect(fetchKpis).not.toHaveBeenCalled();
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'demo');
	});

	it('renders the usable route count in the SQL caption', async () => {
		liveFetch().mockImplementation(async () => Response.json(contract.examples[1].body));
		const view = mountHero();
		await settle();
		expect(view.getAllByTestId('sql-results')[0].querySelectorAll('tbody tr')).toHaveLength(4);
		expect(view.getAllByTestId('sql-meta')[0]).toHaveTextContent('4 rows');
	});

	it('shares a pending poll with manual refresh so one failed request consumes one failure', async () => {
		const fetchKpis = liveFetch();
		const view = mountHero();
		await settle();
		let finish!: (response: Response) => void;
		fetchKpis.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		await fireEvent.click(view.getByTestId('hero-refresh'));
		expect(fetchKpis).toHaveBeenCalledTimes(2);
		finish(new Response('cold', { status: 503 }));
		await settle();
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'held');
	});

	it('keeps initial failures labelled DEMO when no real reading exists', async () => {
		liveFetch().mockRejectedValue(new Error('offline'));
		const view = mountHero();
		await settle();
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'failure');
		await vi.advanceTimersByTimeAsync(LIVE_POLL_MS);
		expect(view.getAllByTestId('sql-panel')[0]).toHaveAttribute('data-state', 'failure');
		expect(view.getAllByTestId('sql-meta')[0]).not.toHaveTextContent(/\d+s ago/);
	});
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
			bookingHref: 'https://cal.com/fixture',
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
