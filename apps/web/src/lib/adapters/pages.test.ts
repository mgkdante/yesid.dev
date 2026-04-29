// pages.test.ts — TDD tests for loadPage, ROUTE_TO_SLUG, ALL_BLOCK_COLLECTIONS,
// and the 12 transformBlock<X> functions added in slice-18i Task 4.0.
//
// Mocking strategy mirrors directus.mocked.test.ts:
//   - vi.mock('./directus-queue') replaces createQueuedFetch() with sharedMockFetch
//   - vi.mock('$env/dynamic/public') supplies PUBLIC_DIRECTUS_URL
//   - vi.unmock('$lib/adapters/directus') keeps the subject under real test
//
// loadPage is NOT mocked — it's the subject. We mock at directus.request level
// via the queued-fetch capture surface (same HTTP-level mock as mocked.test.ts).
// parsePort runs REAL — the spec contract is "every adapter parse goes through
// parsePort" and the Zod gate is part of what we're testing.
//
// Fixture shape: rawBlockHero() et al return the REAL Directus shape
// (per-locale translation row arrays), not pre-shaped LocalizedStrings.
// This exercises the full transform-merge-validate pipeline.

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.unmock('$lib/adapters/directus');

const sharedMockFetch = vi.fn();

vi.mock('./directus-queue', () => ({
	createQueuedFetch: () => sharedMockFetch,
}));

vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

import {
	loadPage,
	ROUTE_TO_SLUG,
	ALL_BLOCK_COLLECTIONS,
	transformBlockHero,
	transformBlockManifesto,
	transformBlockProofReel,
	transformBlockServicesGrid,
	transformBlockCta,
	transformBlockCloser,
	transformBlockAboutIntro,
	transformBlockAboutContent,
	transformBlockContactContent,
	transformBlockTechStackPageContent,
	transformBlockBlogPageContent,
	transformBlockProjectsPageContent,
} from './directus';
import { PageSchema } from '@repo/shared';

// ---------------------------------------------------------------------------
// Raw Directus block fixture builders — per-locale translation row arrays
// ---------------------------------------------------------------------------

/** Minimal raw `block_hero` Directus item with two-locale translations. */
function rawBlockHero(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: 'hero-uuid-1',
		editor_label: 'Home Hero',
		status: 'published',
		sort: 1,
		translations: [
			{
				languages_code: 'en',
				subheadline: 'Hello there',
				subtitle: 'Building things',
				cta_work: 'See work',
				cta_contact: 'Get in touch',
				headline: { line1: 'Hello', line2: 'World', ariaSuffix: 'Hello World' },
				sql_panel: {
					prompt: 'SELECT * FROM metro',
					liveLabel: 'Live',
					columns: { route: 'Route', avgDelayS: 'Avg delay', vehicles: 'Vehicles' },
					metaTemplate: '{count} vehicles',
				},
				refresh_button: { label: 'Refresh', helper: 'Tap to refresh' },
				hero_anim: { scrollDown: 'Scroll down' },
			},
			{
				languages_code: 'fr',
				subheadline: 'Bonjour',
				subtitle: 'Construire des choses',
				cta_work: 'Voir le travail',
				cta_contact: 'Contactez',
				headline: { line1: 'Bonjour', line2: 'Monde', ariaSuffix: 'Bonjour Monde' },
				sql_panel: {
					prompt: 'SELECT * FROM metro',
					liveLabel: 'En direct',
					columns: { route: 'Trajet', avgDelayS: 'Délai moy', vehicles: 'Véhicules' },
					metaTemplate: '{count} véhicules',
				},
				refresh_button: { label: 'Rafraîchir', helper: 'Tap pour rafraîchir' },
				hero_anim: { scrollDown: 'Défiler vers le bas' },
			},
		],
		...overrides,
	};
}

/** Minimal raw `block_manifesto` Directus item.
 *
 * hidden_transit_lines lives in translations (per Phase 1 schema).
 * pills has mixed content: label (LocalizedString) + serviceId (plain string).
 * color in hidden_transit_lines is plain hex (same across locales).
 */
function rawBlockManifesto(): Record<string, unknown> {
	return {
		id: 'manifesto-uuid-1',
		status: 'published',
		ticks: ['tick1', 'tick2'],
		// hidden_transit_lines on parent row is the backwards-compat fallback;
		// the primary source is now translations (tested below).
		translations: [
			{
				languages_code: 'en',
				statement: {
					line1: 'I build',
					lineHuge: 'things',
					line3Part1: 'that',
					line3Highlight: 'matter',
					line3Part2: 'daily',
				},
				terminal: { user: 'yesid', command: 'npm run build' },
				// pills: serviceId is plain (NOT translatable); label is the translatable leaf
				pills: [{ label: 'SQL', serviceId: 'sql-dev' }],
				edge_left: { sectionNumber: '01', sectionName: 'Manifesto', location: 'MTL' },
				edge_right: { lat: '45', lng: '-73', src: 'A', via: 'B', dst: 'C', node: 'N1', status: 'OK' },
				edge_bottom: { connected: 'Yes', line: 'Green', url: '/about', version: '1.0', scrollHint: 'Scroll' },
				transit: { arrivalLabel: 'Arriving', platformBadge: 'P1', directionBadge: 'North' },
				// hidden_transit_lines in translations: name is translatable, color is plain hex
				hidden_transit_lines: [{ name: 'Green Line', color: '#00a550' }],
			},
			{
				languages_code: 'fr',
				statement: {
					line1: 'Je construis',
					lineHuge: 'des choses',
					line3Part1: 'qui',
					line3Highlight: "comptent",
					line3Part2: 'chaque jour',
				},
				terminal: { user: 'yesid', command: 'npm run build' },
				pills: [{ label: 'SQL fr', serviceId: 'sql-dev' }],
				edge_left: { sectionNumber: '01', sectionName: 'Manifeste', location: 'MTL' },
				edge_right: { lat: '45', lng: '-73', src: 'A', via: 'B', dst: 'C', node: 'N1', status: 'OK' },
				edge_bottom: { connected: 'Oui', line: 'Verte', url: '/about', version: '1.0', scrollHint: 'Défiler' },
				transit: { arrivalLabel: 'Arrivée', platformBadge: 'P1', directionBadge: 'Nord' },
				// same color in every locale; translated name
				hidden_transit_lines: [{ name: 'Ligne verte', color: '#00a550' }],
			},
		],
	};
}

