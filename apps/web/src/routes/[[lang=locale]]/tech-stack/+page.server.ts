// Data loader for /tech-stack route.
// Tech items and page chrome come through the adapter (the active swap point)
// from the static content layer post-27.2.

import { adapter } from '$lib/adapters';
import { localeEntries } from '$lib/server/prerender-entries';
import type { EntryGenerator } from './$types';

export const entries = (() => localeEntries('/tech-stack')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load() {
	const [items, techStackPage] = await Promise.all([
		adapter.techStack.all(),
		adapter.content.techStackPage(),
	]);

	return { itemCount: items.length, techStackPage };
};
