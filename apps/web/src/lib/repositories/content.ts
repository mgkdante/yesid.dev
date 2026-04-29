// Site-content repository — thin async delegation for all page- and
// section-level copy (hero, about, cta, nav, error page, etc.). Component-
// visible LocalizedString enforcement and hardcoded-string extraction happen
// in Tasks 17b-5 through 17b-7.

import { adapter } from '$lib/adapters';
import type { AboutContent, ContactContent } from '$lib/types';
import type { ErrorPageContent, NavLink, MenuItem } from '$lib/content/nav';
import type { HeroData } from '$lib/content/hero-data';
import type { TechStackPageContent } from '$lib/schemas/tech-stack-page';

export async function getHeroContent() {
	return adapter.content.hero();
}

export async function getHeroAnimContent() {
	return adapter.content.heroAnim();
}

export async function getManifestoContent() {
	return adapter.content.manifesto();
}

export async function getProofReelContent() {
	return adapter.content.proofReel();
}

export async function getServicesGridContent() {
	return adapter.content.servicesGrid();
}

export async function getAboutContent() {
	return adapter.content.about();
}

export async function getCtaContent() {
	return adapter.content.cta();
}

export async function getCloserContent() {
	return adapter.content.closer();
}

export async function getNavLinks(): Promise<readonly NavLink[]> {
	return adapter.content.navLinks();
}

export async function getMenuItems(): Promise<readonly MenuItem[]> {
	return adapter.content.menuItems();
}

export async function getErrorPageContent(): Promise<ErrorPageContent> {
	return adapter.content.errorPage();
}

export async function getAboutPageContent(): Promise<AboutContent> {
	return adapter.content.aboutPage();
}

export async function getContactPageContent(): Promise<ContactContent> {
	return adapter.content.contactPage();
}

export async function getTechStackPageContent(): Promise<TechStackPageContent> {
	return adapter.content.techStackPage();
}

// Hero mock data — heroMock() returns a freshly shuffled HeroData on each
// call; initialHeroData() returns the deterministic seed used during SSR.
export async function getHeroMockData(): Promise<HeroData> {
	return adapter.content.heroMock();
}

export async function getInitialHeroData(): Promise<HeroData> {
	return adapter.content.initialHeroData();
}

// Slice 18d Phase 8: Montreal-metro hero SVG, fetched from Directus
// `/assets/<uuid>` at SSR time and threaded into MetroNetwork.svelte as a
// prop. See adapter.content.metroSvg in directus.ts for the fetch layer.
export async function getMetroSvg(): Promise<string> {
	return adapter.content.metroSvg();
}
