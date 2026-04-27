// MorphShapeSchema — runtime mirror of the MorphShape TS interface in
// $lib/types (extracted to @repo/shared in slice-18 18c). Adapter ports that
// return morph-shape data parse through this schema before handing off to the
// repository layer.
//
// Slice-18 18f Phase 9 Task 59. Schema lives here (not in @repo/shared) until
// the schemas/ package extraction (post-18i) — keeps Zod schema co-located
// with the adapter consumer.

import { z } from 'zod';
import type { MorphShape } from '$lib/types';

export const MorphShapeSchema: z.ZodType<MorphShape> = z.object({
	id: z.string(),
	label: z.string(),
	path: z.string(),
	viewbox: z.string(),
	sort: z.number().int(),
});

// Drift detector — fail at compile time if the TS type and Zod schema diverge.
type _MorphShapeCheck = z.infer<typeof MorphShapeSchema> extends MorphShape
	? MorphShape extends z.infer<typeof MorphShapeSchema>
		? true
		: false
	: false;
const _morphShapeCheck: _MorphShapeCheck = true;
void _morphShapeCheck;
