/**
 * Nav schemas mirroring `apps/web/src/lib/schemas/nav.ts`.
 * NavLink + MenuItem (alias) + ErrorPageContent.
 */

import { z } from 'zod';
import { LocalizedStringSchema } from '@repo/shared';

export const NavLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	priority: z.union([z.literal(1), z.literal(2)]),
	subtitle: LocalizedStringSchema.optional(),
	icon: z.string().optional(),
});

/** MenuItem is structurally identical to NavLink — same schema. */
export const MenuItemSchema = NavLinkSchema;

export const ErrorPageContentSchema = z.object({
	label: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	description: LocalizedStringSchema,
	terminalLine: z.string(),
	suggestions: z
		.array(
			z.object({
				label: LocalizedStringSchema,
				href: z.string(),
			}),
		)
		.readonly(),
});

export type NavLink = z.infer<typeof NavLinkSchema>;
export type MenuItem = NavLink;
export type ErrorPageContent = z.infer<typeof ErrorPageContentSchema>;
