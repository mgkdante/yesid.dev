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

const polaroidSizes = '(min-width: 1024px) min(16vw, 373px), (min-width: 640px) 192px, 160px';

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

	it('exposes responsive candidates and intrinsic dimensions for the initial polaroid', () => {
		renderPolaroids();
		const image = screen.getByRole('img', {
			name: 'Walking with my dog in Montreal',
		});

		expect(image).toHaveAttribute('src', '/images/about/polaroid-1.webp');
		expect(image).toHaveAttribute(
			'srcset',
			'/images/about/polaroid-1.w240.webp 240w, /images/about/polaroid-1.w600.webp 600w',
		);
		expect(image).toHaveAttribute('sizes', polaroidSizes);
		expect(image).toHaveAttribute('width', '600');
		expect(image).toHaveAttribute('height', '800');
	});

	it('updates responsive media metadata without changing carousel state or presentation', async () => {
		renderPolaroids();
		await fireEvent.click(screen.getByLabelText(/next/i));

		const image = screen.getByRole('img', { name: 'Dante, the family dog' });
		expect(image).toHaveAttribute('src', '/images/about/polaroid-dante.webp');
		expect(image).toHaveAttribute(
			'srcset',
			'/images/about/polaroid-dante.w240.webp 240w, /images/about/polaroid-dante.w600.webp 600w, /images/about/polaroid-dante.w1100.webp 1100w',
		);
		expect(image).toHaveAttribute('sizes', polaroidSizes);
		expect(image).toHaveAttribute('width', '1100');
		expect(image).toHaveAttribute('height', '1382');
		expect(image.parentElement?.parentElement).toHaveStyle('transform: rotate(3deg)');
		expect(screen.getByText("Dante, the family's good boy")).toBeInTheDocument();
		expect(counter().textContent).toBe(`2/${total}`);
		expect(captureEntries()['about-polaroid']).toBe(1);
	});

	it('keeps the canonical source and omits responsive attributes for unmapped media', () => {
		const unmappedPolaroids = [{ ...polaroids[0], src: '/images/about/unmapped-polaroid.webp' }];
		render(AboutPolaroids, {
			props: { polaroids: unmappedPolaroids, stop: '08', label: 'SNAPSHOTS' },
		});

		const image = screen.getByRole('img', {
			name: 'Walking with my dog in Montreal',
		});
		expect(image).toHaveAttribute('src', '/images/about/unmapped-polaroid.webp');
		expect(image).not.toHaveAttribute('srcset');
		expect(image).not.toHaveAttribute('sizes');
		expect(image).not.toHaveAttribute('width');
		expect(image).not.toHaveAttribute('height');
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