/** Minimal raw `block_proof_reel` Directus item. */
function rawBlockProofReel(): Record<string, unknown> {
	return {
		id: 'proof-uuid-1',
		status: 'published',
		slugs: ['project-a', 'project-b'],
		images: { 'project-a': 'img-uuid-1' },
		view_all_href: '/work',
		translations: [
			{
				languages_code: 'en',
				heading: 'Proof',
				heading_dot: '.',
				subheading: 'Real projects',
				section_label: 'Work',
				view_all_label: 'View all',
				toggle_color_aria: 'Toggle color',
			},
		],
	};
}

/** Minimal raw `block_services_grid` Directus item. */
function rawBlockServicesGrid(): Record<string, unknown> {
	return {
		id: 'services-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: 'Services',
				heading_dot: '.',
				subheading: 'What I do',
				view_illustration_aria: 'View illustration',
				view_all_link: 'View all services',
			},
		],
	};
}

/** Minimal raw `block_cta` Directus item. */
function rawBlockCta(): Record<string, unknown> {
	return {
		id: 'cta-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				heading: "Let's talk",
				subtitle: 'Ready to start a project?',
				cta_contact: 'Contact me',
				cta_github: 'GitHub',
			},
		],
	};
}

/** Minimal raw `block_closer` Directus item.
 *
 * NOTE: `cta_href` and `attribution_url` are plain-string fields on the PARENT
 * ROW (not inside the translation JSON), because the transform reads
 * `raw.cta_href` and `raw.attribution_url` before falling back to the JSON
 * column.  Putting `href` inside the cta JSON column would cause `toLSJSON` to
 * wrap it as a LocalizedString, breaking the `cta.href: z.string()` schema gate.
 * The `cta` translation column carries only `label` (LocalizedString).
 * The `attribution` translation column carries only `text` (LocalizedString).
 */
function rawBlockCloser(): Record<string, unknown> {
	return {
		id: 'closer-uuid-1',
		status: 'published',
		// Non-translatable hrefs on parent row
		cta_href: '/contact',
		attribution_url: '/about',
		translations: [
			{
				languages_code: 'en',
				heading: 'Thanks',
				heading_dot: '.',
				subheading: 'See you around',
				// cta JSON carries only label (translatable); href comes from parent row
				cta: { label: 'Contact' },
				rows: {
					contact: { label: 'Contact', description: 'Say hi', action: 'Email' },
					connect: { label: 'Connect', description: 'LinkedIn', action: 'Follow' },
					read: { label: 'Read', action: 'Blog' },
					about: { label: 'About', description: 'Who I am', action: 'Learn' },
				},
				// attribution JSON carries only text (translatable); url comes from parent row
				attribution: { text: 'Made with care' },
				terminal: {
					title: 'Terminal',
					city: 'MTL',
					encoding: 'UTF-8',
					destinationsLabel: 'Destinations',
					prompt: '> ',
				},
			},
		],
	};
}

/** Minimal raw `block_about_intro` Directus item. */
function rawBlockAboutIntro(): Record<string, unknown> {
	return {
		id: 'about-intro-uuid-1',
		status: 'published',
		stack_items: ['TypeScript', 'SvelteKit'],
		translations: [
			{
				languages_code: 'en',
				name: 'Yesid',
				title: 'Developer',
				bio: 'I build data-heavy web apps.',
				more_link: 'More about me',
				stack_label: 'Stack',
				location_label: 'Location',
				location: { city: 'Montreal', region: 'QC' },
				interests_label: 'Interests',
				interests: 'Transit data, SQL',
			},
		],
	};
}

/**
 * Minimal raw `block_about_content` Directus item with realistic mixed-content shape.
 *
 * - tech_stack + client_logos are on the PARENT ROW (Phase 1 fix-up 377401c moved them).
 * - Plain string fields (headshot, src, value, author, company, etc.) are bare strings.
 * - LocalizedString fields (name, title, label, quote, role, etc.) vary per locale.
 * - identity.headshot, clientLogos[].src are plain strings (not LocalizedString).
 */
