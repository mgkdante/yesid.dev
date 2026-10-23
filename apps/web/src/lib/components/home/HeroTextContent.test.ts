import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

const analyticsMocks = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock('$lib/analytics/client', () => analyticsMocks);

import HeroTextContent from './HeroTextContent.svelte';
import { generateHeroData } from '$lib/live';

beforeEach(() => {
	analyticsMocks.trackAnalyticsEvent.mockClear();
});

function baseProps(overrides: Record<string, unknown> = {}) {
	return {
		headlineLine1: 'SYSTEMS WE BUILD',
		headlineLine2: 'STAY AVAILABLE.',
		headlineAriaSuffix: 'stay available.',
		subheadlineText: 'sub',
		subtitleText: 'subtitle',
		ctaWorkLabel: 'See the work',
		ctaContactLabel: 'Contact',
		heroData: generateHeroData(),
		replayAriaLabel: 'Replay intro',
		...overrides,
	};
}

async function clickWithoutNavigating(link: HTMLElement) {
	const preventNavigation = (event: Event) => event.preventDefault();
	link.addEventListener('click', preventNavigation);
	try {
		await fireEvent.click(link);
	} finally {
		link.removeEventListener('click', preventNavigation);
	}
}

describe('HeroTextContent — hero dot replay affordance (go2/w5)', () => {
	it('tracks the Cal.com CTA as a booking click', async () => {
		render(HeroTextContent, { props: baseProps() });
		await clickWithoutNavigating(screen.getByTestId('hero-cta-contact'));

		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledTimes(1);
		expect(analyticsMocks.trackAnalyticsEvent).toHaveBeenCalledWith('booking_click');
	});

	it('removes the identity eyebrow from the hero', () => {
		render(HeroTextContent, { props: baseProps() });
		expect(screen.queryByTestId('hero-kicker')).toBeNull();
	});

	it.each([['en', 'click me'], ['fr', 'clique ici'], ['es', 'haz clic']])('localizes the annotation in %s', (locale, label) => {
		render(HeroTextContent, {
			props: baseProps({ beaconSettled: true }),
			context: new Map([[Symbol.for('yesid.locale'), () => locale]]),
		});
		expect(screen.getByTestId('hero-annotation-label').textContent).toBe(label);
	});

	it('does not track the projects CTA as a booking click', async () => {
		render(HeroTextContent, { props: baseProps() });
		await clickWithoutNavigating(screen.getByTestId('hero-cta-projects'));

		expect(analyticsMocks.trackAnalyticsEvent).not.toHaveBeenCalled();
	});

	it('keeps the native dot button dormant when playback is unavailable', () => {
		render(HeroTextContent, { props: baseProps({ replayEnabled: false }) });
		const btn = screen.getByTestId('hero-dot-replay');
		expect(btn.tagName).toBe('BUTTON');
		expect(btn).toBeDisabled();
		expect(btn).toHaveAttribute('aria-hidden', 'true');
		expect(btn).not.toHaveClass('hero-dot-armed');
		// The dot svg itself stays in place — it is the zoom transform-origin.
		expect(btn.querySelector('[data-testid="hero-dot"]')).not.toBeNull();
	});

	it('exposes the available dot with its meaningful accessible label', () => {
		render(HeroTextContent, { props: baseProps({ replayEnabled: true }) });
		const btn = screen.getByTestId('hero-dot-replay');
		expect(btn).toBeEnabled();
		expect(btn).not.toHaveAttribute('aria-hidden');
		expect(btn).toHaveAttribute('aria-label', 'Replay intro');
		expect(btn).toHaveClass('hero-dot-armed');
	});

	it('click on the armed dot fires onReplay', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ replayEnabled: true, onReplay }) });
		await fireEvent.click(screen.getByTestId('hero-dot-replay'));
		expect(onReplay).toHaveBeenCalledTimes(1);
	});

	it('click on the dormant dot does nothing (disabled)', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ replayEnabled: false, onReplay }) });
		await fireEvent.click(screen.getByTestId('hero-dot-replay'));
		expect(onReplay).not.toHaveBeenCalled();
	});

	it('keeps the headline text hidden from AT while exposing the armed button', () => {
		render(HeroTextContent, { props: baseProps({ replayEnabled: true }) });
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

	it('renders click me as decorative native SVG outside the activation button', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ replayEnabled: true, beaconSettled: true, onReplay }) });
		const annotation = screen.getByTestId('hero-dot-annotation');
		expect(annotation.tagName.toLowerCase()).toBe('svg');
		expect(annotation).toHaveAttribute('aria-hidden', 'true');
		expect(annotation).toHaveAttribute('focusable', 'false');
		expect(annotation).not.toHaveAttribute('tabindex');
		expect(annotation.textContent).toBe('click me');
		expect(annotation.closest('button, a')).toBeNull();
		await fireEvent.click(annotation);
		expect(onReplay).not.toHaveBeenCalled();
	});
});
