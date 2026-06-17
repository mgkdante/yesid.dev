/**
 * Medium-complexity page-block fetchers — tech-stack-page + contact-page.
 *
 * go2-t1b2: both transforms read FLAT columns (terminal chrome scalars on the
 * parent row; per-locale strings on translations) and recompose the exact
 * module shapes the legacy JSON columns produced. The hero terminal templates
 * (operator addendum) recompose under hero.terminal with a literal {count}
 * token interpolated by the /tech-stack component.
 *
 * Mirrors transformBlockTechStackPageContent + transformBlockContactContent in
 * apps/web/src/lib/adapters/directus.ts.
 */

import { readItems, readSingleton } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import { asSingletonRow } from './singleton';
import {
	TechStackPageContentSchema,
	ContactContentSchema,
	type TechStackPageContent,
	type ContactContent,
} from '@repo/shared';
import type { FetcherContext } from './types';

// ---------------------------------------------------------------------------
// tech-stack-page
// ---------------------------------------------------------------------------

interface BlockRow {
	id: number;
	translations?: ReadonlyArray<Record<string, unknown>>;
	[key: string]: unknown;
}

interface ContactChannelRow {
	id: string;
	status?: string;
	sort?: number | null;
	href?: unknown;
	icon?: unknown;
	translations?: ReadonlyArray<Record<string, unknown> & { languages_code: string }>;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

export function toTechStackPageContent(raw: BlockRow): TechStackPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	// go2/w5: stack_explainer is optional in the schema (pre-seed builds parse
	// without it). toLocalizedString returns { en: '' } when the column is
	// empty and LocalizedStringSchema rejects whitespace-only en — so include
	// the key only when real content exists.
	const explainer = toLocalizedString(tr, 'stack_explainer');
	return {
		meta: {
			title: toLocalizedString(tr, 'meta_title'),
			description: toLocalizedString(tr, 'meta_description'),
		},
		hero: {
			overline: toLocalizedString(tr, 'hero_overline'),
			titleLine1: toLocalizedString(tr, 'hero_title_line1'),
			titleLine2: toLocalizedString(tr, 'hero_title_line2'),
			terminalAria: toLocalizedString(tr, 'hero_terminal_aria'),
			// Operator addendum: terminal line templates — literal {count} token
			// interpolated by the component from data.items.length.
			terminal: {
				cmd: toLocalizedString(tr, 'terminal_cmd'),
				loading: toLocalizedString(tr, 'terminal_loading'),
				success: toLocalizedString(tr, 'terminal_success'),
				cataloged: toLocalizedString(tr, 'terminal_cataloged'),
				status: toLocalizedString(tr, 'terminal_status'),
			},
			stats: { technologies: toLocalizedString(tr, 'hero_stat_technologies') },
			...(explainer.en.trim() ? { stackExplainer: explainer } : {}),
		},
		actions: {
			getInTouch: toLocalizedString(tr, 'action_get_in_touch'),
			viewServices: toLocalizedString(tr, 'action_view_services'),
		},
		cta: {
			headingLine1: toLocalizedString(tr, 'cta_heading_line1'),
			headingLine2: toLocalizedString(tr, 'cta_heading_line2'),
			sub: toLocalizedString(tr, 'cta_sub'),
		},
	};
}

export async function fetchTechStackPageContent({
	client,
}: FetcherContext): Promise<TechStackPageContent> {
	const result = await client.request(
		readSingleton('block_tech_stack_page_content', {
			fields: ['*', { translations: ['*'] } as unknown as string],
		}),
	);
	const row = asSingletonRow<BlockRow>(
		result,
		'fetchTechStackPageContent/block_tech_stack_page_content',
	);
	return TechStackPageContentSchema.parse(toTechStackPageContent(row));
}

// ---------------------------------------------------------------------------
// contact-page
// ---------------------------------------------------------------------------

export function toContactChannels(rows: readonly ContactChannelRow[]): ContactContent['socials'] {
	return [...rows]
		.filter((row) => row.status === undefined || row.status === 'published')
		.sort((a, b) => (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id))
		.map((row) => ({
			label: toLocalizedString(row.translations ?? [], 'label'),
			href: str(row.href),
			icon: str(row.icon),
		}));
}

export function toContactContent(
	raw: BlockRow,
	socials: ContactContent['socials'],
): ContactContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<
		Record<string, unknown> & { languages_code: string }
	>;
	return {
		pageTitle: toLocalizedString(tr, 'page_title'),
		stationLabel: toLocalizedString(tr, 'station_label'),
		sendErrorMessage: toLocalizedString(tr, 'send_error_message'),
		meta: {
			title: toLocalizedString(tr, 'meta_title'),
			description: toLocalizedString(tr, 'meta_description'),
		},
		infoTerminal: {
			title: str(raw.info_terminal_title),
			command: str(raw.info_terminal_command),
			location: toLocalizedString(tr, 'info_location'),
			responseTime: toLocalizedString(tr, 'info_response_time'),
			sectionLabels: {
				location: toLocalizedString(tr, 'info_section_label_location'),
				connect: toLocalizedString(tr, 'info_section_label_connect'),
			},
		},
		formTerminal: {
			title: str(raw.form_terminal_title),
			command: str(raw.form_terminal_command),
			commandOutput: toLocalizedString(tr, 'form_command_output'),
			fields: {
				name: { label: str(raw.form_field_name_label), placeholder: toLocalizedString(tr, 'form_field_name_placeholder') },
				email: { label: str(raw.form_field_email_label), placeholder: toLocalizedString(tr, 'form_field_email_placeholder') },
				message: { label: str(raw.form_field_message_label), placeholder: toLocalizedString(tr, 'form_field_message_placeholder') },
			},
			submitLabel: toLocalizedString(tr, 'form_submit_label'),
		},
		validation: {
			required: toLocalizedString(tr, 'validation_required'),
			invalidEmail: toLocalizedString(tr, 'validation_invalid_email'),
			errorSummary: toLocalizedString(tr, 'validation_error_summary'),
		},
		success: {
			validating: toLocalizedString(tr, 'success_validating'),
			sending: toLocalizedString(tr, 'success_sending'),
			sent: toLocalizedString(tr, 'success_sent'),
			responseTime: toLocalizedString(tr, 'success_response_time'),
			meanwhile: toLocalizedString(tr, 'success_meanwhile'),
			resetLabel: toLocalizedString(tr, 'success_reset_label'),
			fieldOk: toLocalizedString(tr, 'success_field_ok'),
		},
		socials,
		web3formsKey: str(raw.web3forms_key),
	};
}

export async function fetchContactContent({ client }: FetcherContext): Promise<ContactContent> {
	const [result, contactChannelRows] = await Promise.all([
		client.request(
			readSingleton('block_contact_content', {
				fields: ['*', { translations: ['*'] } as unknown as string],
			}),
		),
		client.request(
			readItems('contact_channels', {
				fields: ['id', 'status', 'sort', 'href', 'icon', { translations: ['languages_code', 'label'] } as unknown as string],
				filter: { status: { _eq: 'published' } },
				sort: ['sort', 'id'],
				limit: -1,
			}),
		),
	]);
	const row = asSingletonRow<BlockRow>(result, 'fetchContactContent/block_contact_content');
	return ContactContentSchema.parse(toContactContent(row, toContactChannels(contactChannelRows as ContactChannelRow[])));
}
