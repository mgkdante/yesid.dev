import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

const BoardRowSchema = z.object({
	label: LocalizedStringSchema,
	description: LocalizedStringSchema,
	action: LocalizedStringSchema,
});
const LinkedBoardRowSchema = BoardRowSchema.extend({ href: z.string() });

export const CloserContentSchema = z.object({
	cta: z.object({
		label: LocalizedStringSchema,
		href: z.string(),
	}),
	rows: z.object({
		contact: LinkedBoardRowSchema,
		/** Links to the GitHub profile in site meta. */
		connect: BoardRowSchema,
		read: LinkedBoardRowSchema,
		about: LinkedBoardRowSchema,
	}),
	/** Handwritten ending drawn under the board. */
	closingLabel: LocalizedStringSchema,
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
