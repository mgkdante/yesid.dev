// MorphShapeSchema — single runtime mirror of the MorphShape interface in
// ../types/content. Consolidated here from the apps/web + apps/cms copies
// (site-hardening-a-plus).

import { z } from 'zod';
import type { AssertSchemaMatches } from './shared';
import type { MorphShape } from '../types/content';

export const MorphShapeSchema: z.ZodType<MorphShape> = z.object({
	id: z.string(),
	label: z.string(),
	path: z.string(),
	viewbox: z.string(),
	sort: z.number().int(),
});

// Drift detector — compile error (`true satisfies never`) on schema/type drift.
true satisfies AssertSchemaMatches<z.infer<typeof MorphShapeSchema>, MorphShape>;
