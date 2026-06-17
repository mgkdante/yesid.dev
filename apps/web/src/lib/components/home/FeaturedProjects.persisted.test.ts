// FeaturedProjects — slice-34.5 selections (persisted-wiring slice).
//
// The featured-projects carousel's focused card survives a language switch. The
// component wires the snap index to persisted('featured-card', 0) — a locale-free
// integer registered with the locale-handoff orchestrator. The actual scroll
// restore happens inside onEmblaInit (Embla is async), which can't fire in
// happy-dom (no layout engine), so these tests cover the parts that DO run on the
// server-equivalent mount: the registration with the orchestrator and the counter
// reflecting the persisted value. The end-to-end scroll restore is exercised by
// the Playwright spec.
//
// Render shape mirrors FeaturedProjects.test.ts (CMS-decoupling precedent).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { flushSync } from 'svelte';
import { render, screen, cleanup } from '@testing-library/svelte';
import FeaturedProjects from './FeaturedProjects.svelte';
import { proofReelContent } from '$lib/content/site-content';
import { getFeaturedProjects, getVisibleServices } from '$lib/content';
import type { Project } from '$lib/types';
import { captureEntries, applyEntries } from '$lib/state/locale-handoff.svelte';

vi.mock('$lib/directus/assets', () => ({
	asset: (id: string, preset?: string) => `/test-assets/${id}${preset ? `?key=${preset}` : ''}`,
	buildSrcSet: () => '',
}));

const resolvedProjects: readonly Project[] = getFeaturedProjects();
const services = getVisibleServices();
const renderProps = { proofReel: proofReelContent, projects: resolvedProjects, services };

function currentCounter(): HTMLElement {
	const el = screen.getByTestId('proof-count').querySelector<HTMLElement>('.proof-count-current');
	expect(el, 'position counter must render').not.toBeNull();
	return el!;
}

afterEach(() => cleanup());

describe('FeaturedProjects (slice-34.5 switch survival)', () => {
	it('registers the card index under "featured-card" so a switch captures it', () => {
		render(FeaturedProjects, { props: renderProps });
		flushSync(); // run the persisted() registration $effect
		// Default snap index captured — a locale-free integer, valid in any locale.
		expect(captureEntries()['featured-card']).toBe(0);
	});

	it('the position counter reflects the persisted card value (currentIndex mirror)', () => {
		render(FeaturedProjects, { props: renderProps });
		flushSync();
		// Cold mount: card.value defaults to 0 → "01".
		expect(currentCounter().textContent).toBe('01');
	});

	it('restoring the carried index re-renders the counter after a remount', () => {
		// Cold render → capture a non-zero snapshot via the registered setter, as the
		// orchestrator does on the remounted page (Embla init would resync the live
		// scroll position; here we assert the rune→DOM path the counter depends on).
		const first = render(FeaturedProjects, { props: renderProps });
		flushSync();

		const restoredIndex = Math.max(0, resolvedProjects.length - 1);
		const restoredLabel = String(restoredIndex + 1).padStart(2, '0');
		// Simulate the orchestrator restoring the final valid index.
		applyEntries({ 'featured-card': restoredIndex });
		flushSync();
		expect(currentCounter().textContent).toBe(restoredLabel);

		first.unmount();
		// After unmount the entry is gone — no stale leak across pages.
		expect('featured-card' in captureEntries()).toBe(false);
	});
});
