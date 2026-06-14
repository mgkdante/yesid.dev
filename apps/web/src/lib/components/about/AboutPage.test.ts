import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import AboutPage from './AboutPage.svelte';
// slice-18i Phase 7C: AboutPage now requires aboutPage prop (previously imported
// from static module directly inside the component). Pass static fixture here.
import { aboutPageContent } from '$lib/content/about-page';

describe('AboutPage', () => {
	it('renders with data-testid page-about', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('page-about')).toBeTruthy();
	});

	it('keeps the top hazard stripe but renders NONE below the bento — the footer platform edge owns the bottom seam', () => {
		// GO2-W5 final batch (6b): the page-level bottom stripe stacked on the
		// footer's platform-edge tape. Only the top stripe remains page-owned;
		// tapes INSIDE cards (e.g. the CTA terminal chrome) are fine.
		const { container } = render(AboutPage, {
			props: { aboutPage: aboutPageContent, weather: null },
		});
		const section = screen.getByTestId('page-about');
		const stripes = Array.from(
			container.querySelectorAll('div[style*="repeating-linear-gradient"]'),
		);
		const before = stripes.filter(
			(el) => section.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING,
		);
		const below = stripes.filter((el) => {
			const pos = section.compareDocumentPosition(el);
			return (
				pos & Node.DOCUMENT_POSITION_FOLLOWING && !(pos & Node.DOCUMENT_POSITION_CONTAINED_BY)
			);
		});
		expect(before.length).toBe(1); // the top stripe survives
		expect(below).toEqual([]); // nothing tape-shaped between the page and the footer
	});

	it('renders metro stop labels on cards', () => {
		// GO2-W5: StopLabel wraps the digits in a wayfinding span, so match the
		// combined textContent of the stop-label nodes.
		const { container } = render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const labels = Array.from(container.querySelectorAll('[data-slot="stop-label"]')).map(
			(el) => el.textContent,
		);
		expect(labels).toContain('STOP 00 · IDENTITY');
		expect(labels).toContain('STOP 08 · SNAPSHOTS');
	});

	it('renders the identity section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-identity')).toBeTruthy();
	});

	it('renders the polaroids section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-polaroids')).toBeTruthy();
	});

	it('renders the metrics section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-metrics')).toBeTruthy();
	});

	it('renders the methodology section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-method')).toBeTruthy();
	});

	it('renders the testimonials section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-testimonials')).toBeTruthy();
	});

	it('renders the education section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const education = screen.getByTestId('about-education');
		expect(education).toBeTruthy();
		expect(education.textContent).toContain('Champlain Regional College');
		expect(education.textContent).toContain("Bishop's University");
	});

	it('renders the weather section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-weather')).toBeTruthy();
	});

	it('renders the interests section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-interests')).toBeTruthy();
	});

	it('renders the languages section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const languages = screen.getByTestId('about-languages');
		expect(languages).toBeTruthy();
		expect(languages.textContent).toContain('Español');
		expect(languages.textContent).toContain('English');
		expect(languages.textContent).toContain('Français');
	});

	it('renders exactly one playful quote with no carousel controls', () => {
		const { container } = render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const testimonials = screen.getByTestId('about-testimonials');
		expect(testimonials.textContent).toContain(
			"You have the gift of perseverance, and that's what makes you a genius too.",
		);
		expect(testimonials.textContent).toContain('Guy Sensei');
		expect(container.querySelector('[role="tablist"]')).toBeNull();
	});

	it('renders seven polaroids in the counter', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-polaroids').textContent).toContain('1/7');
	});

	it('renders the interests attribution credit line', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-interests').textContent).toContain(
			'Transit photo: Harrison Keely · CC BY 4.0 · Space: NASA',
		);
	});

	it('renders the CTA section', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-cta')).toBeTruthy();
	});

	it('CTA links to /contact', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const cta = screen.getByTestId('about-cta');
		const link = cta.querySelector('a[href="/contact"]');
		expect(link).toBeTruthy();
	});

	it('renders weather fallback when no data', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const weatherWidget = screen.getByTestId('about-weather');
		expect(weatherWidget.textContent).toContain('Montreal');
		expect(weatherWidget.textContent).toContain('—');
	});

	it('renders weather data when provided', () => {
		render(AboutPage, {
			props: { aboutPage: aboutPageContent, weather: { temp: 15, condition: 'clear sky', icon: '01d' } }
		});
		const weatherWidget = screen.getByTestId('about-weather');
		expect(weatherWidget.textContent).toContain('15°C');
		expect(weatherWidget.textContent).toContain('clear sky');
	});

	// slice-28.1 (audit #20/#122): SSR-baked weather is CDN-stale; AboutWeather
	// refreshes from /api/weather in onMount. Default setup.dom stub returns
	// null — this test overrides fetch to exercise the fresh-data branch.
	it('refreshes weather from /api/weather on mount', async () => {
		const prevFetch = globalThis.fetch;
		globalThis.fetch = vi.fn().mockResolvedValue(
			new Response(JSON.stringify({ temp: -21, condition: 'blowing snow', icon: '13d' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		) as typeof globalThis.fetch;
		try {
			render(AboutPage, {
				props: { aboutPage: aboutPageContent, weather: { temp: 15, condition: 'clear sky', icon: '01d' } }
			});
			const weatherWidget = screen.getByTestId('about-weather');
			await waitFor(() => {
				expect(weatherWidget.textContent).toContain('-21°C');
			});
			expect(weatherWidget.textContent).toContain('blowing snow');
			expect(weatherWidget.textContent).not.toContain('15°C');
		} finally {
			globalThis.fetch = prevFetch;
		}
	});

	it('does not render its own footer (layout provides it)', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		// Footer comes from +layout.svelte, not AboutPage
		const footers = screen.queryAllByTestId('footer');
		expect(footers.length).toBe(0);
	});
});

describe('Card Unification Sweep', () => {
	const srcDir = join(process.cwd(), 'src');

	function findSvelteFiles(dir: string): string[] {
		const files: string[] = [];
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const fullPath = join(dir, entry.name);
			if (entry.isDirectory() && !entry.name.startsWith('.')) {
				files.push(...findSvelteFiles(fullPath));
			} else if (entry.name.endsWith('.svelte')) {
				files.push(fullPath);
			}
		}
		return files;
	}

	it('has zero .bento-card class usage in any .svelte file', () => {
		const svelteFiles = findSvelteFiles(srcDir);
		const violations: string[] = [];

		for (const file of svelteFiles) {
			const content = readFileSync(file, 'utf-8');
			if (content.includes('bento-card')) {
				violations.push(file.replace(process.cwd() + '/', ''));
			}
		}

		expect(violations, `Files still using .bento-card:\n${violations.join('\n')}`).toEqual([]);
	});

	it('has zero .bento-card in app.css', () => {
		const appCss = readFileSync(join(srcDir, 'app.css'), 'utf-8');
		expect(appCss).not.toContain('bento-card');
	});
});
