import type { LocalizedString } from '$lib/types';

export interface NavLink {
	label: LocalizedString;
	href: string;
	priority: 1 | 2;
	subtitle?: LocalizedString;
	icon?: string;
}

export type MenuItem = NavLink;

export interface ErrorPageContent {
	label: LocalizedString;
	heading: LocalizedString;
	description: LocalizedString;
	terminalLine: string;
	suggestions: readonly { label: LocalizedString; href: string }[];
}
