import { localeFromParams } from '#lib/utils/locale-routing.ts';
import { adapter } from '#lib/adapters/index.ts';
import { bookingHref } from '#lib/utils/high-intent-links.ts';
import { fetchServiceSvgContents } from '#lib/utils/service-svg.ts';
import { localeEntries } from '#lib/server/prerender-entries.ts';

export const entries = localeEntries;

// Home page content resolves concurrently through the adapter.
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
		adapter.content.metroSvg(),
		adapter.content.hero(),
		adapter.content.heroAnim(),
		adapter.content.manifesto(),
		adapter.content.proofReel(),
		adapter.content.servicesGrid(),
		adapter.content.about(),
		adapter.content.closer(),
		adapter.content.initialHeroData(),
		adapter.services.visible(locale),
		adapter.meta.site(),
		adapter.content.contactPage(),
	]);

	const [featuredProjects, serviceSvgContents] = await Promise.all([
		adapter.projects.featured(locale),
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
