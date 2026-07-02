/**
 * morph-shapes fetcher — reads the `morph_shapes` flat collection sorted by
 * `sort` ascending. Output replaces the derived-from-utils/shapes.ts fallback
 * in static.ts (per shape audit, becomes a new `morph-shapes.ts` content module).
 *
 * Mirrors adapter `content.morphShapes()` at apps/web/src/lib/adapters/directus.ts:3001.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { MorphShapeSchema } from '@repo/shared/schemas';
import type { MorphShape } from '@repo/shared';
import type { FetcherContext } from './types';

export async function fetchMorphShapes({ client }: FetcherContext): Promise<readonly MorphShape[]> {
	const rows = (await client.request(
		readItems('morph_shapes', {
			fields: ['id', 'label', 'path', 'viewbox', 'sort'],
			sort: ['sort'],
			limit: -1,
		}),
	)) as unknown as MorphShape[];
	return z.array(MorphShapeSchema).parse(rows);
}
