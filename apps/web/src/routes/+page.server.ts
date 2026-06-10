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
} from '$lib/repositories';

// slice-18i Phase 7C: home route now fetches ALL page-block content via the
// repository/adapter pipeline, threading event.locals.pageCache as ctx so
// loadPage('home') is called once and all block projections share that result.
//
// Previously only metroSvg was returned here; components still imported
// heroContent, heroAnimContent, INITIAL_HERO_DATA, etc. directly from static
// modules, bypassing Directus entirely. This restores the spec §6 guarantee:
// all 7 routes render from Directus M2A.
//
// Promise.all ensures all blocks resolve concurrently within a single request.
// Intentionally untyped (no PageServerLoad annotation) — App.PageData.seo is
// provided by +layout.ts and not required from the page server load.
export async function load({ locals }: { locals: App.Locals }) {
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
	]);

	return { metroSvg, hero, heroAnim, manifesto, proofReel, servicesGrid, about, cta, closer, initialHeroData };
};
