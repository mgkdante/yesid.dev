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
	getProjectBySlug,
} from '$lib/repositories';
import type { Project } from '$lib/types';

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
// them. featuredProjects preserves the component's exact prior behaviour:
// proofReel.slugs order, slugs that resolve to no project silently dropped.
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
		services,
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
	]);

	// Second hop: the featured-project slugs live inside the proof-reel block,
	// so this resolve can only start once proofReel is in hand.
	const featuredProjects = (
		await Promise.all(proofReel.slugs.map((slug) => getProjectBySlug(slug, ctx)))
	).filter((p): p is Project => Boolean(p));

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
		featuredProjects,
	};
};
