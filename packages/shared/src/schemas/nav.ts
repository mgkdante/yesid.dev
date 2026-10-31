import { z } from 'zod';
import { LocalizedStringSchema } from './shared';

// `priority: 1 | 2` - TS numeric literal union preserved via z.union.
// subtitle is optional - present on menu/footer placement rows.
export const NavLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	priority: z.union([z.literal(1), z.literal(2)]),
	subtitle: LocalizedStringSchema.optional(),
});

/**
 * MenuItem is a type alias of NavLink - MenuItemSchema equals NavLinkSchema.
 * Preserved as a named export for backwards compatibility with existing callers.
 */
export const MenuItemSchema = NavLinkSchema;

export const ErrorPageContentSchema = z.object({
	label: LocalizedStringSchema,
	heading: LocalizedStringSchema,
	description: LocalizedStringSchema,
	/** Browser tab title body; the site name is appended. */
	browserTitle: LocalizedStringSchema.optional(),
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
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type ErrorPageContent = z.infer<typeof ErrorPageContentSchema>;
