import { error } from '@sveltejs/kit';
import { adapter } from '$lib/adapters';
import { legalEntries } from '$lib/server/prerender-entries';

export const entries = legalEntries;

export async function load({ params, locals }: { params: { slug: string }; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const legalPage = await adapter.legal.bySlug(params.slug, ctx);
	if (!legalPage) error(404, 'Legal page not found');
	return { legalPage };
}
