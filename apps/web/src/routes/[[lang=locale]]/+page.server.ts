import { adapter } from '#lib/adapters/index.ts';
import { fetchServiceSvgContents } from '#lib/utils/index.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';

export const entries = localeEntries;

// Home page content resolves through the adapter.
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
export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
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
		adapter.content.metroSvg(),
		adapter.content.hero(),
		adapter.content.heroAnim(),
		adapter.content.manifesto(),
		adapter.content.proofReel(),
		adapter.content.servicesGrid(),
		adapter.content.about(),
		adapter.content.cta(),
		adapter.content.closer(),
		adapter.content.initialHeroData(),
		adapter.services.visible(),
		adapter.meta.site(),
	]);

	const [featuredProjects, serviceSvgContents] = await Promise.all([
		adapter.projects.featured(),
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
