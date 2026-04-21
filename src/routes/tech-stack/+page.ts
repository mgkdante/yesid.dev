// Data loader for /tech-stack route.
// Tech items and scenarios come from build-time markdown parsing
// via import.meta.glob in tech-stack.ts — no server secrets needed.
// Page chrome (techStackPage) flows through the adapter post-17c, closing
// the 17b seam leak that had `+page.svelte` importing from `$lib/content`.

import {
	getAllTechItems,
	getAllScenarios,
	getTechStackPageContent,
} from '$lib/repositories';

export async function load() {
	const [items, scenarios, techStackPage] = await Promise.all([
		getAllTechItems(),
		getAllScenarios(),
		getTechStackPageContent(),
	]);

	return { items, scenarios, techStackPage };
}
