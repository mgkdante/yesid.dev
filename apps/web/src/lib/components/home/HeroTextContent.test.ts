import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HeroTextContent from './HeroTextContent.svelte';
import { generateHeroData } from '$lib/content';

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		headlineLine1: 'PIPELINES THAT',
		headlineLine2: "DON'T BREAK.",
		headlineAriaSuffix: "don't break.",
		subheadlineText: 'sub',
		subtitleText: 'subtitle',
		identityText: 'freelance digital infrastructure - Montreal',
		ctaWorkLabel: 'See the work',
		ctaContactLabel: 'Contact',
		heroData: generateHeroData(),
		replayAriaLabel: 'Replay intro',
		...overrides,
	};
}

describe('HeroTextContent — hero dot replay affordance (go2/w5)', () => {
	it('renders the dot inside a button, dormant while the intro has not completed', () => {
		render(HeroTextContent, { props: baseProps({ introCompleted: false }) });
		const btn = screen.getByTestId('hero-dot-replay');
		expect(btn.tagName).toBe('BUTTON');
		expect(btn).toBeDisabled();
		expect(btn).toHaveAttribute('aria-hidden', 'true');
		expect(btn).not.toHaveClass('hero-dot-armed');
		// The dot svg itself stays in place — it is the zoom transform-origin.
		expect(btn.querySelector('[data-testid="hero-dot"]')).not.toBeNull();
	});

	it('arms after intro completion: enabled, pulsing, aria "Replay intro"', () => {
		render(HeroTextContent, { props: baseProps({ introCompleted: true }) });
		const btn = screen.getByTestId('hero-dot-replay');
		expect(btn).toBeEnabled();
		expect(btn).not.toHaveAttribute('aria-hidden');
		expect(btn).toHaveAttribute('aria-label', 'Replay intro');
		expect(btn).toHaveClass('hero-dot-armed');
	});

	it('click on the armed dot fires onReplay', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ introCompleted: true, onReplay }) });
		await fireEvent.click(screen.getByTestId('hero-dot-replay'));
		expect(onReplay).toHaveBeenCalledTimes(1);
	});

	it('click on the dormant dot does nothing (disabled)', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ introCompleted: false, onReplay }) });
		await fireEvent.click(screen.getByTestId('hero-dot-replay'));
		expect(onReplay).not.toHaveBeenCalled();
	});

	it('keeps the headline text hidden from AT while exposing the armed button', () => {
		render(HeroTextContent, { props: baseProps({ introCompleted: true }) });
		const line2 = screen.getByTestId('hero-line2');
		// Decorative text span stays aria-hidden (h1 carries the aria-label)…
		const textSpan = line2.querySelector('[data-hero-stagger="1"]');
		expect(textSpan).toHaveAttribute('aria-hidden', 'true');
		// …but the button must NOT sit inside an aria-hidden ancestor, or AT
		// could never reach "Replay intro".
		const btn = screen.getByTestId('hero-dot-replay');
		let node: HTMLElement | null = btn.parentElement;
		while (node) {
			expect(node).not.toHaveAttribute('aria-hidden', 'true');
			node = node.parentElement;
		}
	});
});
