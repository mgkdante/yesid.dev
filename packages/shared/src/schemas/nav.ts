// Nav schemas — single runtime mirrors of NavLink, MenuItem and
// ErrorPageContent in ../types/content (the interfaces moved there from
// apps/web alongside this consolidation, site-hardening-a-plus). Per spec D3
// no new constraints beyond what TS already encodes.

import { z } from 'zod';
import { LocalizedStringSchema, type AssertSchemaMatches } from './shared';
import type { NavLink, MenuItem, ErrorPageContent } from '../types/content';

// `priority: 1 | 2` - TS numeric literal union preserved via z.union.
// subtitle and icon are optional - present on menu/footer placement rows.
export const NavLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	priority: z.union([z.literal(1), z.literal(2)]),
	subtitle: LocalizedStringSchema.optional(),
	icon: z.string().optional(),
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

// Drift detectors — compile error (`true satisfies never`) on schema/type drift.
// MenuItem is a type alias of NavLink, so its parity is asserted type-to-type.
true satisfies AssertSchemaMatches<z.infer<typeof NavLinkSchema>, NavLink>;
true satisfies AssertSchemaMatches<MenuItem, NavLink>;
true satisfies AssertSchemaMatches<z.infer<typeof ErrorPageContentSchema>, ErrorPageContent>;
