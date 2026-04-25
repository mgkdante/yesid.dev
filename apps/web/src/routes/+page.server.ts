import type { PageServerLoad } from './$types';
import { getMetroSvg } from '$lib/repositories';

// Slice 18d Phase 8 (Task 28-33): SSR-only fetch of the Montreal-metro hero
// SVG from Directus `/assets/<uuid>`. The SVG is threaded as a prop into
// `MetroNetwork.svelte` (via `HeroBanner.svelte`) and inlined with `{@html}`,
// so the markup is part of the SSR HTML and remains a valid LCP candidate.
//
// Server-only (not universal) because the SVG only needs to render once at
// SSR — there's no client navigation re-fetch path that benefits from the
// cache, and routing this through `+page.server.ts` keeps the asset fetch
// off the client bundle's request path entirely.
export const load: PageServerLoad = async () => {
	const metroSvg = await getMetroSvg();
	return { metroSvg };
};
