import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import MetricProof from './MetricProof.svelte';

const metric = { value: { en: '30 s' }, label: { en: 'refresh interval' } };

describe('MetricProof', () => {
	it('renders nothing for uncited metrics', () => {
		const { container } = render(MetricProof, { metric, locale: 'en' });
		expect(container.textContent).toBe('');
		expect(container.querySelector('a, time')).toBeNull();
	});
	it.each([
		['en', 'Source', 'As of', 'November 4, 2026'],
		['fr', 'Source', 'En date du', '4 novembre 2026'],
		['es', 'Fuente', 'Al', '4 de noviembre de 2026'],
	] as const)('renders localized accessible proof in %s', (locale, source, asOf, date) => {
		render(MetricProof, { metric: { ...metric, sourceUrl: 'https://example.org/evidence', asOf: '2026-11-04' }, locale });
		const info = { en: 'Metric information', fr: 'Informations sur la mesure', es: 'Información sobre la métrica' };
		const button = screen.getByRole('button', { name: `${info[locale]}: refresh interval` });
		expect(button.getAttribute('type')).toBe('button');
		expect(document.getElementById(button.getAttribute('popovertarget')!)?.getAttribute('popover')).toBe('auto');
		expect(screen.getByRole('link', { name: `${source}: refresh interval` }).getAttribute('href')).toBe('https://example.org/evidence');
		expect(screen.getByText(`${asOf} ${date}`)).toBeTruthy();
		expect(screen.getByText(`${asOf} ${date}`).getAttribute('datetime')).toBe('2026-11-04');
	});
	it('supports a source alone and a date alone', () => {
		const { unmount } = render(MetricProof, { metric: { ...metric, asOf: '2026-11-04' }, locale: 'en' });
		expect(screen.queryByRole('link')).toBeNull();
		unmount();
		render(MetricProof, { metric: { ...metric, sourceUrl: 'https://example.org/evidence' }, locale: 'en' });
		expect(screen.getByRole('link')).toBeTruthy();
		expect(document.querySelector('time')).toBeNull();
	});
	it('renders every named source alongside legacy proof and leaves an empty list invisible', () => {
		const { unmount } = render(MetricProof, { metric: { ...metric, sources: [] }, locale: 'en' });
		expect(screen.queryByRole('button')).toBeNull();
		unmount();
		render(MetricProof, { metric: { ...metric, sourceUrl: 'https://example.org', sources: [{ label: 'Example', url: 'https://example.net' }] }, locale: 'en' });
		expect(screen.getByRole('link', { name: 'Source: refresh interval' }).getAttribute('href')).toBe('https://example.org');
		expect(screen.getByRole('link', { name: 'Example: refresh interval' }).getAttribute('href')).toBe('https://example.net');
	});
});
