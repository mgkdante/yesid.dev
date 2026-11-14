import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AboutCta from './AboutCta.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { resolveLocale } from '#lib/utils/locale.ts';

it.each(['en', 'fr', 'es'] as const)('renders translated terminal lines and the contact destination in %s', (locale) => {
	render(AboutCta, { props: { cta: aboutPageContent.cta, stop: '10', label: 'Contact' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	expect(screen.getByTestId('about-cta-button')).toHaveAttribute('href', `${locale === 'en' ? '' : `/${locale}`}/contact`);
	for (const line of aboutPageContent.cta.lines) {
		expect(screen.getByText(typeof line.text === 'string' ? line.text : resolveLocale(line.text, locale))).toBeInTheDocument();
	}
});

it.each(['en', 'fr', 'es'] as const)('keeps old cached string lines verbatim in %s', (locale) => {
	const cta = { ...aboutPageContent.cta, lines: [{ text: '> Original shared line', color: 'muted' as const }] };
	render(AboutCta, { props: { cta, stop: '10', label: 'Contact' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	expect(screen.getByText('> Original shared line')).toBeInTheDocument();
});
