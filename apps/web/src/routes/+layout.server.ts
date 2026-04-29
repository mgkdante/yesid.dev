// Layout server load — fetches nav slots for all 4 placement positions plus
// the generic error page content (status 0 / CMS fallback row).
//
// slice-18i Phase 5 Task 5.2: Nav.svelte and Footer.svelte previously imported
// nav data directly from $lib/content. This server load centralises the fetch
// so components receive NavLink arrays as typed props — no direct $lib/content
// imports remain in layout components after this task.
//
// slice-18i Phase 5 Task 5.4: +error.svelte previously imported errorPageContent
// directly from $lib/content. SvelteKit's error pages have no companion loader,
// so error page copy is pre-fetched here and forwarded via $page.data.errorPage.
// Status 0 maps to the CMS generic-fallback row; the component renders it for
// all status codes (404, 500, etc.) until per-status CMS rows ship.
//
// Failure strategy: each fetch is individually guarded. A failing slot returns
// [] or the static fallback rather than crashing the layout.

import type { LayoutServerLoad } from './$types';
import { adapter } from '$lib/adapters';
import { navLinks as staticNavLinks, menuItems as staticMenuItems, errorPageContent as staticErrorPageContent } from '$lib/content/nav';
import type { NavLink, ErrorPageContent } from '$lib/content/nav';

export const load: LayoutServerLoad = async () => {
	const safeByPlacement = async (
		placement: 'header' | 'footer' | 'mobile' | 'menu',
		fallback: readonly NavLink[] = [],
	): Promise<readonly NavLink[]> => {
		try {
			return await adapter.nav.byPlacement(placement);
		} catch {
			return fallback;
		}
	};

	const safeErrorPage = async (): Promise<ErrorPageContent> => {
		try {
			return await adapter.content.errorPage(0);
		} catch {
			return staticErrorPageContent;
		}
	};

	const [headerLinks, footerLinks, mobileLinks, menuItems, errorPage] = await Promise.all([
		safeByPlacement('header', staticNavLinks),
		safeByPlacement('footer'),
		safeByPlacement('mobile'),
		safeByPlacement('menu', staticMenuItems),
		safeErrorPage(),
	]);

	return { headerLinks, footerLinks, mobileLinks, menuItems, errorPage };
};
