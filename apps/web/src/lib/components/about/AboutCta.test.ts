import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AboutCta from './AboutCta.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';

it.each(['en', 'fr', 'es'] as const)('renders localized CTA content in %s', (locale) => {
	const text = { en: 'Ready to discuss your project', fr: 'Parlons de votre projet', es: 'Hablemos de tu proyecto' };
	render(AboutCta, { props: { cta: { ...aboutPageContent.cta, lines: [{ text, color: 'muted' }] }, stop: '10', label: 'Contact' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	expect(screen.getByText(text[locale])).toBeInTheDocument();
});

it('omits untranslated legacy output in French while keeping the contact action', () => {
	render(AboutCta, { props: { cta: { ...aboutPageContent.cta, lines: [{ text: '> Ready for new projects', color: 'orange' }] }, stop: '10', label: 'Contact' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]) });
	expect(screen.queryByText(/Ready for new projects/)).toBeNull();
	expect(screen.getByTestId('about-cta-button')).toHaveAttribute('href', '/fr/contact');
});
