// Admin browse surface for the icons collection (slice-18h-ii Phase 6, Task 13).
//
// Raw fetch to Directus — no Zod parsePort gauntlet needed for a read-only
// admin page. No directus.icons adapter port exists (icons are only consumed
// as nested expansions on tech_stack rows in the main adapter).
//
// Server-only (+page.server.ts) so PUBLIC_DIRECTUS_URL is read once at SSR
// and the fetch never hits the client bundle. Uses $env/dynamic/public to
// match the existing adapter convention (directus.ts:18).

import type { IconRecord } from '@repo/shared';
import { env as publicEnv } from '$env/dynamic/public';

export async function load() {
	const base = (publicEnv.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev').replace(/\/+$/, '');
	const url =
		`${base}/items/icons` +
		`?fields=id,name,iconify_id,svg_override,category` +
		`&filter[status][_eq]=published` +
		`&sort=sort` +
		`&limit=-1`;

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`[admin/icons] Directus fetch failed: ${res.status} ${res.statusText}`);
	}

	const json = await res.json();
	const icons: IconRecord[] = (json.data ?? []).map(
		(row: {
			id: string;
			name: string;
			iconify_id: string | null;
			svg_override: string | null;
		}) => ({
			id: row.id,
			name: row.name,
			iconify_id: row.iconify_id ?? null,
			svg_override: row.svg_override ?? null,
		}),
	);

	return { icons };
};
