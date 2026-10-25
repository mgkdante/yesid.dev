import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';

const analyticsMocks = vi.hoisted(() => ({
	trackAnalyticsEvent: vi.fn(),
}));

vi.mock('#lib/analytics/client.ts', () => analyticsMocks);

import HeroTextContent from './HeroTextContent.svelte';
import { generateHeroData } from '#lib/live/index.ts';

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

	it.each([
		['BUILD WITH CONFIDENCE', 'KEEP MOVING', 'keep moving.'],
		['DES SYSTÈMES DURABLES', 'TOUJOURS DISPONIBLES', 'toujours disponibles.'],
		['SISTEMAS PARA CRECER', 'SIGUEN FUNCIONANDO', 'siguen funcionando.'],
	])('renders supplied headline and action copy: %s', (headlineLine1, headlineLine2, headlineAriaSuffix) => {
		const props = baseProps({ headlineLine1, headlineLine2, headlineAriaSuffix });
		render(HeroTextContent, { props });
		expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(`${headlineLine1} ${headlineAriaSuffix}`);
		expect(screen.getByTestId('hero-line2')).toHaveTextContent(headlineLine2);
		expect(screen.getByTestId('hero-cta-projects')).toHaveTextContent(props.ctaWorkLabel);
		expect(screen.getByTestId('hero-cta-contact')).toHaveTextContent(props.ctaContactLabel);
	});

	it('provides nonempty, distinct annotation content for each locale', () => {
		const locales = ['en', 'fr', 'es'];
		const labels = locales.map(locale => {
			const view = render(HeroTextContent, {
				props: baseProps({ beaconSettled: true }),
				context: new Map([[Symbol.for('yesid.locale'), () => locale]]),
			});
			const label = screen.getByTestId('hero-annotation-label').textContent?.trim();
			expect(label).toBeTruthy();
			view.unmount();
			return label;
		});
		expect(new Set(labels).size).toBe(locales.length);
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
		// The dot svg itself stays in place — it is the zoom transform-origin.
		expect(btn.querySelector('[data-testid="hero-dot"]')).not.toBeNull();
	});

	it('exposes the available dot with its meaningful accessible label', () => {
		const replayAriaLabel = 'Play the network illustration';
		render(HeroTextContent, { props: baseProps({ replayEnabled: true, replayAriaLabel }) });
		const btn = screen.getByTestId('hero-dot-replay');
		expect(btn).toBeEnabled();
		expect(btn).not.toHaveAttribute('aria-hidden');
		expect(btn).toHaveAccessibleName(replayAriaLabel);
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

	it('renders noninteractive decorative guidance outside the activation button', async () => {
		const onReplay = vi.fn();
		render(HeroTextContent, { props: baseProps({ replayEnabled: true, beaconSettled: true, onReplay }) });
		const annotation = screen.getByTestId('hero-dot-annotation');
		expect(annotation.tagName.toLowerCase()).toBe('svg');
		expect(annotation).toHaveAttribute('aria-hidden', 'true');
		expect(annotation).toHaveAttribute('focusable', 'false');
		expect(annotation).not.toHaveAttribute('tabindex');
		expect(annotation.textContent?.trim()).toBeTruthy();
		expect(annotation.closest('button, a')).toBeNull();
		await fireEvent.click(annotation);
		expect(onReplay).not.toHaveBeenCalled();
	});
});
