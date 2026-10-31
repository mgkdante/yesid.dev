import { adapter } from '#lib/adapters/index.ts';
import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { bookingHref } from '#lib/utils/high-intent-links.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';

export const entries = localeEntries;

// Home page content resolves concurrently through the adapter.
export async function load({ fetch }: { fetch: typeof globalThis.fetch }) {
	const [
		metroSvg,
		hero,
		heroAnim,
		manifesto,
		proofReel,
		servicesGrid,
		about,
		closer,
		initialHeroData,
		services,
		siteMeta,
		contactPage,
	] = await Promise.all([
		adapter.content.metroSvg(),
		adapter.content.hero(),
		adapter.content.heroAnim(),
		adapter.content.manifesto(),
		adapter.content.proofReel(),
		adapter.content.servicesGrid(),
		adapter.content.about(),
		adapter.content.closer(),
		adapter.content.initialHeroData(),
		adapter.services.visible(),
		adapter.meta.site(),
		adapter.content.contactPage(),
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
		closer,
		initialHeroData,
		services,
		siteMeta,
		bookingHref: bookingHref(contactPage.socials),
		featuredProjects,
		serviceSvgContents,
	};
};
