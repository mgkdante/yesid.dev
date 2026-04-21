// Shared schema primitives consumed across the schema layer.
// LocalizedStringSchema moved here from seo.ts (slice-17c) so every domain
// schema can import it without dragging the SEO graph along. seo.ts re-exports
// for back-compat with existing consumers (routeSeoEntries, tests).

import { z } from 'zod';

// Reusable LocalizedString schema. Mirrors the interface in $lib/types.
// English is required; French and Spanish are optional, filled over time.
// `en` must contain at least one non-whitespace character — an empty or
// whitespace-only string is semantically missing content, not "present".
export const LocalizedStringSchema = z.object({
	en: z
		.string()
		.refine((s) => s.trim().length > 0, {
			message: 'LocalizedString.en is required and must contain non-whitespace content',
		}),
	fr: z.string().optional(),
	es: z.string().optional(),
});
