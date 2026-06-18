// Nav schemas - runtime mirror of navigation types: NavLink, MenuItem,
// ErrorPageContent. Each schema matches its TS interface shape-for-shape;
// per spec D3 no new constraints beyond
// what TS already encodes.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { NavLink, MenuItem, ErrorPageContent } from '$lib/navigation/types';

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
 * MenuItem is now a type alias of NavLink - MenuItemSchema equals NavLinkSchema.
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

// Drift detectors - NavLink ↔ NavLinkSchema structural parity check.
// MenuItem is a type alias of NavLink so MenuItemSchema = NavLinkSchema by definition.
type _NavLinkCheck = z.infer<typeof NavLinkSchema> extends NavLink
	? NavLink extends z.infer<typeof NavLinkSchema>
		? true
		: false
	: false;
const _navLinkCheck: _NavLinkCheck = true;
void _navLinkCheck;

// MenuItem = NavLink (alias) - parity check via NavLink.
type _MenuItemCheck = MenuItem extends NavLink ? (NavLink extends MenuItem ? true : false) : false;
const _menuItemCheck: _MenuItemCheck = true;
void _menuItemCheck;

type _ErrorPageContentCheck = z.infer<typeof ErrorPageContentSchema> extends ErrorPageContent
	? ErrorPageContent extends z.infer<typeof ErrorPageContentSchema>
		? true
		: false
	: false;
const _errorPageContentCheck: _ErrorPageContentCheck = true;
void _errorPageContentCheck;
