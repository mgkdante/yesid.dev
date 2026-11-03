import { error } from '@sveltejs/kit';
import { catalog } from '#lib/catalog/index.ts';
import { legalEntries } from '#lib/server/prerender-entries.ts';

export const entries = legalEntries;
export const prerender = entries().length > 0;

export async function load({ params }: { params: { slug: string } }) {
	const legalPage = await catalog.legal.bySlug(params.slug);
	if (!legalPage) error(404, 'Legal page not found');
	return { legalPage };
}
