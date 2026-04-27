// Data loader for /tech-stack route.
// Tech items come from the adapter (Directus or static fallback) via the
// repository boundary. Scenarios removed in slice-18g (TechStackItem no
// longer carries domain/layer/relation data — Phase 5 wires the new Block
// Editor body fields into the template).
// Page chrome (techStackPage) flows through the adapter post-17c.

import {
	getAllTechItems,
	getTechStackPageContent,
} from '$lib/repositories';

export async function load() {
	const [items, techStackPage] = await Promise.all([
		getAllTechItems(),
		getTechStackPageContent(),
	]);

	return { items, techStackPage };
}
