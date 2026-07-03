// IconRecordSchema — single runtime mirror of IconRecord in ../types/content.
// Consolidated here from the apps/web + apps/cms copies (site-hardening-a-plus).
//
// Per the slice-18h-ii Q5 pivot: iconify_id format validation uses a
// .transform() that WARNS and coerces to null on mismatch (non-throwing —
// degraded path renders placeholder; doesn't break the entire tech-stack page).

import { z } from 'zod';

// Iconify ID format: <prefix>:<name>
// prefix: lowercase letters + digits + hyphens, starting with a letter
// name: lowercase letters + digits + hyphens
const ICONIFY_ID_REGEX = /^[a-z][a-z0-9-]*:[a-z0-9-]+$/;

export const IconRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	iconify_id: z
		.string()
		.nullable()
		.transform((val) => {
			if (val && !ICONIFY_ID_REGEX.test(val)) {
				// Log warning + coerce to null (degraded path — placeholder render).
				// The adapter caller can detect and handle.
				console.warn(`[IconRecord] iconify_id "${val}" failed format check; using placeholder`);
				return null;
			}
			return val;
		}),
	svg_override: z.string().nullable(), // directus_files UUID
});

export type IconRecordParsed = z.infer<typeof IconRecordSchema>;
