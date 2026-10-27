// AboutPolaroids: the render contract (counter, arrow cycling) and the active
// index surviving a remount (a language switch remounts the whole page).
//
// CMS-decoupling precedent (FeaturedProjects.test.ts): the polaroid SET is
// content-owned, so counts/derivations come from the same fixture the component
// consumes rather than hardcoded numbers.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/svelte';
import AboutPolaroids from './AboutPolaroids.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';

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
		expect(screen.getByText(polaroids[1].caption.en)).toBeInTheDocument();
		expect(counter().textContent).toBe(`2/${total}`);
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

describe('AboutPolaroids (remount)', () => {
	it('keeps the active polaroid when the page remounts', async () => {
		const first = renderPolaroids();
		const nextBtn = screen.getByLabelText(/next/i);
		await fireEvent.click(nextBtn);
		await fireEvent.click(nextBtn);
		first.unmount();

		renderPolaroids();
		expect(counter().textContent).toBe(`3/${total}`);
	});
});
