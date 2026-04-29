// Layout server load — fetches nav slots for all 4 placement positions.
//
// slice-18i Phase 5 Task 5.2: Nav.svelte and Footer.svelte previously imported
// nav data directly from $lib/content. This server load centralises the fetch
// so components receive NavLink arrays as typed props — no direct $lib/content
// imports remain in layout components after this task.
//
// Failure strategy: each nav placement call is individually guarded. A single
// slot failing (e.g., CMS unreachable for footer links) returns an empty array
// for that slot rather than crashing the entire layout. Nav + menu overlay are
// more critical so they also get a static fallback.

import type { LayoutServerLoad } from './$types';
import { adapter } from '$lib/adapters';
import { navLinks as staticNavLinks, menuItems as staticMenuItems } from '$lib/content/nav';
import type { NavLink } from '$lib/content/nav';

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

	const [headerLinks, footerLinks, mobileLinks, menuItems] = await Promise.all([
		safeByPlacement('header', staticNavLinks),
		safeByPlacement('footer'),
		safeByPlacement('mobile'),
		safeByPlacement('menu', staticMenuItems),
	]);

	return { headerLinks, footerLinks, mobileLinks, menuItems };
};
