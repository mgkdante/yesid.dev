import { afterEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import AboutInterests from './AboutInterests.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { resolveLocale } from '#lib/utils/locale.ts';

afterEach(cleanup);

it.each(['en', 'fr', 'es'] as const)('selects Transit by default and keeps one pressed photo in %s', async locale => {
 render(AboutInterests, { props: { interests: aboutPageContent.interests, stop: '07', label: 'Interests' }, context: new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]) });
 const transit = aboutPageContent.interests.find(item => item.id === 'transit')!;
 const selected = screen.getByRole('button', { name: resolveLocale(transit.label, locale), pressed: true });
 expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
 expect(screen.queryByText('Harrison Keely · CC BY 4.0')).toBeNull();
 await fireEvent.click(selected);
 expect(selected).toHaveAttribute('aria-pressed', 'true');
 const anime = aboutPageContent.interests[0];
 await fireEvent.click(screen.getByRole('button', { name: resolveLocale(anime.label, locale) }));
 expect(selected).toHaveAttribute('aria-pressed', 'false');
 expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1);
 expect(screen.queryByTestId('interest-credit-trigger')).toBeNull();
});

it('shows the selected CMS attribution in a sibling popover, never inside a selection button', async () => {
 const transit = aboutPageContent.interests.find(item => item.id === 'transit')!;
 render(AboutInterests, { props: { interests: [{ ...transit, credit: { en: 'CMS credit' } }], stop: '07', label: 'Interests' } });
 const trigger = screen.getByTestId('interest-credit-trigger');
 expect(trigger.closest('[aria-pressed]')).toBeNull();
 await fireEvent.click(trigger);
 expect(await screen.findByRole('dialog')).toHaveTextContent('CMS credit');
});

it('keeps the existing attribution available while the new CMS credit is empty', async () => {
 const transit = aboutPageContent.interests.find(item => item.id === 'transit')!;
 render(AboutInterests, { props: { interests: [{ ...transit, credit: undefined }], stop: '07', label: 'Interests' } });
 await fireEvent.click(screen.getByTestId('interest-credit-trigger'));
 expect(await screen.findByRole('dialog')).toHaveTextContent('Harrison Keely · CC BY 4.0');
});
