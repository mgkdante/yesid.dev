import { z } from 'zod';

// Iconify ID format: <prefix>:<name>
// prefix: lowercase letters + digits + hyphens, starting with a letter
// name: lowercase letters + digits + hyphens
const ICONIFY_ID_REGEX = /^[a-z][a-z0-9-]*:[a-z0-9-]+$/;

export const IconRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	/** Render priority is svg_override, then iconify_id, then the placeholder. */
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

export type IconRecord = z.infer<typeof IconRecordSchema>;
