import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';
import type { PageData } from './$types';
// slice-18i Phase 7C: +page.server.ts now loads all home-page block content
// from Directus M2A. Unit tests must supply full stubData with all block props.
import {
	heroContent,
	heroAnimContent,
	manifestoContent,
	proofReelContent,
	servicesGridContent,
	aboutContent,
	ctaContent,
	closerContent,
} from '$lib/content/site-content';
import { INITIAL_HERO_DATA } from '$lib/content/hero-data';
import { getProjectBySlug } from '$lib/content';

// The proof-reel card count is CMS-driven: `proofReelContent.slugs` and the
// `projects` collection are both generated from live Directus, and the
// component renders one card per slug that resolves to a real project. Derive
// the expected count instead of hardcoding it (precedent: slice-16 commit
// 8259c6b "decouple test assertions from CMS-controlled copy").
const expectedProofCards = proofReelContent.slugs.filter((slug) =>
	getProjectBySlug(slug),
).length;

// PageData merges +page.server.ts return + +layout.server.ts return + +layout.ts
// return (per SvelteKit's typed load chain). The home component only consumes
// the page-level fields; layout fields (nav slots, errorPage, seo, themeColor)
// come from layout-server stubs that are out of this unit test's scope. Cast
// through unknown — the home component never reads layout fields, so the unit
// stub is safe.
const stubData = {
	metroSvg: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
	hero: heroContent,
	heroAnim: heroAnimContent,
	manifesto: manifestoContent,
	proofReel: proofReelContent,
	servicesGrid: servicesGridContent,
	about: aboutContent,
	cta: ctaContent,
	closer: closerContent,
	initialHeroData: INITIAL_HERO_DATA,
} as unknown as PageData;

const renderPage = () => render(Page, { props: { data: stubData } });

describe('Home page', () => {
	it('renders the app root', () => {
		renderPage();
		expect(screen.getByTestId('app-root')).toBeInTheDocument();
	});

	it('renders the hero banner', () => {
		renderPage();
		expect(screen.getByTestId('hero-banner')).toBeInTheDocument();
	});

	it('renders the metro network container in the hero', () => {
		renderPage();
		expect(screen.getByTestId('metro-network-container')).toBeInTheDocument();
	});

	it('renders the hero scroll prompt in its initial typewriter frame', () => {
		const { container } = renderPage();
		const scrollPrompt = container.querySelector('.scroll-prompt');
		const scrollText = scrollPrompt?.querySelector('span:first-child');
		const cursor = scrollPrompt?.querySelector('.scroll-block-cursor');

		expect(scrollPrompt).toBeInTheDocument();
		expect(scrollText?.textContent).toBe('');
		expect(cursor).toHaveClass('typewriter-cursor');
	});

	it('renders the hero headline', () => {
		renderPage();
		// Structural: both headline lines render with non-empty content from
		// whatever data the adapter supplied. We do NOT assert specific copy —
		// Directus owns the words; this test owns the chain integrity.
		const line1 = screen.getByTestId('hero-line1');
		const line2 = screen.getByTestId('hero-line2');
		expect(line1).toBeInTheDocument();
		expect(line1.textContent?.trim()).toBeTruthy();
		expect(line2).toBeInTheDocument();
		expect(line2.textContent?.trim()).toBeTruthy();
	});

	it('renders the hero orange dot', () => {
		renderPage();
		const dot = screen.getByTestId('hero-dot');
		expect(dot).toBeInTheDocument();
		expect(dot.tagName.toLowerCase()).toBe('svg');
	});

	it('renders hero subheadline', () => {
		renderPage();
		const sub = screen.getByTestId('hero-subheadline');
		expect(sub).toBeInTheDocument();
		expect(sub.textContent?.trim()).toBeTruthy();
	});

	it('renders hero subtitle', () => {
		renderPage();
		const subtitle = screen.getByTestId('hero-subtitle');
		expect(subtitle).toBeInTheDocument();
		expect(subtitle.textContent?.trim()).toBeTruthy();
	});

	it('renders hero CTAs', () => {
		renderPage();
		expect(screen.getByTestId('hero-cta-projects')).toBeInTheDocument();
		expect(screen.getByTestId('hero-cta-contact')).toBeInTheDocument();
	});

	it('renders hero metric cards', () => {
		renderPage();
		expect(screen.getByTestId('hero-metrics')).toBeInTheDocument();
		const cards = screen.getAllByTestId('metric-card');
		expect(cards).toHaveLength(3);
	});

	it('renders hero SQL panel', () => {
		renderPage();
		const panels = screen.getAllByTestId('sql-panel');
		expect(panels.length).toBeGreaterThanOrEqual(1);
		const queries = screen.getAllByTestId('sql-query');
		expect(queries[0].textContent).toContain('SELECT');
	});

	it('renders hero refresh button', () => {
		renderPage();
		expect(screen.getByTestId('hero-refresh')).toBeInTheDocument();
	});

	it('renders hazard stripe dividers between sections', () => {
		renderPage();
		const container = screen.getByTestId('app-root');
		const stripes = container.querySelectorAll('[aria-hidden="true"][style*="repeating-linear-gradient"]');
		expect(stripes.length).toBeGreaterThanOrEqual(1);
	});

	it('renders the manifesto section', () => {
		renderPage();
		expect(screen.getByTestId('manifesto-section')).toBeInTheDocument();
	});

	it('renders manifesto capability pills', () => {
		renderPage();
		const pills = screen.getAllByTestId('manifesto-pill');
		expect(pills).toHaveLength(5);
	});

	it('renders the proof reel section', () => {
		renderPage();
		expect(screen.getByTestId('proof-reel-section')).toBeInTheDocument();
	});

	it('renders one proof reel card per resolvable featured slug', () => {
		renderPage();
		const cards = screen.getAllByTestId('proof-card');
		expect(cards).toHaveLength(expectedProofCards);
	});

	it('renders the services section', () => {
		renderPage();
		expect(screen.getByTestId('services-section')).toBeInTheDocument();
	});

	it('renders 6 service cards', () => {
		renderPage();
		const cards = screen.getAllByTestId('services-card');
		expect(cards).toHaveLength(6);
	});

	it('renders service benefit headlines', () => {
		renderPage();
		const benefits = screen.getAllByTestId('services-benefit');
		expect(benefits).toHaveLength(6);
	});

	it('renders the closer section', () => {
		renderPage();
		expect(screen.getByTestId('closer-section')).toBeInTheDocument();
	});

	it('renders closer departure board with 5 rows', () => {
		renderPage();
		const rows = screen.getAllByTestId('closer-row');
		expect(rows).toHaveLength(5);
	});

});
