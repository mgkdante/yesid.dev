import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { RouteSeoOverrideSchema, type RouteSeoOverride } from '@repo/shared';
import { toLocalizedFields } from '../locale';
import type { FetcherContext } from './types';

export interface DirectusRouteSeoTranslationRow {
	languages_code: string;
	title?: string | null;
	description?: string | null;
}

export interface DirectusRouteSeoRow {
	id: number;
	path: string;
	status: 'draft' | 'published' | 'archived';
	sort?: number | null;
	og_image?: string | { id?: string | null } | null;
	translations?: DirectusRouteSeoTranslationRow[];
}

function fileId(value: DirectusRouteSeoRow['og_image']): string | null {
	if (!value) return null;
	if (typeof value === 'string') return value;
	return typeof value.id === 'string' && value.id.length > 0 ? value.id : null;
}

export function orderRouteSeoRows(rows: readonly DirectusRouteSeoRow[]): DirectusRouteSeoRow[] {
	return [...rows].sort((a, b) => {
		const sa = a.sort ?? Number.MAX_SAFE_INTEGER;
		const sb = b.sort ?? Number.MAX_SAFE_INTEGER;
		if (sa !== sb) return sa - sb;
		return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
	});
}

export function toRouteSeoOverride(row: DirectusRouteSeoRow): RouteSeoOverride {
	const value: RouteSeoOverride = {
		path: row.path,
		ogImage: fileId(row.og_image),
		...toLocalizedFields(row.translations, [
			['title', 'title', 'nullable'],
			['description', 'description', 'nullable'],
		]),
	};
	return RouteSeoOverrideSchema.parse(value);
}

export async function fetchRouteSeoOverrides({
	client,
}: FetcherContext): Promise<readonly RouteSeoOverride[]> {
	const rows = (await client.request(
		readItems('route_seo', {
			filter: {
				status: { _eq: 'published' },
			} as unknown as Record<string, unknown>,
			fields: [
				'id',
				'path',
				'status',
				'sort',
				'og_image',
				{
					translations: ['languages_code', 'title', 'description'],
				} as unknown as string,
			] as unknown as (keyof DirectusRouteSeoRow)[],
			sort: ['sort', 'path'],
			limit: -1,
		}),
	)) as unknown as DirectusRouteSeoRow[];

	if (rows.length === 0) {
		throw new Error('[fetchRouteSeoOverrides] no published route_seo rows found');
	}

	return z.array(RouteSeoOverrideSchema).parse(orderRouteSeoRows(rows).map(toRouteSeoOverride));
}
