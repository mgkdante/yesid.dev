// Data loader for /tech-stack route.
// All tech items and scenarios come from build-time markdown parsing
// via import.meta.glob in tech-stack.ts — no server secrets needed.

import { getAllTechItems, getAllScenarios } from '$lib/data/tech-stack.js';

export function load() {
	return {
		items: getAllTechItems(),
		scenarios: getAllScenarios(),
	};
}
