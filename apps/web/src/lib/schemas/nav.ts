// Nav schemas — runtime mirror of nav.ts content types: NavLink, MenuItem,
// MetroBookends, ErrorPageContent. Each schema matches its TS interface in
// $lib/content/nav shape-for-shape; per spec D3 no new constraints beyond
// what TS already encodes.

import { z } from 'zod';
import { LocalizedStringSchema } from './shared';
import type { NavLink, MenuItem, MetroBookends, ErrorPageContent } from '$lib/content/nav';

// `priority: 1 | 2` — TS numeric literal union preserved via z.union.
export const NavLinkSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	priority: z.union([z.literal(1), z.literal(2)]),
});

export const MenuItemSchema = z.object({
	label: LocalizedStringSchema,
	href: z.string(),
	subtitle: LocalizedStringSchema,
});

export const MetroBookendsSchema = z.object({
	departure: LocalizedStringSchema,
	featured: LocalizedStringSchema,
	about: LocalizedStringSchema,
	blog: LocalizedStringSchema,
	terminal: LocalizedStringSchema,
});

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

// Drift detectors.
type _NavLinkCheck = z.infer<typeof NavLinkSchema> extends NavLink
	? NavLink extends z.infer<typeof NavLinkSchema>
		? true
		: false
	: false;
const _navLinkCheck: _NavLinkCheck = true;
void _navLinkCheck;

type _MenuItemCheck = z.infer<typeof MenuItemSchema> extends MenuItem
	? MenuItem extends z.infer<typeof MenuItemSchema>
		? true
		: false
	: false;
const _menuItemCheck: _MenuItemCheck = true;
void _menuItemCheck;

type _MetroBookendsCheck = z.infer<typeof MetroBookendsSchema> extends MetroBookends
	? MetroBookends extends z.infer<typeof MetroBookendsSchema>
		? true
		: false
	: false;
const _metroBookendsCheck: _MetroBookendsCheck = true;
void _metroBookendsCheck;

type _ErrorPageContentCheck = z.infer<typeof ErrorPageContentSchema> extends ErrorPageContent
	? ErrorPageContent extends z.infer<typeof ErrorPageContentSchema>
		? true
		: false
	: false;
const _errorPageContentCheck: _ErrorPageContentCheck = true;
void _errorPageContentCheck;
