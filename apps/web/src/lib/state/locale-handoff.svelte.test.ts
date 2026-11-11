import { afterEach, describe, it, expect, vi } from 'vitest';
type Navigation = { type: string; from: { url: URL }; to: { url: URL }; shallow: boolean; willUnload: boolean; event: Event; complete: Promise<void> };
const hooks = vi.hoisted(() => ({ before: (_nav: Navigation) => {}, unmount: () => {} }));
vi.mock('$app/env', async (original) => ({ ...await original<typeof import('$app/env')>(), browser: true }));
vi.mock('$app/navigation', () => ({
	beforeNavigate: (callback: typeof hooks.before) => { hooks.before = callback; },
	afterNavigate: () => {}, snapshot: () => {},
}));
vi.mock('svelte', async (original) => ({
	...await original<typeof import('svelte')>(),
	onMount: (callback: () => () => void) => { hooks.unmount = callback(); },
}));
import { attachLocaleHandoff, getNavigationCaptureY, localeHandoffKey, isLocaleHandoffNavigation } from './locale-handoff.svelte';
import { detailReadingPosition } from './detail-reading-position';

afterEach(() => { hooks.unmount(); vi.unstubAllGlobals(); });

it('retains an early departure during native unload and discards it when client navigation supersedes it', () => {
	attachLocaleHandoff();
	sessionStorage.setItem('yesid:early-locale', 'outgoing');
	const nav = { type: 'link', from: { url: new URL('https://yesid.dev/projects') },
		to: { url: new URL('https://yesid.dev/fr/projects') }, shallow: false,
		willUnload: true, event: new MouseEvent('click'), complete: Promise.resolve() };
	hooks.before(nav);
	expect(sessionStorage.getItem('yesid:early-locale')).toBe('outgoing');
	hooks.before({ ...nav, willUnload: false });
	expect(sessionStorage.getItem('yesid:early-locale')).toBeNull();
});

describe('locale-handoff stable route identity', () => {
	it('uses a translation-group identity instead of a locale-specific slug', () => {
		expect(localeHandoffKey('/blog/english-slug', 'blog:article-one')).toBe(
			'id:blog:article-one',
		);
		expect(localeHandoffKey('/fr/blog/slug-francais', 'blog:article-one')).toBe(
			'id:blog:article-one',
		);
	});

	it('recognizes different translated slugs as one locale handoff when identity is stable', () => {
		expect(
			isLocaleHandoffNavigation(
				'/blog/english-slug',
				'/fr/blog/slug-francais',
				'blog:article-one',
			),
		).toBe(true);
	});

	it('does not treat different slugs as a switch without a stable identity', () => {
		expect(
			isLocaleHandoffNavigation('/blog/english-slug', '/fr/blog/other-article'),
		).toBe(false);
	});
});

it('captures activation before layout moves and clears only its own completed navigation', async () => {
	attachLocaleHandoff();
	let finish = () => {};
	const complete = new Promise<void>((resolve) => { finish = resolve; });
	vi.stubGlobal('scrollY', 1400);
	const event = new MouseEvent('click', { bubbles: true });
	document.body.dispatchEvent(event);
	vi.stubGlobal('scrollY', 1442);
	const nav = { type: 'link', from: { url: new URL('https://yesid.dev/projects/yesid-dev') },
		to: { url: new URL('https://yesid.dev/projects') }, shallow: false, willUnload: false, event, complete };
	hooks.before(nav);
	const reading = detailReadingPosition('.reading-section');
	expect(reading.capture()).toEqual({ kind: 'offset', y: 1400 });
	// A prior completion must not clear the capture for a later navigation.
	let finishNext = () => {};
	const next = new Promise<void>((resolve) => { finishNext = resolve; });
	hooks.before({ ...nav, complete: next });
	finish();
	await complete;
	expect(getNavigationCaptureY()).toBe(1400);
	finishNext();
	await next;
	expect(getNavigationCaptureY()).toBeUndefined();
	reading.dispose();
});
