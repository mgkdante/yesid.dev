/**
 * IconRecord schema mirroring `apps/web/src/lib/schemas/icon.ts`.
 * Iconify format validation is lenient (warn + null) to match runtime behavior.
 */

import { z } from 'zod';

const ICONIFY_ID_REGEX = /^[a-z][a-z0-9-]*:[a-z0-9-]+$/;

export const IconRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	iconify_id: z
		.string()
		.nullable()
		.transform((val) => {
			if (val && !ICONIFY_ID_REGEX.test(val)) {
				console.warn(`[IconRecord] iconify_id "${val}" failed format check; using placeholder`);
				return null;
			}
			return val;
		}),
	svg_override: z.string().nullable(),
});

export type IconRecord = z.infer<typeof IconRecordSchema>;
