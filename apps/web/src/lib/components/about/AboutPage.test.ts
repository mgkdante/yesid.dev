import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import AboutPage from './AboutPage.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { siteLabels } from '#lib/content/index.ts';

vi.mock('#lib/directus/assets.ts', () => ({
	asset: (id: string) => `/test-assets/${id}`,
	buildSrcSet: () => '',
	assetImage: (id: string) => ({ src: `/test-assets/${id}` }),
}));

vi.mock('#lib/content/media-variants.ts', () => ({
	mediaVariants: {
		'/fixture-headshot.webp': {
			width: 800,
			height: 800,
			variants: [
				{ path: '/small.webp', width: 240 },
				{ path: '/large.webp', width: 800 },
			],
		},
		'/fixture-interest.webp': {
			width: 600,
			height: 400,
			variants: [
				{ path: '/interest-small.webp', width: 240 },
				{ path: '/interest-large.webp', width: 600 },
			],
		},
	},
}));

const fixture = {
	...aboutPageContent,
	identity: {
		...aboutPageContent.identity,
		headshot: '/fixture-headshot.webp',
		title: {
			en: 'A fixture title',
			fr: 'Un titre témoin',
			es: 'Un título de prueba',
		},
		name: { en: 'Reader' },
		valueProp: {
			en: 'A short biography.',
			fr: 'Une biographie plus longue.',
			es: 'Una biografía diferente.',
		},
		polaroids: [
			{
				src: '/one.svg',
				alt: { en: 'First scene' },
				caption: { en: 'First caption' },
				rotate: 0,
			},
			{
				src: '/two.svg',
				alt: { en: 'Second scene' },
				caption: { en: 'Second caption' },
				rotate: 1,
			},
		],
	},
	education: [
		{
			icon: 'bishops' as const,
			school: { en: 'Fixture school' },
			program: { en: 'Fixture program' },
		},
	],
	languages: [
		{ id: 'one', label: { en: 'First language' }, image: '/fixture.svg' },
		{ id: 'two', label: { en: 'Second language' }, image: 'fixture-asset' },
	],
	interests: [
		{ id: 'transit', label: { en: 'Trains' }, image: '/fixture-interest.webp' },
		{ id: 'space', label: { en: 'Stars' }, image: '/space.svg' },
	],
	testimonials: [
		{
			quote: { en: 'First supplied quote.', fr: 'Une citation témoin.', es: 'Una cita de prueba.' },
			author: 'First author',
			role: { en: 'Builder' },
			company: '',
		},
		{
			quote: {
				en: 'A substantially longer supplied quote with a different author and no role.',
			},
			author: 'Second author',
			role: { en: '' },
			company: '',
		},
	],
	cta: {
		...aboutPageContent.cta,
		buttonHref: '/contact?topic=fixture',
		buttonLabel: { en: 'Discuss this' },
		lines: [{ color: 'muted' as const, text: 'Supplied terminal output' }],
	},
};

