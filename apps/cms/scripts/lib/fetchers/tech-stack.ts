/**
 * tech-stack fetcher — reads `tech_stack` with translations (BlockEditorDoc per
 * locale) + icon_id M2O expansion + services/projects M2M junctions.
 * Mirrors apps/web/src/lib/adapters/directus.ts:2030 `toTechStackItem` + L2756.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { toLocalizedBlockEditorDoc } from '../locale';
import type { BlockEditorDoc } from '@repo/shared';
import { TechStackItemSchema, type TechStackItem } from '../schemas/tech-stack';
import type { IconRecord } from '../schemas/icon';
import type { FetcherContext } from './types';

export interface DirectusTechStackTranslation {
	languages_code: 'en' | 'fr' | 'es';
	what_it_is: BlockEditorDoc | null;
	what_i_use_it_for: BlockEditorDoc | null;
	why_i_use_it_instead: BlockEditorDoc | null;
}

export interface DirectusTechStackRow {
	id: string;
	name: string;
	icon?: string | null;
	icon_id?: IconRecord | null;
	status: 'draft' | 'published' | 'archived';
	sort: number;
	translations: readonly DirectusTechStackTranslation[];
	services?: ReadonlyArray<{ services_id: string }>;
	projects?: ReadonlyArray<{ projects_id: string }>;
}

/** Pure transform — DirectusTechStackRow → TechStackItem. Tested standalone. */
export function toTechStackItem(row: DirectusTechStackRow): TechStackItem {
	return {
		id: row.id,
		name: row.name,
		icon: row.icon_id ?? null,
		what_it_is: toLocalizedBlockEditorDoc(row.translations, 'what_it_is'),
		what_i_use_it_for: toLocalizedBlockEditorDoc(row.translations, 'what_i_use_it_for'),
		why_i_use_it_instead: toLocalizedBlockEditorDoc(row.translations, 'why_i_use_it_instead'),
		relatedServices: row.services?.map((s) => s.services_id) ?? [],
		relatedProjects: row.projects?.map((p) => p.projects_id) ?? [],
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
				{
					translations: [
						'languages_code',
						'what_it_is',
						'what_i_use_it_for',
						'why_i_use_it_instead',
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
