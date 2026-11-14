import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import AboutInterests from './AboutInterests.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { resolveLocale } from '#lib/utils/locale.ts';

afterEach(cleanup);

it('uses CMS credits and preserves today’s credit when the new field is empty', async () => {
	const transit = aboutPageContent.interests.find(interest => interest.id === 'transit')!;
	const view = render(AboutInterests, { props: { interests: [{ ...transit, credit: { en: 'CMS credit', fr: 'Crédit CMS' } }], stop: '07', label: 'Interests' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => 'fr']]) });
	expect(screen.getByText('Crédit CMS')).toBeInTheDocument();
	await view.rerender({ interests: [{ ...transit, credit: undefined }], stop: '07', label: 'Interests' });
	expect(screen.getByText('Harrison Keely · CC BY 4.0')).toBeInTheDocument();
});

it.each(['en', 'fr', 'es'] as const)('names each interest and expands only the chosen button in %s', async locale => {
	render(AboutInterests, { props: { interests: aboutPageContent.interests, stop: '07', label: 'Interests' },
		context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
	const buttons = aboutPageContent.interests.map(interest => screen.getByRole('button', { name: resolveLocale(interest.label, locale) }));
	for (const button of buttons) expect(button).toHaveAttribute('aria-expanded', 'false');
	await fireEvent.click(buttons[0]);
	expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
	await fireEvent.click(buttons[1]);
	expect(buttons[0]).toHaveAttribute('aria-expanded', 'false');
	expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
	await fireEvent.click(buttons[1]);
	for (const button of buttons) expect(button).toHaveAttribute('aria-expanded', 'false');
	expect(screen.getByText('Harrison Keely · CC BY 4.0')).toBeInTheDocument();
	expect(screen.getByText('NASA')).toBeInTheDocument();
	expect(screen.getByRole('button', { name: resolveLocale(aboutPageContent.interests.find(interest => interest.id === 'transit')!.label, locale) })).toHaveAccessibleDescription('Harrison Keely · CC BY 4.0');
});