function rawBlockAboutContent(): Record<string, unknown> {
	return {
		id: 'about-content-uuid-1',
		status: 'published',
		client_count: 5,
		// tech_stack and client_logos on parent row (NOT in translations)
		tech_stack: [
			{ name: 'TypeScript', category: 'languages', relatedServices: ['web-development'] },
		],
		client_logos: [
			{ name: 'Acme Corp', src: '/logo.png', url: 'https://acme.com' },
		],
		translations: [
			{
				languages_code: 'en',
				// identity: headshot is plain string; name/title/valueProp are translatable
				identity: {
					name: 'Yesid',
					title: 'Data Engineer',
					valueProp: 'I build reliable infrastructure',
					headshot: '/images/me.jpg',   // plain string
					polaroids: [
						{ src: '/photo.jpg', alt: 'Me coding', caption: 'At work', rotate: 2 }, // src: plain
					],
				},
				// metrics: value is plain string; label is translatable
				metrics: [{ value: '12+', label: 'Projects shipped', icon: 'briefcase' }],
				// methodology: id/station are plain; label/description are translatable
				methodology: [{ id: 'step-audit', label: 'Audit', description: 'We audit first', station: 1 }],
				// testimonials: author/company are plain; quote/role are translatable
				testimonials: [{ quote: 'Great work!', author: 'Jane Doe', role: 'CTO', company: 'AcmeCo', logo: '/logo.png' }],
				// interests: id/image are plain; label is translatable
				interests: [{ id: 'transit', label: 'Transit data', image: '/img/transit.jpg' }],
				// weather: enabled is plain boolean; city/hook are translatable
				weather: { city: 'Montreal', hook: 'Where am I?', enabled: true },
				// cta: command/buttonHref/lines[].text/lines[].color/socials.* are plain strings
				cta: {
					command: '$ yesid --contact',
					lines: [{ text: 'Available for work', color: 'orange' }],
					buttonLabel: 'Get in touch',
					buttonHref: '/contact',    // plain string
					availability: 'Open to opportunities',
					socials: [
						{ label: 'GitHub', href: 'https://github.com/mgkdante', icon: 'github' }, // all plain
					],
				},
				// stopLabels: all LocalizedString
				stop_labels: {
					identity: 'Identity',
					metrics: 'Metrics',
					testimonials: 'Testimonials',
					process: 'Process',
					stack: 'Stack',
					clients: 'Clients',
					interests: 'Interests',
					snapshots: 'Snapshots',
					location: 'Location',
					next: 'Next',
				},
				// labels: all LocalizedString
				labels: {
					clientsServed: 'Clients served',
					polaroidPrevAria: 'Previous photo',
					polaroidNextAria: 'Next photo',
					testimonialsCarouselAria: 'Testimonials carousel',
					testimonialsTabNavAria: 'Tab nav',
					testimonialSlideAria: 'Slide {index} of {total}',
					showTestimonialAria: 'Show testimonial {index}',
				},
				meta: { title: 'About Yesid', description: 'Developer based in MTL' },
			},
			{
				languages_code: 'fr',
				identity: {
					name: 'Yésid',
					title: 'Ingénieur de données',
					valueProp: 'Je construis une infrastructure fiable',
					headshot: '/images/me.jpg',   // plain — same across locales
					polaroids: [
						{ src: '/photo.jpg', alt: 'Moi en train de coder', caption: 'Au travail', rotate: 2 },
					],
				},
				metrics: [{ value: '12+', label: 'Projets livrés', icon: 'briefcase' }],
				methodology: [{ id: 'step-audit', label: 'Audit', description: "Nous auditons d'abord", station: 1 }],
				testimonials: [{ quote: 'Excellent travail!', author: 'Jane Doe', role: 'DT', company: 'AcmeCo', logo: '/logo.png' }],
				interests: [{ id: 'transit', label: 'Données de transit', image: '/img/transit.jpg' }],
				weather: { city: 'Montréal', hook: 'Où suis-je?', enabled: true },
				cta: {
					command: '$ yesid --contact',
					lines: [{ text: 'Available for work', color: 'orange' }],
					buttonLabel: 'Me contacter',
					buttonHref: '/contact',
					availability: 'Ouvert aux opportunités',
					socials: [
						{ label: 'GitHub', href: 'https://github.com/mgkdante', icon: 'github' },
					],
				},
				stop_labels: {
					identity: 'Identité',
					metrics: 'Métriques',
					testimonials: 'Témoignages',
					process: 'Processus',
					stack: 'Pile',
					clients: 'Clients',
					interests: 'Intérêts',
					snapshots: 'Instantanés',
					location: 'Emplacement',
					next: 'Suivant',
				},
				labels: {
					clientsServed: 'Clients servis',
					polaroidPrevAria: 'Photo précédente',
					polaroidNextAria: 'Photo suivante',
					testimonialsCarouselAria: 'Carrousel de témoignages',
					testimonialsTabNavAria: 'Navigation par onglets',
					testimonialSlideAria: 'Diapositive {index} sur {total}',
					showTestimonialAria: 'Afficher le témoignage {index}',
				},
				meta: { title: 'À propos de Yesid', description: 'Développeur basé à MTL' },
			},
		],
	};
}

/**
 * Minimal raw `block_contact_content` Directus item with realistic mixed-content shape.
 *
 * - infoTerminal.title + infoTerminal.command are plain strings (same across locales).
 * - formTerminal.title + formTerminal.command are plain strings.
 * - formTerminal.fields.*.label is plain string; fields.*.placeholder is LocalizedString.
 * - socials[].label/href/icon are all plain strings (NOT LocalizedString).
 */
