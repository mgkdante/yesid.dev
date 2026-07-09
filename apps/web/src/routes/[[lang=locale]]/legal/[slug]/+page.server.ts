import { error } from '@sveltejs/kit';
import { getLegalPageBySlug } from '$lib/repositories';
import { legalEntries } from '$lib/server/prerender-entries';

export const entries = legalEntries;

export async function load({ params, locals }: { params: { slug: string }; locals: App.Locals }) {
	const ctx = { pageCache: locals.pageCache };
	const legalPage = await getLegalPageBySlug(params.slug, ctx);
	if (!legalPage) error(404, 'Legal page not found');
	return { legalPage };
}
