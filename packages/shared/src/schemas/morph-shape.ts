import { z } from 'zod';

export const MorphShapeSchema = z.object({
	id: z.string(),
	label: z.string(),
	/** SVG path d attribute. */
	path: z.string(),
	/** SVG viewBox, typically 0 0 48 48. */
	viewbox: z.string(),
	sort: z.number().int(),
});

export type MorphShape = z.infer<typeof MorphShapeSchema>;
