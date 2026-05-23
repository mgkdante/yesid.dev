/**
 * Shared Zod schemas used across fetcher modules.
 *
 * Mirrors `apps/web/src/lib/schemas/shared.ts` LocalizedStringSchema. Kept
 * standalone (no apps/web import) because the apps/web schemas use SvelteKit
 * `$lib/*` aliases that don't resolve from CLI scripts.
 */

import { z } from 'zod';

export const LocalizedStringSchema = z.object({
	en: z.string().min(1, 'LocalizedString.en must be non-empty'),
	fr: z.string().optional(),
	es: z.string().optional(),
});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
