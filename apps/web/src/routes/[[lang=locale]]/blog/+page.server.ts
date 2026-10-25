// Fetch and facet derivation is shared with /blog/personal via loadBlogCategory.

import { loadBlogCategory } from './blog-category-loader';
import { localeEntries } from '#lib/server/prerender-entries.js';
import type { EntryGenerator } from './$types';
import { localeFromParams } from '#lib/utils/locale-routing.js';

export const entries = (() => localeEntries('/blog')) satisfies EntryGenerator;
export const prerender = entries().length > 0;

export async function load({ params }: { params: Record<string, string> }) {
	return loadBlogCategory('professional', localeFromParams(params));
}
