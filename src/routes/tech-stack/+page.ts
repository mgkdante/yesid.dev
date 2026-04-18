// Data loader for /tech-stack route.
// Tech items and scenarios come from build-time markdown parsing
// via import.meta.glob in tech-stack.ts — no server secrets needed.

import { getAllTechItems, getAllScenarios } from '$lib/repositories';

export async function load() {
	const [items, scenarios] = await Promise.all([
		getAllTechItems(),
		getAllScenarios(),
	]);

	return { items, scenarios };
}