function rawBlockContactContent(): Record<string, unknown> {
	return {
		id: 'contact-uuid-1',
		status: 'published',
		web3forms_key: 'key-abc',
		translations: [
			{
				languages_code: 'en',
				page_title: 'Contact',
				station_label: 'Station',
				send_error_message: 'Failed to send',
				meta: { title: 'Contact Yesid', description: 'Get in touch' },
				info_terminal: {
					title: 'Get in touch',
					command: 'yesid --contact',
					location: 'Montreal, QC',
					responseTime: 'Within 48h',
					sectionLabels: {
						location: 'Location',
						connect: 'Connect',
					},
				},
				form_terminal: {
					title: 'Send a message',
					command: 'curl --contact',
					commandOutput: 'Message sent!',
					fields: {
						name: { label: 'Name', placeholder: 'Your name' },
						email: { label: 'Email', placeholder: 'your@email.com' },
						message: { label: 'Message', placeholder: 'Your message' },
					},
					submitLabel: 'Send',
				},
				validation: {
					required: 'This field is required',
					invalidEmail: 'Invalid email address',
					errorSummary: 'Please fix the errors below',
				},
				success: {
					validating: 'Validating...',
					sending: 'Sending...',
					sent: 'Message sent!',
					responseTime: 'I will respond within 48h',
					meanwhile: 'Meanwhile, explore my work',
					resetLabel: 'Send another message',
					fieldOk: 'OK',
				},
				socials: [
					{ label: 'GitHub', href: 'https://github.com/mgkdante', icon: 'github' },
				],
			},
			{
				languages_code: 'fr',
				page_title: 'Contact',
				station_label: 'Station',
				send_error_message: "Échec de l'envoi",
				meta: { title: 'Contacter Yesid', description: 'Prendre contact' },
				info_terminal: {
					title: 'Get in touch',
					command: 'yesid --contact',
					location: 'Montréal, QC',
					responseTime: 'Dans les 48h',
					sectionLabels: {
						location: 'Emplacement',
						connect: 'Connexion',
					},
				},
				form_terminal: {
					title: 'Send a message',
					command: 'curl --contact',
					commandOutput: 'Message envoyé!',
					fields: {
						name: { label: 'Name', placeholder: 'Votre nom' },
						email: { label: 'Email', placeholder: 'votre@email.com' },
						message: { label: 'Message', placeholder: 'Votre message' },
					},
					submitLabel: 'Envoyer',
				},
				validation: {
					required: 'Ce champ est requis',
					invalidEmail: 'Adresse email invalide',
					errorSummary: 'Veuillez corriger les erreurs',
				},
				success: {
					validating: 'Validation...',
					sending: 'Envoi en cours...',
					sent: 'Message envoyé!',
					responseTime: 'Je répondrai sous 48h',
					meanwhile: 'En attendant, explorez mon travail',
					resetLabel: 'Envoyer un autre message',
					fieldOk: 'OK',
				},
				socials: [
					{ label: 'GitHub', href: 'https://github.com/mgkdante', icon: 'github' },
				],
			},
		],
	};
}

/** Minimal raw `block_tech_stack_page_content` Directus item.
 *
 * Field names match TechStackPageContentSchema (overline, titleLine1, titleLine2,
 * terminalAria, stats, getInTouch, viewServices, headingLine1, headingLine2,
 * sub, availability) — note the schema does NOT have download/share/heading/body.
 */
function rawBlockTechStackPageContent(): Record<string, unknown> {
	return {
		id: 'techstack-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				meta: { title: 'Tech Stack', description: 'My tools' },
				hero: {
					overline: 'Stack',
					titleLine1: 'Tools',
					titleLine2: 'I use',
					terminalAria: 'Terminal',
					stats: { technologies: '30+' },
				},
				actions: { getInTouch: 'Contact', viewServices: 'Services' },
				cta: {
					headingLine1: 'Hire',
					headingLine2: 'me',
					sub: 'Available',
					availability: 'Now',
				},
			},
		],
	};
}

/** Minimal raw `block_blog_page_content` Directus item. */
function rawBlockBlogPageContent(): Record<string, unknown> {
	return {
		id: 'blog-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				intro: 'Welcome to my blog',
			},
		],
	};
}

/** Minimal raw `block_projects_page_content` Directus item. */
function rawBlockProjectsPageContent(): Record<string, unknown> {
	return {
		id: 'projects-page-uuid-1',
		status: 'published',
		translations: [
			{
				languages_code: 'en',
				intro: 'Projects I have built',
			},
		],
	};
}

/**
 * Full raw Directus `pages` row for slug=home in real Directus shape.
 * Blocks use per-locale translation row arrays — exercises transformPageRow.
 *
 * Critical 1 fix: title must be extracted from translations (pages_translations.title).
 * The parent row may or may not have a top-level `title` — transformPageRow falls
 * back to translations when the top-level field is missing.
 */
function rawHomePage(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		id: 'page-uuid-1',
		slug: 'home',
		status: 'published',
		// title NOT set at top-level — must be extracted from translations
		translations: [
			{ languages_code: 'en', title: 'Home Page' },
			{ languages_code: 'fr', title: 'Page d\'accueil' },
		],
		blocks: [
			{
				id: 'junction-uuid-1',
				sort: 1,
				collection: 'block_hero',
				item: rawBlockHero(),
			},
		],
		...overrides,
	};
}

/** Returns a JSON Response in the Directus SDK envelope `{ data: [...] }`. */
function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data: body }), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
	sharedMockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// ROUTE_TO_SLUG
// ---------------------------------------------------------------------------

describe('ROUTE_TO_SLUG', () => {
	it('maps the 7 spec routes', () => {
		expect(ROUTE_TO_SLUG['/']).toBe('home');
		expect(ROUTE_TO_SLUG['/about']).toBe('about');
		expect(ROUTE_TO_SLUG['/contact']).toBe('contact');
		expect(ROUTE_TO_SLUG['/services']).toBe('services');
		expect(ROUTE_TO_SLUG['/projects']).toBe('projects');
		expect(ROUTE_TO_SLUG['/tech-stack']).toBe('tech-stack');
		expect(ROUTE_TO_SLUG['/blog']).toBe('blog');
	});
});

