// CloserContentSchema — mirrors CloserContent from types/content.
// Home page — Closer (TERMINUS / end-of-line block).

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { CloserContent } from '../types/content';

export const CloserContentSchema = z.object({
	heading: LocalizedStringSchema,
	headingDot: LocalizedStringSchema,
	subheading: LocalizedStringSchema,
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
		// `read` has no `description` field in the TS interface
		read: z.object({
			label: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
		about: z.object({
			label: LocalizedStringSchema,
			description: LocalizedStringSchema,
			action: LocalizedStringSchema,
		}),
	}),
	attribution: z.object({
		text: LocalizedStringSchema,
		url: z.string(),
	}),
	terminal: z.object({
		title: LocalizedStringSchema,
		city: LocalizedStringSchema,
		encoding: LocalizedStringSchema,
		destinationsLabel: LocalizedStringSchema,
		prompt: LocalizedStringSchema,
	}),
}) satisfies z.ZodType<CloserContent>;
