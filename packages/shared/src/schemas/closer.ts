import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

export const CloserContentSchema = z.object({
	cta: z.object({
		label: LocalizedStringSchema,
		href: z.string(),
	}),
	rows: z.object({
		contact: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		connect: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		read: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		about: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
	}),
	terminal: z.object({
		title: LocalizedStringSchema,
		city: LocalizedStringSchema,
		encoding: LocalizedStringSchema,
		/** Footer label template containing the {count} placeholder. */
		destinationsLabel: LocalizedStringSchema,
		prompt: LocalizedStringSchema,
	}),
});

export type CloserContent = z.infer<typeof CloserContentSchema>;
