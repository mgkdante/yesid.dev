import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AboutCta from './AboutCta.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';

it.each(['en', 'fr', 'es'] as const)('localizes the CTA button destination in %s without changing stored output', (locale) => {
	render(AboutCta, { props: { cta: aboutPageContent.cta, stop: '10', label: 'Contact' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	expect(screen.getByTestId('about-cta-button')).toHaveAttribute('href', `${locale === 'en' ? '' : `/${locale}`}/contact`);
	expect(screen.getByText(aboutPageContent.cta.lines[0].text)).toBeInTheDocument();
});