// ---------------------------------------------------------------------------
// ALL_BLOCK_COLLECTIONS
// ---------------------------------------------------------------------------

describe('ALL_BLOCK_COLLECTIONS', () => {
	it('has exactly 12 block collections (block_journey_panel dropped)', () => {
		expect(ALL_BLOCK_COLLECTIONS.length).toBe(12);
		expect(ALL_BLOCK_COLLECTIONS).not.toContain('block_journey_panel');
	});
});

// ---------------------------------------------------------------------------
// loadPage — exercises full transform-merge-validate pipeline
// ---------------------------------------------------------------------------

describe('loadPage', () => {
	it('returns a PageData for slug=home with title extracted from translations (Critical 1)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		const result = await loadPage('home', ctx);

		expect(result.slug).toBe('home');
		// Critical 1: title must be extracted from pages_translations, not from a
		// top-level pages.title field (which rawHomePage deliberately omits).
		expect(result.title).toBe('Home Page');
		expect(result.blocks.length).toBeGreaterThanOrEqual(1);
		// After transform, item should have merged LocalizedString shape
		const heroBlock = result.blocks.find((b) => b.collection === 'block_hero');
		expect(heroBlock).toBeDefined();
		if (heroBlock?.collection === 'block_hero') {
			expect(heroBlock.item.subheadline.en).toBe('Hello there');
			expect(heroBlock.item.subheadline.fr).toBe('Bonjour');
			// heroAnim is now carried through typed PageData (High 1 fix)
			expect(heroBlock.item.heroAnim.scrollDown).toMatchObject({ en: 'Scroll down' });
		}
	});

	it('memoizes per request — second call hits cache, directus.request called once', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		await loadPage('home', ctx);
		await loadPage('home', ctx);

		// fetch is the underlying network call — should only fire once
		expect(sharedMockFetch).toHaveBeenCalledTimes(1);
	});

	it('throws a slug-naming error when page not found (empty array response)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		const ctx = { pageCache: new Map() };
		await expect(loadPage('nonexistent', ctx)).rejects.toThrow(/nonexistent/);
	});

	it('throws a parsePort error when raw shape is malformed', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([{ wrong: 'shape' }]));

		const ctx = { pageCache: new Map() };
		await expect(loadPage('home', ctx)).rejects.toThrow(/pages\.bySlug/);
	});

	it('memoizes across two content.* calls sharing the same ctx Map', async () => {
		// Set up two separate loadPage calls in the same request (same ctx).
		// Only one network call should be issued regardless of how many callers
		// share the same ctx Map — this validates the Phase 4 dedup guarantee.
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([rawHomePage()]));

		const ctx = { pageCache: new Map() };
		const [r1, r2] = await Promise.all([
			loadPage('home', ctx),
			loadPage('home', ctx),
		]);

		expect(sharedMockFetch).toHaveBeenCalledTimes(1);
		// Both callers receive the same resolved data
		expect(r1.slug).toBe('home');
		expect(r2.slug).toBe('home');
	});
});

// ---------------------------------------------------------------------------
// transformBlockHero — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockHero', () => {
	it('merges per-locale translations into LocalizedString shape', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.subheadline).toEqual({ en: 'Hello there', fr: 'Bonjour' });
		expect(result.ctaWork).toEqual({ en: 'See work', fr: 'Voir le travail' });
	});

	it('merges JSON column (headline) into nested LocalizedString leaves', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.headline.line1).toEqual({ en: 'Hello', fr: 'Bonjour' });
		expect(result.headline.line2).toEqual({ en: 'World', fr: 'Monde' });
	});

	it('exposes heroAnim.scrollDown as LocalizedString (carried through typed PageData)', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.heroAnim.scrollDown).toMatchObject({ en: 'Scroll down' });
	});

	it('produces sqlPanel with nested LocalizedString columns', () => {
		const raw = rawBlockHero();
		const result = transformBlockHero(raw as never);
		expect(result.sqlPanel.liveLabel).toMatchObject({ en: 'Live' });
		expect(result.sqlPanel.columns.route).toMatchObject({ en: 'Route' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockManifesto — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockManifesto', () => {
	it('merges translations into LocalizedString leaves', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		expect(result.terminal.user).toMatchObject({ en: 'yesid' });
		expect(result.terminal.command).toMatchObject({ en: 'npm run build' });
	});

	it('passes through non-translatable ticks array from parent row', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		expect(result.ticks).toEqual(['tick1', 'tick2']);
	});

	it('maps pills with serviceId as plain string (not LocalizedString)', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		// serviceId must be a bare string — NOT wrapped as { en: 'sql-dev' }
		expect(result.pills[0].serviceId).toBe('sql-dev');
		// label IS a LocalizedString
		expect(result.pills[0].label).toMatchObject({ en: 'SQL' });
	});

	it('merges pills label per-locale while keeping serviceId plain (fr locale)', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		// fr translation has 'SQL fr' as label
		expect(result.pills[0].label.fr).toBe('SQL fr');
		// serviceId stays the same plain value regardless of locale
		expect(result.pills[0].serviceId).toBe('sql-dev');
	});

	it('maps hiddenTransitLines with name as LocalizedString and color as plain string (High 2 fix)', () => {
		const raw = rawBlockManifesto();
		const result = transformBlockManifesto(raw as never);
		// name is LocalizedString (translatable)
		expect(result.hiddenTransitLines[0].name).toMatchObject({ en: 'Green Line', fr: 'Ligne verte' });
		// color is a PLAIN string (same hex across locales — NOT a LocalizedString)
		expect(typeof result.hiddenTransitLines[0].color).toBe('string');
		expect(result.hiddenTransitLines[0].color).toBe('#00a550');
	});

	it('reads hidden_transit_lines from translations (not parent row)', () => {
		// Parent row does NOT have hidden_transit_lines — must come from translations
		const raw = rawBlockManifesto();
		// Confirm parent row has no hidden_transit_lines key
		expect((raw as Record<string, unknown>).hidden_transit_lines).toBeUndefined();
		const result = transformBlockManifesto(raw as never);
		// But result should still have it from translations
		expect(result.hiddenTransitLines).toHaveLength(1);
		expect(result.hiddenTransitLines[0].name.en).toBe('Green Line');
	});
});

