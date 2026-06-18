import {
	getMetroSvg,
	getHeroContent,
	getHeroAnimContent,
	getManifestoContent,
	getProofReelContent,
	getServicesGridContent,
	getAboutContent,
	getCtaContent,
	getCloserContent,
	getInitialHeroData,
	getVisibleServices,
	getFeaturedProjects,
	getLatestPosts,
	getSiteMeta,
} from '$lib/repositories';
import { fetchServiceSvgContents } from '$lib/utils';

// slice-18i Phase 7C: home route now fetches ALL page-block content via the
// repository/adapter pipeline, threading event.locals.pageCache as ctx so
// loadPage('home') is called once and all block projections share that result.
//
// Previously only metroSvg was returned here; components still imported
// heroContent, heroAnimContent, INITIAL_HERO_DATA, etc. directly from static
// modules, bypassing Directus entirely. This restores the spec §6 guarantee:
// all 7 routes render from Directus M2A.
//
// slice-28.5 (audit #124): services + featuredProjects now also resolve here
// through the repository layer, closing the last primary-data adapter bypass —
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
		latestPosts,
	] = await Promise.all([
		getMetroSvg(ctx),
		getHeroContent(ctx),
		getHeroAnimContent(ctx),
		getManifestoContent(ctx),
		getProofReelContent(ctx),
		getServicesGridContent(ctx),
		getAboutContent(ctx),
		getCtaContent(ctx),
		getCloserContent(ctx),
		getInitialHeroData(ctx),
		getVisibleServices(ctx),
		getSiteMeta(ctx),
		getLatestPosts(2, 'professional', ctx),
	]);

	const [featuredProjects, serviceSvgContents] = await Promise.all([
		getFeaturedProjects(ctx),
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
		latestPosts,
		featuredProjects,
		serviceSvgContents,
	};
};
