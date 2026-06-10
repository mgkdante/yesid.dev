// Site-content repository — thin async delegation for all page- and
// section-level copy (hero, about, cta, nav, error page, etc.).
//
// slice-18i Phase 7B: all getters are now ctx-aware (optional PreviewContext
// parameter). Routes thread event.locals.pageCache through here so loadPage()
// can memo-ize per-request across multiple content.* calls.
//
// Backwards-compatible: ctx is optional everywhere, so existing call sites
// without ctx continue to work (loadPage degrades to one fetch per call).

import { adapter } from '$lib/adapters';
import type { AboutContent, ContactContent, PreviewContext } from '$lib/types';
import type { HeroData } from '$lib/content/hero-data';
import type { TechStackPageContent, BlogPageContent, ProjectsPageContent } from '@repo/shared/schemas';

export async function getHeroContent(ctx?: PreviewContext) {
	return adapter.content.hero(ctx);
}

export async function getHeroAnimContent(ctx?: PreviewContext) {
	return adapter.content.heroAnim(ctx);
}

export async function getManifestoContent(ctx?: PreviewContext) {
	return adapter.content.manifesto(ctx);
}

export async function getProofReelContent(ctx?: PreviewContext) {
	return adapter.content.proofReel(ctx);
}

export async function getServicesGridContent(ctx?: PreviewContext) {
	return adapter.content.servicesGrid(ctx);
}

export async function getAboutContent(ctx?: PreviewContext) {
	return adapter.content.about(ctx);
}

export async function getCtaContent(ctx?: PreviewContext) {
	return adapter.content.cta(ctx);
}

export async function getCloserContent(ctx?: PreviewContext) {
	return adapter.content.closer(ctx);
}

// getNavLinks / getMenuItems / getErrorPageContent — pruned in slice-28.3
// (#117, zero consumers; nav + error chrome read static content directly).

export async function getAboutPageContent(ctx?: PreviewContext): Promise<AboutContent> {
	return adapter.content.aboutPage(ctx);
}

export async function getContactPageContent(ctx?: PreviewContext): Promise<ContactContent> {
	return adapter.content.contactPage(ctx);
}

export async function getTechStackPageContent(ctx?: PreviewContext): Promise<TechStackPageContent> {
	return adapter.content.techStackPage(ctx);
}

// slice-18i Phase 7A — new page-chrome getters for /blog and /projects.
export async function getBlogPageContent(ctx?: PreviewContext): Promise<BlogPageContent> {
	return adapter.content.blogPage(ctx);
}

export async function getProjectsPageContent(ctx?: PreviewContext): Promise<ProjectsPageContent> {
	return adapter.content.projectsPage(ctx);
}

// getHeroMockData — pruned in slice-28.3 (#107/#116) with the heroMock render
// plumbing (HeroBanner regenerates client-side via generateHeroData()).
// adapter.content.heroMock stays — the oracle suites exercise it.

// initialHeroData() returns the deterministic seed used during SSR.
export async function getInitialHeroData(ctx?: PreviewContext): Promise<HeroData> {
	return adapter.content.initialHeroData(ctx);
}

// Slice 18d Phase 8: Montreal-metro hero SVG, fetched from Directus
// `/assets/<uuid>` at SSR time and threaded into MetroNetwork.svelte as a
// prop. See adapter.content.metroSvg in directus.ts for the fetch layer.
export async function getMetroSvg(ctx?: PreviewContext): Promise<string> {
	return adapter.content.metroSvg(ctx);
}