// ---------------------------------------------------------------------------
// transformBlockProofReel — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockProofReel', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockProofReel();
		const result = transformBlockProofReel(raw as never);
		expect(result.heading).toMatchObject({ en: 'Proof' });
		expect(result.subheading).toMatchObject({ en: 'Real projects' });
	});

	it('passes through non-translatable slugs and images from parent row', () => {
		const raw = rawBlockProofReel();
		const result = transformBlockProofReel(raw as never);
		expect(result.slugs).toEqual(['project-a', 'project-b']);
		expect(result.images).toEqual({ 'project-a': 'img-uuid-1' });
		expect(result.viewAllHref).toBe('/work');
	});
});

// ---------------------------------------------------------------------------
// transformBlockServicesGrid — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockServicesGrid', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockServicesGrid();
		const result = transformBlockServicesGrid(raw as never);
		expect(result.heading).toMatchObject({ en: 'Services' });
		expect(result.subheading).toMatchObject({ en: 'What I do' });
		expect(result.viewIllustrationAria).toMatchObject({ en: 'View illustration' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockCta — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockCta', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockCta();
		const result = transformBlockCta(raw as never);
		expect(result.heading).toMatchObject({ en: "Let's talk" });
		expect(result.subtitle).toMatchObject({ en: 'Ready to start a project?' });
		expect(result.ctaContact).toMatchObject({ en: 'Contact me' });
		expect(result.ctaGithub).toMatchObject({ en: 'GitHub' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockCloser — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockCloser', () => {
	it('merges translations into LocalizedString shape for heading fields', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		expect(result.heading).toMatchObject({ en: 'Thanks' });
		expect(result.subheading).toMatchObject({ en: 'See you around' });
	});

	it('merges JSON column (rows) into nested LocalizedString leaves', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		expect(result.rows.contact.label).toMatchObject({ en: 'Contact' });
		expect(result.rows.read.action).toMatchObject({ en: 'Blog' });
	});

	// Regression: Phase 6 Task 6.1 fix-up — cta.href and attribution.url must
	// come from parent row fields (raw.cta_href / raw.attribution_url), NOT from
	// inside the translation JSON column. If they live in the JSON column,
	// toLSJSON wraps them as LocalizedString, violating z.string() in the schema.
	it('regression: cta.href comes from parent row field (not translation JSON)', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		// Must be a plain string, NOT a LocalizedString object
		expect(typeof result.cta.href).toBe('string');
		expect(result.cta.href).toBe('/contact');
	});

	it('regression: attribution.url comes from parent row field (not translation JSON)', () => {
		const raw = rawBlockCloser();
		const result = transformBlockCloser(raw as never);
		// Must be a plain string, NOT a LocalizedString object
		expect(typeof result.attribution.url).toBe('string');
		expect(result.attribution.url).toBe('/about');
	});
});

