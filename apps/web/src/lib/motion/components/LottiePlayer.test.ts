import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LottiePlayer from './LottiePlayer.svelte';

// lottie-web is mocked globally in src/tests/setup.ts.

describe('LottiePlayer component', () => {
	it('renders a container element with data-testid="lottie-player"', () => {
		render(LottiePlayer, { props: { src: '/lottie/station-sql.json' } });
		expect(screen.getByTestId('lottie-player')).toBeInTheDocument();
	});

	it('has role="img" for screen reader accessibility', () => {
		render(LottiePlayer, { props: { src: '/lottie/station-sql.json' } });
		expect(screen.getByRole('img')).toBeInTheDocument();
	});

	it('has an aria-label', () => {
		render(LottiePlayer, { props: { src: '/lottie/station-sql.json' } });
		const el = screen.getByRole('img');
		expect(el.getAttribute('aria-label')).toBeTruthy();
	});

	it('accepts src prop without error', () => {
		expect(() =>
			render(LottiePlayer, { props: { src: '/lottie/station-pipeline.json' } })
		).not.toThrow();
	});

	it('accepts trigger prop without error', () => {
		expect(() =>
			render(LottiePlayer, { props: { src: '/lottie/station-sql.json', trigger: 'scroll' } })
		).not.toThrow();
	});

	it('accepts loop prop without error', () => {
		expect(() =>
			render(LottiePlayer, { props: { src: '/lottie/station-sql.json', loop: true } })
		).not.toThrow();
	});

	it('accepts speed prop without error', () => {
		expect(() =>
			render(LottiePlayer, { props: { src: '/lottie/station-sql.json', speed: 0.8 } })
		).not.toThrow();
	});

	it('renders the lottie-player div with lottie-player class', () => {
		render(LottiePlayer, { props: { src: '/lottie/station-sql.json' } });
		const el = screen.getByTestId('lottie-player');
		expect(el.classList.contains('lottie-player')).toBe(true);
	});
});
