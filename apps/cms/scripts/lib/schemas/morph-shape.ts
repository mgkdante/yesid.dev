/**
 * MorphShape Zod schema mirroring `apps/web/src/lib/schemas/morph-shape.ts`.
 */

import { z } from 'zod';

export const MorphShapeSchema = z.object({
	id: z.string(),
	label: z.string(),
	path: z.string(),
	viewbox: z.string(),
	sort: z.number().int(),
});

export type MorphShape = z.infer<typeof MorphShapeSchema>;