// ---------------------------------------------------------------------------
// transformBlockAboutIntro — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockAboutIntro', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.name).toMatchObject({ en: 'Yesid' });
		expect(result.title).toMatchObject({ en: 'Developer' });
		expect(result.bio).toMatchObject({ en: 'I build data-heavy web apps.' });
	});

	it('passes through non-translatable stackItems from parent row', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.stackItems).toEqual(['TypeScript', 'SvelteKit']);
	});

	it('merges JSON column (location) into nested LocalizedString leaves', () => {
		const raw = rawBlockAboutIntro();
		const result = transformBlockAboutIntro(raw as never);
		expect(result.location.city).toMatchObject({ en: 'Montreal' });
		expect(result.location.region).toMatchObject({ en: 'QC' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockAboutContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockAboutContent', () => {
	it('merges identity.name as LocalizedString (en + fr)', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(result.identity.name).toMatchObject({ en: 'Yesid', fr: 'Yésid' });
	});

	it('keeps identity.headshot as plain string (not LocalizedString)', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		// headshot is a plain string path — NOT { en: '/images/me.jpg' }
		expect(typeof result.identity.headshot).toBe('string');
		expect(result.identity.headshot).toBe('/images/me.jpg');
	});

	it('keeps polaroids[].src as plain string', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(typeof result.identity.polaroids[0].src).toBe('string');
		expect(result.identity.polaroids[0].src).toBe('/photo.jpg');
		// but alt is LocalizedString
		expect(result.identity.polaroids[0].alt).toMatchObject({ en: 'Me coding', fr: 'Moi en train de coder' });
	});

	it('keeps metrics[].value as plain string', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(typeof result.metrics[0].value).toBe('string');
		expect(result.metrics[0].value).toBe('12+');
		// but label is LocalizedString
		expect(result.metrics[0].label).toMatchObject({ en: 'Projects shipped', fr: 'Projets livrés' });
	});

	it('keeps testimonials[].author + company as plain strings', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(typeof result.testimonials[0].author).toBe('string');
		expect(result.testimonials[0].author).toBe('Jane Doe');
		expect(typeof result.testimonials[0].company).toBe('string');
		expect(result.testimonials[0].company).toBe('AcmeCo');
		// but quote is LocalizedString
		expect(result.testimonials[0].quote).toMatchObject({ en: 'Great work!', fr: 'Excellent travail!' });
	});

	it('reads tech_stack from parent row (not translations)', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		// techStack comes from parent raw.tech_stack — moved by Phase 1 fix-up 377401c
		expect(result.techStack).toHaveLength(1);
		expect(result.techStack[0].name).toBe('TypeScript');
		expect(typeof result.techStack[0].name).toBe('string'); // plain, not LocalizedString
		expect(result.techStack[0].category).toBe('languages');
	});

	it('reads clientLogos from parent row (not translations)', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		// clientLogos comes from parent raw.client_logos — Phase 1 fix-up
		expect(result.clientLogos).toHaveLength(1);
		expect(result.clientLogos[0].name).toBe('Acme Corp');
		expect(typeof result.clientLogos[0].src).toBe('string'); // plain string
		expect(result.clientLogos[0].src).toBe('/logo.png');
	});

	it('keeps cta.command + buttonHref as plain strings', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(typeof result.cta.command).toBe('string');
		expect(result.cta.command).toBe('$ yesid --contact');
		expect(typeof result.cta.buttonHref).toBe('string');
		expect(result.cta.buttonHref).toBe('/contact');
		// but buttonLabel is LocalizedString
		expect(result.cta.buttonLabel).toMatchObject({ en: 'Get in touch', fr: 'Me contacter' });
	});

	it('keeps cta.socials.href + icon as plain strings', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(typeof result.cta.socials[0].href).toBe('string');
		expect(result.cta.socials[0].href).toBe('https://github.com/mgkdante');
		expect(typeof result.cta.socials[0].icon).toBe('string');
		expect(result.cta.socials[0].icon).toBe('github');
	});

	it('passes through non-translatable clientCount from parent row', () => {
		const raw = rawBlockAboutContent();
		const result = transformBlockAboutContent(raw as never);
		expect(result.clientCount).toBe(5);
	});
});

// ---------------------------------------------------------------------------
// transformBlockContactContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockContactContent', () => {
	it('merges scalar LocalizedString fields (pageTitle, stationLabel, sendErrorMessage)', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(result.pageTitle).toMatchObject({ en: 'Contact' });
		expect(result.stationLabel).toMatchObject({ en: 'Station' });
		expect(result.sendErrorMessage).toMatchObject({ en: 'Failed to send', fr: "Échec de l'envoi" });
	});

	it('keeps infoTerminal.title + command as plain strings (not LocalizedString)', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(typeof result.infoTerminal.title).toBe('string');
		expect(result.infoTerminal.title).toBe('Get in touch');
		expect(typeof result.infoTerminal.command).toBe('string');
		expect(result.infoTerminal.command).toBe('yesid --contact');
		// but location is LocalizedString
		expect(result.infoTerminal.location).toMatchObject({ en: 'Montreal, QC', fr: 'Montréal, QC' });
	});

	it('keeps formTerminal.title + command as plain strings', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(typeof result.formTerminal.title).toBe('string');
		expect(result.formTerminal.title).toBe('Send a message');
		expect(typeof result.formTerminal.command).toBe('string');
		// but commandOutput is LocalizedString
		expect(result.formTerminal.commandOutput).toMatchObject({ en: 'Message sent!', fr: 'Message envoyé!' });
	});

	it('keeps formTerminal.fields.*.label as plain string; placeholder as LocalizedString', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		// label is plain string
		expect(typeof result.formTerminal.fields.name.label).toBe('string');
		expect(result.formTerminal.fields.name.label).toBe('Name');
		// placeholder is LocalizedString
		expect(result.formTerminal.fields.name.placeholder).toMatchObject({ en: 'Your name', fr: 'Votre nom' });
	});

	it('keeps socials[].href + icon as plain strings (not LocalizedString)', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(typeof result.socials[0].href).toBe('string');
		expect(result.socials[0].href).toBe('https://github.com/mgkdante');
		expect(typeof result.socials[0].icon).toBe('string');
		expect(result.socials[0].icon).toBe('github');
		// label is also plain string in ContactSocialLinkSchema
		expect(typeof result.socials[0].label).toBe('string');
		expect(result.socials[0].label).toBe('GitHub');
	});

	it('passes through non-translatable web3formsKey from parent row', () => {
		const raw = rawBlockContactContent();
		const result = transformBlockContactContent(raw as never);
		expect(result.web3formsKey).toBe('key-abc');
	});
});

// ---------------------------------------------------------------------------
// transformBlockTechStackPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockTechStackPageContent', () => {
	it('merges JSON columns into LocalizedString-leaved shapes', () => {
		const raw = rawBlockTechStackPageContent();
		const result = transformBlockTechStackPageContent(raw as never);
		expect((result.meta as unknown as Record<string, unknown>).title).toMatchObject({ en: 'Tech Stack' });
		expect((result.hero as unknown as Record<string, unknown>).overline).toMatchObject({ en: 'Stack' });
	});

	// Regression: Phase 6 Task 6.1 fix-up — stale field names (download, share,
	// heading, body) that existed in an older TechStackPageContentSchema version
	// were removed. The schema must reject any payload that still uses those names.
	it('regression: PageSchema rejects stale field names (download, share, heading, body)', () => {
		// Build a raw fixture with stale field names in the hero/actions/cta blocks
		const staleRaw = {
			id: 'stale-uuid-1',
			status: 'published',
			translations: [
				{
					languages_code: 'en',
					meta: { title: 'Tech Stack', description: 'My tools' },
					// Stale field names that no longer exist in TechStackPageContentSchema:
					download: 'Download CV',
					share: 'Share',
					heading: 'My Stack',
					body: 'These are the tools I use.',
				},
			],
		};
		// transformBlockTechStackPageContent maps through the raw shape —
		// current field names (overline, titleLine1, etc.) will be missing/undefined.
		// PageSchema.parse() must reject the resulting shape.
		const item = transformBlockTechStackPageContent(staleRaw as never);
		expect(() =>
			PageSchema.parse({
				id: 'page-id',
				slug: 'tech-stack',
				status: 'published',
				title: 'Tech Stack',
				blocks: [{ collection: 'block_tech_stack_page_content', item }],
			}),
		).toThrow();
	});
});

