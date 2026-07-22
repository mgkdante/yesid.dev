/**
 * tech-stack fetcher — reads `tech_stack` with translations (BlockEditorDoc per
 * locale) + icon_id M2O expansion + services/projects M2M junctions.
 * This module owns the build-time TechStackItem projection.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { toLocalizedBlockEditorDoc, toLocalizedFields } from '../locale';
import type { BlockEditorDoc } from '@repo/shared';
import type { StackLayer } from '@repo/shared/schemas';
import { TechStackItemSchema } from '@repo/shared/schemas';
import type { TechStackItem, IconRecord } from '@repo/shared';
import type { FetcherContext } from './types';

export interface DirectusTechStackTranslation {
	languages_code: 'en' | 'fr' | 'es';
	what_it_is: BlockEditorDoc | null;
	what_i_use_it_for: BlockEditorDoc | null;
	why_i_use_it_instead: BlockEditorDoc | null;
	/** slice-29: one sentence — what this tech enables (preview-slot caption). */
	enables?: string | null;
}

export interface DirectusTechStackRow {
	id: string;
	name: string;
	icon?: string | null;
	icon_id?: IconRecord | null;
	status: 'draft' | 'published' | 'archived';
	sort: number;
	/** slice-29: default blueprint layer — per-archetype links may override. */
	layer?: StackLayer | null;
	translations: readonly DirectusTechStackTranslation[];
	services?: ReadonlyArray<{ services_id: string }>;
	projects?: ReadonlyArray<{ projects_id: string }>;
}

/** Pure transform — DirectusTechStackRow → TechStackItem. Tested standalone. */
export function toTechStackItem(row: DirectusTechStackRow): TechStackItem {
	// slice-29 engine fields are OPTIONAL — keys are omitted (not null) when the
	// CMS has no value, so pre-slice-29 emitted modules stay byte-identical.
	const { enables } = toLocalizedFields(row.translations, [
		['enables', 'enables', 'optional'],
	]);
	return {
		id: row.id,
		name: row.name,
		icon: row.icon_id ?? null,
		what_it_is: toLocalizedBlockEditorDoc(row.translations, 'what_it_is'),
		what_i_use_it_for: toLocalizedBlockEditorDoc(row.translations, 'what_i_use_it_for'),
		why_i_use_it_instead: toLocalizedBlockEditorDoc(row.translations, 'why_i_use_it_instead'),
		relatedServices: row.services?.map((s) => s.services_id) ?? [],
		relatedProjects: row.projects?.map((p) => p.projects_id) ?? [],
		...(row.layer ? { layer: row.layer } : {}),
		...(enables ? { enables } : {}),
	};
}

/** Fetch + validate published tech_stack items sorted by `sort` ascending. */
export async function fetchTechStack({ client }: FetcherContext): Promise<readonly TechStackItem[]> {
	const rows = (await client.request(
		readItems('tech_stack', {
			fields: [
				'id',
				'name',
				{ icon_id: ['id', 'name', 'iconify_id', 'svg_override'] } as unknown as string,
				'status',
				'sort',
				'layer',
				{
					translations: [
						'languages_code',
						'what_it_is',
						'what_i_use_it_for',
						'why_i_use_it_instead',
						'enables',
					],
				} as unknown as string,
				{ services: ['services_id'] } as unknown as string,
				{ projects: ['projects_id'] } as unknown as string,
			],
			filter: { status: { _eq: 'published' } },
			sort: ['sort'],
			limit: -1,
		}),
	)) as unknown as DirectusTechStackRow[];

	return z.array(TechStackItemSchema).parse(rows.map(toTechStackItem));
}
