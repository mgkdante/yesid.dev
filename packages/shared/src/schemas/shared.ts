import { z } from 'zod';

export const LocalizedStringSchema = z.object({
	/** English is required and must contain non-whitespace content; fr/es may use the locale fallback. */
	en: z
		.string()
		.refine((s) => s.trim().length > 0, {
			message: 'LocalizedString.en is required and must contain non-whitespace content',
		}),
	fr: z.string().optional(),
	es: z.string().optional(),
});

export const LocaleSchema = z.enum(['en', 'fr', 'es']);

export type Locale = z.infer<typeof LocaleSchema>;
export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