// ---------------------------------------------------------------------------
// transformBlockBlogPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockBlogPageContent', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockBlogPageContent();
		const result = transformBlockBlogPageContent(raw as never);
		expect(result.intro).toMatchObject({ en: 'Welcome to my blog' });
	});
});

// ---------------------------------------------------------------------------
// transformBlockProjectsPageContent — slice-18i Task 4.0
// ---------------------------------------------------------------------------

describe('transformBlockProjectsPageContent', () => {
	it('merges translations into LocalizedString shape', () => {
		const raw = rawBlockProjectsPageContent();
		const result = transformBlockProjectsPageContent(raw as never);
		expect(result.intro).toMatchObject({ en: 'Projects I have built' });
	});
});

// ---------------------------------------------------------------------------
// PageSchema — 12-variant parameterized smoke test (slice-18i Phase 6 Task 6.1)
//
// Each entry: [collection, transformFn, rawFixtureFn]
// The test calls the transform, wraps the result in a minimal PageData envelope,
// and asserts PageSchema.parse() succeeds — catching any schema/transform drift
// before it reaches the load() pipeline.
// ---------------------------------------------------------------------------

/**
 * Wraps an already-transformed block item in a minimal PageData envelope
 * so PageSchema.parse() can validate the full shape.
 */
function pageEnvelope(
	collection: string,
	item: unknown,
	pageSlug = 'test-slug',
): unknown {
	return {
		id: 'page-test-id',
		slug: pageSlug,
		status: 'published',
		title: 'Test Page',
		blocks: [{ collection, item }],
	};
}

describe('PageSchema — all 12 variants smoke (it.each)', () => {
	it.each([
		['block_hero',                     () => transformBlockHero(rawBlockHero() as never)],
		['block_manifesto',                () => transformBlockManifesto(rawBlockManifesto() as never)],
		['block_proof_reel',               () => transformBlockProofReel(rawBlockProofReel() as never)],
		['block_services_grid',            () => transformBlockServicesGrid(rawBlockServicesGrid() as never)],
		['block_cta',                      () => transformBlockCta(rawBlockCta() as never)],
		['block_closer',                   () => transformBlockCloser(rawBlockCloser() as never)],
		['block_about_intro',              () => transformBlockAboutIntro(rawBlockAboutIntro() as never)],
		['block_about_content',            () => transformBlockAboutContent(rawBlockAboutContent() as never)],
		['block_contact_content',          () => transformBlockContactContent(rawBlockContactContent() as never)],
		['block_tech_stack_page_content',  () => transformBlockTechStackPageContent(rawBlockTechStackPageContent() as never)],
		['block_blog_page_content',        () => transformBlockBlogPageContent(rawBlockBlogPageContent() as never)],
		['block_projects_page_content',    () => transformBlockProjectsPageContent(rawBlockProjectsPageContent() as never)],
	] as const)('PageSchema.parse() accepts %s', (collection, buildItem) => {
		const item = buildItem();
		expect(() =>
			PageSchema.parse(pageEnvelope(collection, item)),
		).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// PageSchema — mismatched (collection, item.shape) rejection tests
//
// These ensure the discriminated union correctly rejects when the item shape
// does not match the declared collection. Three representative pairings are
// tested — sufficient to confirm the discriminator is wired, without testing
// every N×M permutation.
// ---------------------------------------------------------------------------

describe('PageSchema — wrong item shape rejects', () => {
	it('rejects block_hero with block_manifesto item shape', () => {
		const wrongItem = transformBlockManifesto(rawBlockManifesto() as never);
		expect(() =>
			PageSchema.parse(pageEnvelope('block_hero', wrongItem)),
		).toThrow();
	});

	it('rejects block_cta with block_closer item shape', () => {
		const wrongItem = transformBlockCloser(rawBlockCloser() as never);
		expect(() =>
			PageSchema.parse(pageEnvelope('block_cta', wrongItem)),
		).toThrow();
	});

	it('rejects block_about_content with block_contact_content item shape', () => {
		const wrongItem = transformBlockContactContent(rawBlockContactContent() as never);
		expect(() =>
			PageSchema.parse(pageEnvelope('block_about_content', wrongItem)),
		).toThrow();
	});

	it('rejects any block variant with an empty item object', () => {
		for (const collection of [
			'block_hero',
			'block_manifesto',
			'block_proof_reel',
		] as const) {
			expect(() =>
				PageSchema.parse(pageEnvelope(collection, {})),
			).toThrow();
		}
	});

	it('rejects an unknown collection name', () => {
		const validItem = transformBlockHero(rawBlockHero() as never);
		expect(() =>
			PageSchema.parse(pageEnvelope('block_journey_panel', validItem)),
		).toThrow();
	});
});
