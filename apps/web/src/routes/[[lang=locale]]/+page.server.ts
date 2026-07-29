import { adapter } from '$lib/adapters';
import { fetchServiceSvgContents } from '$lib/utils';
import { localeEntries } from '$lib/server/prerender-entries';

export const entries = localeEntries;

// slice-18i Phase 7C: home route now fetches ALL page-block content via the
// adapter pipeline, threading event.locals.pageCache as ctx so
// loadPage('home') is called once and all block projections share that result.
//
// Previously only metroSvg was returned here; components still imported
// heroContent, heroAnimContent, INITIAL_HERO_DATA, etc. directly from static
// modules, bypassing Directus entirely. This restores the spec §6 guarantee:
// all 7 routes render from Directus M2A.
//
// slice-28.5 (audit #124): services + featuredProjects now also resolve here
// through the adapter layer, closing the last primary-data adapter bypass —
// HomeServices/FeaturedProjects previously called the $lib/content companions
// directly, so a future adapter re-point (slice-26) would not have reached
// them. featuredProjects now comes from the project row `featured` toggle,
// making the project collection the source of truth for home proof-reel membership.
//
// Promise.all ensures all blocks resolve concurrently within a single request.
// Intentionally untyped (no PageServerLoad annotation) — App.PageData.seo is
// provided by +layout.ts and not required from the page server load.
export async function load({ locals, fetch }: { locals: App.Locals; fetch: typeof globalThis.fetch }) {
	const ctx = { pageCache: locals.pageCache };

	const [
		metroSvg,
		hero,
		heroAnim,
		manifesto,
		proofReel,
		servicesGrid,
		about,
		cta,
		closer,
		initialHeroData,
		services,
		siteMeta,
	] = await Promise.all([
		adapter.content.metroSvg(ctx),
		adapter.content.hero(ctx),
		adapter.content.heroAnim(ctx),
		adapter.content.manifesto(ctx),
		adapter.content.proofReel(ctx),
		adapter.content.servicesGrid(ctx),
		adapter.content.about(ctx),
		adapter.content.cta(ctx),
		adapter.content.closer(ctx),
		adapter.content.initialHeroData(ctx),
		adapter.services.visible(ctx),
		adapter.meta.site(ctx),
	]);

	const [featuredProjects, serviceSvgContents] = await Promise.all([
		adapter.projects.featured(ctx),
		fetchServiceSvgContents(fetch, services),
	]);

	return {
		metroSvg,
		hero,
		heroAnim,
		manifesto,
		proofReel,
		servicesGrid,
		about,
		cta,
		closer,
		initialHeroData,
		services,
		siteMeta,
		featuredProjects,
		serviceSvgContents,
	};
};