describe('AboutPage', () => {
	it('renders decorative interest images with responsive variants and no background images', () => {
		render(AboutPage, { props: { aboutPage: fixture, weather: null } });
		const interests = screen.getByTestId('about-interests');
		const image = interests.querySelector('img[src="/fixture-interest.webp"]');
		expect(image?.closest('.strip-bg')).not.toBeNull();
		expect(image).toHaveAttribute('src', '/fixture-interest.webp');
		expect(image).toHaveAttribute(
			'srcset',
			'/interest-small.webp 240w, /interest-large.webp 600w',
		);
		expect(image).toHaveAttribute(
			'sizes',
			'(min-width: 1024px) calc(20vw + 48px), (min-width: 768px) 800px, 340px',
		);
		expect(image).toHaveAttribute('width', '600');
		expect(image).toHaveAttribute('height', '400');
		expect(image).toHaveAttribute('loading', 'lazy');
		expect(image).toHaveAttribute('decoding', 'async');
		expect(image).toHaveAttribute('alt', '');
		const unmappedImage = interests.querySelector('img[src="/space.svg"]');
		expect(unmappedImage).toHaveAttribute('src', '/space.svg');
		for (const attribute of ['srcset', 'sizes', 'width', 'height']) {
			expect(unmappedImage).not.toHaveAttribute(attribute);
		}
		for (const element of interests.querySelectorAll<HTMLElement>('[style]')) {
			expect(element.style.backgroundImage).toBe('');
		}
	});

	it('handles an empty optional polaroid collection', () => {
		render(AboutPage, {
			props: {
				aboutPage: {
					...fixture,
					identity: { ...fixture.identity, polaroids: [] },
				},
				weather: null,
			},
		});
		expect(screen.getByTestId('about-polaroids').querySelector('img')).toBeNull();
		expect(screen.queryByTestId('about-polaroid-counter')).toBeNull();
	});
	for (const [locale, title, biography, quote] of [
		['en', 'A fixture title', 'A short biography.', 'First supplied quote.'],
		['fr', 'Un titre témoin', 'Une biographie plus longue.', 'Une citation témoin.'],
		['es', 'Un título de prueba', 'Una biografía diferente.', 'Una cita de prueba.'],
	])
		it(`renders supplied content with a semantic outline in ${locale}`, () => {
			const { container } = render(AboutPage, {
				props: { aboutPage: fixture, weather: null },
				context: new Map([[Symbol.for('yesid.locale'), () => locale]]),
			});
			expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
			expect(screen.getByTestId('about-identity')).toHaveTextContent(biography);
			expect(screen.getByTestId('about-testimonials')).toHaveTextContent(quote);
			const headings = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6')];
			expect(headings[0].tagName).toBe('H1');
			expect(headings.filter((el) => el.tagName === 'H1')).toHaveLength(1);
			for (const heading of headings.slice(1)) {
				expect(heading.tagName).toBe('H2');
				expect(heading.textContent?.trim()).not.toBe('');
			}
		});

	it('renders supplied media, education, languages and intentional credits', () => {
		render(AboutPage, { props: { aboutPage: fixture, weather: null } });
		expect(screen.getByTestId('about-headshot')).toHaveAttribute('alt', 'Reader');
		expect(screen.getByTestId('about-headshot')).toHaveAttribute('src', fixture.identity.headshot);
		expect(screen.getByTestId('about-headshot')).toHaveAttribute(
			'srcset',
			'/small.webp 240w, /large.webp 800w',
		);
		expect(screen.getByTestId('about-headshot')).toHaveAttribute(
			'sizes',
			'(min-width: 768px) 96px, 80px',
		);
		expect(screen.getByTestId('about-headshot')).toHaveAttribute('width', '800');
		expect(screen.getByTestId('about-headshot')).toHaveAttribute('height', '800');
		expect(screen.getByTestId('about-education')).toHaveTextContent('Fixture school');
		expect(screen.getByTestId('about-education')).toHaveTextContent('Fixture program');
		expect(screen.getByTestId('about-education').querySelector('img')).toHaveAttribute('src', '/images/about/edu-bishops.svg');
		expect(screen.getByTestId('about-education').querySelector('img')).toHaveAttribute('alt', '');
		expect(screen.getByRole('img', { name: 'First scene' })).toHaveAttribute('src', '/one.svg');
		expect(screen.getByTestId('about-polaroids')).toHaveTextContent('First caption');
		expect([...screen.getByTestId('about-languages').querySelectorAll('.flag-label')].map(el => el.textContent)).toEqual(['First language', 'Second language']);
		const images = screen.getAllByTestId('about-language-image');
		expect(images.map((el) => el.getAttribute('src'))).toEqual([
			'/fixture.svg',
			'/test-assets/fixture-asset',
		]);
		expect(images.map((el) => el.getAttribute('alt'))).toEqual(['', '']);
		expect(screen.getByTestId('about-interests')).toHaveTextContent('Harrison Keely · CC BY 4.0');
		expect(screen.getByTestId('about-interests')).toHaveTextContent('NASA');
	});

	it('keeps provided carousel content and controls working through repeated wraps', async () => {
		render(AboutPage, { props: { aboutPage: fixture, weather: null } });
		const quotes = screen.getByTestId('about-testimonials');
		for (let cycle = 0; cycle < 3; cycle++) {
			expect(quotes).toHaveTextContent('First supplied quote.');
			await fireEvent.click(screen.getByLabelText(aboutPageContent.labels.testimonialsNextAria.en));
			expect(quotes).toHaveTextContent('Second author');
			await fireEvent.click(screen.getByLabelText(aboutPageContent.labels.testimonialsPrevAria.en));
		}
		expect(screen.getAllByRole('tab')).toHaveLength(2);
		await fireEvent.click(screen.getAllByRole('tab')[1]);
		expect(quotes).toHaveTextContent('Second author');
		expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
	});

	for (const testimonials of [[], fixture.testimonials.slice(0, 1)])
		it(`handles ${testimonials.length} supplied quotes without carousel controls`, () => {
			render(AboutPage, {
				props: {
					aboutPage: { ...fixture, testimonials, education: [], languages: [] },
					weather: null,
				},
			});
			expect(screen.queryByTestId('about-quote-controls')).toBeNull();
			expect(screen.queryAllByTestId('about-language-image')).toHaveLength(0);
		});

	it('forwards supplied carousel accessibility labels', () => {
		const labels = {
			...fixture.labels,
			testimonialsCarouselAria: { en: 'Fixture carousel' },
			testimonialsTabNavAria: { en: 'Choose quote' },
			testimonialsPrevAria: { en: 'Earlier' },
			testimonialsNextAria: { en: 'Later' },
			showTestimonialAria: { en: 'Choose {index}' },
			testimonialSlideAria: { en: 'Quote {index} of {total}' },
		};
		render(AboutPage, {
			props: { aboutPage: { ...fixture, labels }, weather: null },
		});
		expect(screen.getByRole('region', { name: 'Fixture carousel' })).toBeInTheDocument();
		expect(screen.getByRole('tablist', { name: 'Choose quote' })).toBeInTheDocument();
		for (const name of ['Earlier', 'Later', 'Choose 1', 'Quote 1 of 2'])
			expect(screen.getByLabelText(name)).toBeInTheDocument();
	});

	it('renders supplied CTA output and destination with configured terminal chrome', () => {
		render(AboutPage, { props: { aboutPage: fixture, weather: null } });
		expect(screen.getByTestId('about-cta')).toHaveTextContent('Supplied terminal output');
		expect(screen.getByTestId('about-cta')).toHaveTextContent(siteLabels.ui.terminalTitle.en);
		expect(screen.getByRole('link', { name: 'Discuss this' })).toHaveAttribute(
			'href',
			'/contact?topic=fixture',
		);
	});

	it('renders weather fallback when no data', () => {
		render(AboutPage, { props: { aboutPage: fixture, weather: null } });
		expect(screen.getByTestId('about-weather')).toHaveTextContent('-');
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
