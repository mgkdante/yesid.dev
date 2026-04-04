import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import HeroVideoCard from './HeroVideoCard.svelte';

describe('HeroVideoCard', () => {
	it('renders a video element with correct attributes', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const video = container.querySelector('video');
		expect(video).toBeInTheDocument();
		expect(video?.getAttribute('playsinline')).not.toBeNull();
		expect(video?.muted).toBe(true);
		expect(video?.getAttribute('preload')).toBe('auto');
	});

	it('renders WebM and MP4 source elements', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const sources = container.querySelectorAll('video source');
		expect(sources).toHaveLength(2);

		const types = Array.from(sources).map((s) => s.getAttribute('type'));
		expect(types).toContain('video/webm');
		expect(types).toContain('video/mp4');
	});

	it('renders a poster attribute on the video', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		const video = container.querySelector('video');
		expect(video?.getAttribute('poster')).toBe('/video/hero-train-poster.webp');
	});

	it('has data-testid for integration tests', () => {
		render(HeroVideoCard, {
			props: { scrollProgress: 0 }
		});

		expect(screen.getByTestId('hero-video-card')).toBeInTheDocument();
	});

	it('renders overlay container when showOverlays is true', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5, showOverlays: true }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).toBeInTheDocument();
	});

	it('hides overlay container when showOverlays is false', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5, showOverlays: false }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).not.toBeInTheDocument();
	});

	it('defaults showOverlays to true', () => {
		const { container } = render(HeroVideoCard, {
			props: { scrollProgress: 0.5 }
		});

		expect(container.querySelector('[data-testid="hero-overlays"]')).toBeInTheDocument();
	});
});
