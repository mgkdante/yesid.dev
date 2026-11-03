import { localeFromParams } from '#lib/utils/locale-routing.ts';
import { catalog } from '#lib/catalog/index.ts';
import { bookingHref } from '#lib/utils/high-intent-links.ts';
import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';

export const entries = localeEntries;

// Home page content resolves concurrently through the catalog.
export async function load({ fetch, params = {} }: { fetch: typeof globalThis.fetch; params?: { lang?: string } }) {
	const locale = localeFromParams(params);
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
		catalog.content.metroSvg(),
		catalog.content.hero(),
		catalog.content.heroAnim(),
		catalog.content.manifesto(),
		catalog.content.proofReel(),
		catalog.content.servicesGrid(),
		catalog.content.about(),
		catalog.content.closer(),
		catalog.content.initialHeroData(),
		catalog.services.available(locale),
		catalog.meta.site(),
		catalog.content.contactPage(),
	]);

	const [featuredProjects, serviceSvgContents] = await Promise.all([
		catalog.projects.featured(locale),
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
