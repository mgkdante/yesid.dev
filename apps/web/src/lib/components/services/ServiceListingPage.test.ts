// ServiceListingPage — slice-34.5 selections (the station).
//
// The active service station is a SHAREABLE ?station=<id> URL param. Unlike the
// other two surfaces it uses NO persisted() rune — the URL param IS the
// cross-language state (the language toggle's localizeHref carries the query
// verbatim across EN⇄FR). The contract this slice adds:
//   - the param is written ONLY on an explicit tab click (handleTabSelect),
//     never from the IntersectionObserver scroll-spy (which would spam
//     replaceState during scroll);
//   - the write uses goto(replaceState, noScroll) — a scroll position, not a
//     history destination, and the Lenis scroll owns the motion;
//   - on mount, a present-and-valid ?station=<id> re-scrolls to #service-<id>
//     using the same Lenis-aware scroll (the deep-link / switch-restore path).
//
// $app/stores, $app/navigation and the Lenis singleton are mocked so the
// router/scroll side-effects are observable without a live SvelteKit runtime.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import { serviceFactory } from '../../../tests/factories';

// --- mocks ---
// vi.mock factories are hoisted above the module body, so any state they close
// over must be created via vi.hoisted (also hoisted) to avoid a TDZ error. Each
// test mutates the `mocks` holder (url / gotoFn / lenis) before rendering.
const mocks = vi.hoisted(() => ({
	url: new URL('http://localhost/services'),
	gotoFn: ((..._a: unknown[]) => {}) as (...a: unknown[]) => void,
	lenis: null as { scrollTo: (...a: unknown[]) => void } | null,
}));

vi.mock('$app/navigation', () => ({
	goto: (...args: unknown[]) => mocks.gotoFn(...args),
}));
vi.mock('$app/stores', () => ({
	// `page` is a store; the component reads $page.url.searchParams. The custom
	// store reads the live `mocks.url` holder on every subscribe so each test can
	// set a different URL before render.
	page: {
		subscribe(run: (value: { url: URL }) => void) {
			run({ url: mocks.url });
			return () => {};
		},
	},
}));
vi.mock('@yesid/motion/utils/lenis', () => ({
	getLenis: () => mocks.lenis,
}));

const gotoMock = vi.fn();
const scrollToMock = vi.fn();

import ServiceListingPage from './ServiceListingPage.svelte';

const services = [
	serviceFactory.build({ id: 'database-engineering', station: 1, visible: true }),
	serviceFactory.build({ id: 'data-pipeline', station: 2, visible: true }),
	serviceFactory.build({ id: 'web-development', station: 3, visible: true }),
];

const renderProps = {
	services,
	serviceSvgContents: Object.fromEntries(services.map((s) => [s.id, ''])),
	serviceProjects: Object.fromEntries(services.map((s) => [s.id, []])),
};

function renderPage() {
	return render(ServiceListingPage, { props: renderProps });
}

beforeEach(() => {
	gotoMock.mockClear();
	scrollToMock.mockClear();
	mocks.gotoFn = gotoMock;
	mocks.lenis = { scrollTo: scrollToMock };
	mocks.url = new URL('http://localhost/services');
});
afterEach(() => cleanup());

describe('ServiceListingPage station (slice-34.5)', () => {
	it('renders the listing page', () => {
		renderPage();
		expect(screen.getByTestId('service-listing-page')).toBeInTheDocument();
	});

	it('writes ?station=<id> via replaceState+noScroll on an explicit tab click', async () => {
		renderPage();
		// StationTabs (mode="scroll") renders each station as a button; click the
		// second one and assert the URL write contract.
		const tabs = screen.getAllByRole('tab');
		expect(tabs.length).toBe(services.length);
		await fireEvent.click(tabs[1]!); // data-pipeline

		expect(gotoMock).toHaveBeenCalledTimes(1);
		const [url, opts] = gotoMock.mock.calls[0]!;
		expect(String(url)).toContain('station=data-pipeline');
		expect(opts).toMatchObject({ replaceState: true, noScroll: true });
	});

	it('triggers the Lenis-aware scroll on an explicit tab click', async () => {
		// The clicked station's viewport must exist for querySelector to find it.
		renderPage();
		const tabs = screen.getAllByRole('tab');
		await fireEvent.click(tabs[2]!); // web-development
		// ServiceCard renders #service-<id>; the scroll targets that element.
		expect(scrollToMock).toHaveBeenCalledTimes(1);
	});

	it('does NOT write the URL from the IntersectionObserver scroll-spy', () => {
		// The IO is stubbed to a no-op in setup.dom.ts, so it never fires here — but
		// the contract is that ONLY handleTabSelect writes. A bare mount (no click)
		// must leave goto untouched even though the IO has observed the viewports.
		renderPage();
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('deep-link: a present ?station=<id> scrolls to that station on mount', async () => {
		mocks.url = new URL('http://localhost/services?station=web-development');
		renderPage();
		// onMount awaits a tick before scrolling — flush the microtask queue.
		await Promise.resolve();
		await Promise.resolve();
		expect(scrollToMock).toHaveBeenCalledTimes(1);
		// No URL write on a deep-link mount (the param is already there).
		expect(gotoMock).not.toHaveBeenCalled();
	});

	it('deep-link: an unknown ?station= id is ignored (no scroll, no crash)', async () => {
		mocks.url = new URL('http://localhost/services?station=archived-station');
		renderPage();
		await Promise.resolve();
		await Promise.resolve();
		expect(scrollToMock).not.toHaveBeenCalled();
	});

	it('falls back to scrollIntoView when Lenis is unavailable', async () => {
		mocks.lenis = null;
		renderPage();
		const tabs = screen.getAllByRole('tab');
		// Click a NON-active tab (station 1 is active on mount; bits-ui Tabs won't
		// re-fire onValueChange for the already-selected tab).
		const target = document.querySelector<HTMLElement>('#service-web-development');
		expect(target, 'station viewport must render').not.toBeNull();
		const intoView = vi.fn();
		target!.scrollIntoView = intoView;
		await fireEvent.click(tabs[2]!); // web-development
		expect(intoView).toHaveBeenCalledTimes(1);
		expect(scrollToMock).not.toHaveBeenCalled();
	});
});
