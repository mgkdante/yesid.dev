import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import AboutPage from './AboutPage.svelte';
// slice-18i Phase 7C: AboutPage now requires aboutPage prop (previously imported
// from static module directly inside the component). Pass static fixture here.
import { aboutPageContent } from '$lib/content/about-page';

vi.mock('$lib/directus/assets', () => ({
	asset: (id: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
	assetImage: (id: string) => ({ src: `/test-assets/${id}` }),
}));

describe('AboutPage', () => {
	it('renders with data-testid page-about', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('page-about')).toBeTruthy();
	});

	it('keeps the top hazard stripe but renders NONE below the bento, since the footer platform edge owns the bottom seam', () => {
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

	it('sources the CTA terminal chrome title from CMS labels', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/components/about/AboutCta.svelte'), 'utf-8');
		expect(source).toContain('siteLabels.ui.terminalTitle');
		expect(source).not.toContain('title="terminal"');
	});

	it('renders identity without availability dot and keeps the headshot frame circular', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const identity = screen.getByTestId('about-identity');
		expect(identity.querySelector('[data-slot="status-dot"]')).toBeNull();
		expect(identity.querySelector('h1')).toBeNull();
		expect(identity.textContent).toContain("I'm Yesid, a Montreal builder");
		expect(screen.getByTestId('about-headshot-frame').getAttribute('class')).toContain('rounded-full');
		expect(screen.getByTestId('about-headshot-frame').getAttribute('class')).toContain('overflow-hidden');
		expect(screen.getByTestId('about-headshot').getAttribute('class')).toContain('rounded-full');
		expect(screen.getByTestId('about-headshot').getAttribute('class')).toContain('block');
		expect(screen.getByTestId('about-headshot').getAttribute('class')).toContain('object-[50%_42%]');
		expect(screen.getByTestId('about-headshot').getAttribute('class')).toContain('scale-[1.08]');
		expect(screen.getByTestId('about-headshot').getAttribute('style')).toContain('scale: 1.08');
		expect(screen.getByTestId('about-headshot').getAttribute('style')).toContain('height: 100%');
		expect(screen.getByTestId('about-headshot').getAttribute('srcset')).toContain(
			'/images/about/headshot.w240.webp 240w',
		);
		expect(screen.getByTestId('about-headshot').getAttribute('srcset')).toContain(
			'/images/about/headshot.w800.webp 800w',
		);
		expect(screen.getByTestId('about-headshot').getAttribute('sizes')).toBe(
			'(min-width: 768px) 96px, 80px',
		);
		expect(screen.getByTestId('about-identity-scroll')).toBeTruthy();
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
		expect(languages.getAttribute('class')).toContain('py-0');
		const flags = Array.from(languages.querySelectorAll('[data-testid="about-language-flag"]'));
		expect(flags.map((flag) => flag.getAttribute('data-region'))).toEqual([
			'quebec',
			'canada',
			'colombia',
		]);
		expect(flags.map((flag) => flag.textContent?.trim())).toEqual(['French', 'English', 'Spanish']);
		const images = Array.from(languages.querySelectorAll('[data-testid="about-language-image"]'));
		expect(images).toHaveLength(3);
		expect(images.map((image) => image.getAttribute('alt'))).toEqual(['', '', '']);
	});

	it('keeps language flags colorful by default', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/components/about/AboutLanguages.svelte'), 'utf-8');
		expect(source).not.toContain('grayscale');
	});

	it('renders stacked language panels from CMS flag assets', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/components/about/AboutLanguages.svelte'), 'utf-8');
		expect(source).toContain('language-strip flex h-full min-h-36 flex-col');
		expect(source).toContain('language-stop-badge');
		expect(source).toContain('background: color-mix(in srgb, var(--background) 72%, transparent)');
		expect(source).toContain('border-top: 1px solid color-mix');
		expect(source).toContain("import { asset } from '$lib/directus/assets'");
		expect(source).toContain('resolveLanguageImage');
		expect(source).toContain('data-testid="about-language-image"');
		expect(source).toContain('flex: 1.55');
		expect(source).not.toContain('language.flag');
		expect(source).not.toContain('colombia-wide');
		expect(source).not.toContain('canada-wide');
		expect(source).not.toContain('quebec-wide');
		expect(source).not.toContain('flag ===');
		expect(source).not.toContain('width: 30%');
		expect(source).not.toContain("content: '\\269C'");
		expect(source).not.toContain('bg-contain');
		expect(source).not.toContain('clip-path: polygon');
		expect(source).not.toContain('--flag-cut');
		expect(source).not.toContain('flag-divider');
	});

	it('renders CMS-fed quote carousel controls and advances through quotes', async () => {
		const { container } = render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const testimonials = screen.getByTestId('about-testimonials');
		expect(testimonials.textContent).toContain(
			"You have the gift of perseverance, and that's what makes you a genius too.",
		);
		expect(testimonials.textContent).toContain('Guy Sensei');
		expect(container.querySelectorAll('[data-testid="about-quote-dot"]')).toHaveLength(3);
		expect(testimonials.getAttribute('class')).toContain('h-[19rem]');
		expect(screen.getByTestId('about-quote-controls').getAttribute('class')).toContain('shrink-0');

		await fireEvent.click(screen.getByLabelText('Next quote'));
		expect(testimonials.textContent).toContain(
			'What matters in life is not what happens to you but what you remember and how you remember it.',
		);
		expect(testimonials.textContent).toContain('Gabriel Garcia Marquez');

		await fireEvent.click(screen.getByLabelText('Next quote'));
		expect(testimonials.textContent).toContain(
			'Everything we hear is an opinion, not a fact. Everything we see is a perspective, not the truth.',
		);
		expect(testimonials.textContent).toContain('Marcus Aurelius');
	});

	it('uses About CMS labels for quote carousel aria text', () => {
		const labeledAbout = {
			...aboutPageContent,
			labels: {
				...aboutPageContent.labels,
				testimonialsCarouselAria: { en: 'Personal quote carousel' },
				testimonialsTabNavAria: { en: 'Quote slide selector' },
				testimonialsPrevAria: { en: 'Earlier quote' },
				testimonialsNextAria: { en: 'Later quote' },
				showTestimonialAria: { en: 'Jump to quote {index}' },
				testimonialSlideAria: { en: 'Quote {index} of {total}' },
			},
		} as unknown as typeof aboutPageContent;

		render(AboutPage, { props: { aboutPage: labeledAbout, weather: null } });

		expect(screen.getByRole('region', { name: 'Personal quote carousel' })).toBeTruthy();
		expect(screen.getByRole('tablist', { name: 'Quote slide selector' })).toBeTruthy();
		expect(screen.getByLabelText('Earlier quote')).toBeTruthy();
		expect(screen.getByLabelText('Later quote')).toBeTruthy();
		expect(screen.getByLabelText('Jump to quote 1')).toBeTruthy();
	});

	it('renders seven polaroids in the counter', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-polaroids').textContent).toContain('1/7');
	});

	it('renders interests credits as an overlay while the image fills the card', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		const interests = screen.getByTestId('about-interests');
		expect(interests.getAttribute('class')).toContain('py-0');
		expect(interests.textContent).not.toContain(
			'Transit photo: Harrison Keely · CC BY 4.0 · Space: NASA',
		);
		expect(interests.textContent).toContain('Harrison Keely · CC BY 4.0');
		expect(interests.textContent).toContain('NASA');
		expect(screen.queryByTestId('about-interests-credit')).toBeNull();
	});

	it('keeps the core-beliefs card scrollable when copy grows', () => {
		render(AboutPage, { props: { aboutPage: aboutPageContent, weather: null } });
		expect(screen.getByTestId('about-method-scroll')).toBeTruthy();
	});

	it('wires every scrollable bento body through the shared scrollChain action', () => {
		const scrollAreas = [
			['AboutIdentity.svelte', 'about-identity-scroll'],
			['AboutMethod.svelte', 'about-method-scroll'],
			['AboutTestimonials.svelte', 'about-quote-body'],
		] as const;

		for (const [fileName, testId] of scrollAreas) {
			const source = readFileSync(join(process.cwd(), 'src/lib/components/about', fileName), 'utf-8');
			const scrollTag = source.match(new RegExp(`<div[^>]*data-testid="${testId}"[^>]*>`, 's'))?.[0];

			expect(source).toContain("import { scrollChain } from '$lib/motion/actions/scrollChain.js'");
			expect(scrollTag).toContain('use:scrollChain');
		}
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
		expect(weatherWidget.textContent).toContain('-');
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
	// null, this test overrides fetch to exercise the fresh-data branch.
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
