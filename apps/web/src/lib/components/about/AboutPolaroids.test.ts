// AboutPolaroids — slice-34.5 selections.
//
// The polaroid mini-carousel's active index survives a language switch. The
// component wires `currentIndex` to persisted('about-polaroid', 0), so the
// stored value is a locale-free integer registered with the locale-handoff
// orchestrator. These tests cover (a) the render contract (counter, arrow
// cycling) and (b) the switch-survival wiring (the index is captured under the
// 'about-polaroid' key and re-applies after a {#key} remount).
//
// CMS-decoupling precedent (FeaturedProjects.test.ts): the polaroid SET is
// content-owned, so counts/derivations come from the same fixture the component
// consumes rather than hardcoded numbers.

import { describe, it, expect, afterEach } from 'vitest';
import { flushSync } from 'svelte';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import AboutPolaroids from './AboutPolaroids.svelte';
import { aboutPageContent } from '$lib/content/about-page';
import { captureEntries, applyEntries } from '$lib/state/locale-handoff.svelte';

const polaroids = aboutPageContent.identity.polaroids;
const total = polaroids.length;

function renderPolaroids() {
	return render(AboutPolaroids, {
		props: { polaroids, stop: '08', label: 'SNAPSHOTS' },
	});
}

function counter(): HTMLElement {
	return screen.getByTestId('about-polaroid-counter');
}

afterEach(() => cleanup());

describe('AboutPolaroids (render contract)', () => {
	it('renders the component with its testid', () => {
		renderPolaroids();
		expect(screen.getByTestId('about-polaroids')).toBeInTheDocument();
	});

	it('starts on the first polaroid (1/N)', () => {
		renderPolaroids();
		expect(counter().textContent).toBe(`1/${total}`);
	});

	it('next() advances the counter and wraps past the end', async () => {
		renderPolaroids();
		const nextBtn = screen.getByLabelText(/next/i);
		await fireEvent.click(nextBtn);
		expect(counter().textContent).toBe(`2/${total}`);
		// Click to the end, then once more to wrap back to 1.
		for (let i = 2; i < total; i++) await fireEvent.click(nextBtn);
		expect(counter().textContent).toBe(`${total}/${total}`);
		await fireEvent.click(nextBtn);
		expect(counter().textContent).toBe(`1/${total}`);
	});

	it('prev() from the first polaroid wraps to the last', async () => {
		renderPolaroids();
		await fireEvent.click(screen.getByLabelText(/previous/i));
		expect(counter().textContent).toBe(`${total}/${total}`);
	});
});

describe('AboutPolaroids (slice-34.5 switch survival)', () => {
	it('registers the active index under "about-polaroid" so a switch captures it', async () => {
		renderPolaroids();
		// Default index captured (locale-free integer, not a translated string).
		expect(captureEntries()['about-polaroid']).toBe(0);

		// Advance twice → index 2, and the captured value tracks it live.
		const nextBtn = screen.getByLabelText(/next/i);
		await fireEvent.click(nextBtn);
		await fireEvent.click(nextBtn);
		expect(counter().textContent).toBe(`3/${total}`);
		expect(captureEntries()['about-polaroid']).toBe(2);
	});

	it('restores the carried index after a {#key} remount (the switch round-trip)', async () => {
		const first = renderPolaroids();
		const nextBtn = screen.getByLabelText(/next/i);
		await fireEvent.click(nextBtn);
		await fireEvent.click(nextBtn);
		const snapshot = captureEntries(); // { 'about-polaroid': 2, ... }
		expect(snapshot['about-polaroid']).toBe(2);

		// Simulate the language switch: the {#key $page.url.pathname} subtree
		// unmounts (every rune destroyed) and the page remounts at default state.
		first.unmount();
		renderPolaroids();
		expect(counter().textContent).toBe(`1/${total}`); // fresh mount = default

		// The orchestrator applies the captured blob onto the remounted consumer
		// (calls the registered setter → mutates the rune). flushSync runs the
		// derived recompute so the DOM reflects the restored index.
		applyEntries(snapshot);
		flushSync();
		expect(counter().textContent).toBe(`3/${total}`); // index 2 restored
	});

	it('unregisters on unmount (no stale entry leaks across pages)', () => {
		const view = renderPolaroids();
		expect('about-polaroid' in captureEntries()).toBe(true);
		view.unmount();
		expect('about-polaroid' in captureEntries()).toBe(false);
	});
});
