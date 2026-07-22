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

import { readItems } from '@directus/sdk';
import { str, toLocalizedFields, toLocalizedString } from '../locale';
import { fetchBlockSingleton, type BlockRow } from './singleton';
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

interface ContactChannelRow {
	id: string;
	status?: string;
	sort?: number | null;
	href?: unknown;
	icon?: unknown;
	translations?: ReadonlyArray<Record<string, unknown> & { languages_code: string }>;
}

function localizedWithFallback(
	rows: ReadonlyArray<Record<string, unknown> & { languages_code: string }>,
	field: string,
	fallback: unknown,
) {
	const localized = toLocalizedString(rows, field);
	if (localized.en.trim()) return localized;
	const fallbackText = str(fallback).trim();
	return fallbackText ? { ...localized, en: fallbackText } : localized;
}

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
		meta: toLocalizedFields(tr, [
			['title', 'meta_title'], ['description', 'meta_description'],
		]),
		hero: {
			...toLocalizedFields(tr, [
				['overline', 'hero_overline'], ['titleLine1', 'hero_title_line1'],
				['titleLine2', 'hero_title_line2'], ['terminalAria', 'hero_terminal_aria'],
				['stackKicker', 'stack_kicker'],
				['engineLoading', 'engine_loading'],
			]),
			// Operator addendum: terminal line templates — literal {count} token
			// interpolated by the component from data.items.length.
			terminal: toLocalizedFields(tr, [
				['cmd', 'terminal_cmd'], ['loading', 'terminal_loading'],
				['success', 'terminal_success'], ['cataloged', 'terminal_cataloged'],
				['status', 'terminal_status'],
			]),
			stats: toLocalizedFields(tr, [['technologies', 'hero_stat_technologies']]),
			...(explainer.en.trim() ? { stackExplainer: explainer } : {}),
		},
		actions: toLocalizedFields(tr, [
			['getInTouch', 'action_get_in_touch'], ['viewServices', 'action_view_services'],
		]),
		cta: toLocalizedFields(tr, [
			['headingLine1', 'cta_heading_line1'], ['headingLine2', 'cta_heading_line2'],
			['sub', 'cta_sub'],
		]),
	};
}

export async function fetchTechStackPageContent({
	client,
}: FetcherContext): Promise<TechStackPageContent> {
	const row = await fetchBlockSingleton<BlockRow>(
		client,
		'block_tech_stack_page_content',
		'fetchTechStackPageContent/block_tech_stack_page_content',
	);
	return TechStackPageContentSchema.parse(toTechStackPageContent(row));
}

// ---------------------------------------------------------------------------
// contact-page
// ---------------------------------------------------------------------------

function isPrivatePhoneChannel(href: string): boolean {
	const value = href.trim();
	if (/^(?:tel|sms|whatsapp):/i.test(value)) return true;

	try {
		const hostname = new URL(value).hostname.toLowerCase().replace(/\.+$/, '');
		return (
			hostname === 'wa.me' ||
			hostname === 'whatsapp.com' ||
			hostname.endsWith('.whatsapp.com')
		);
	} catch {
		return false;
	}
}

export function toContactChannels(rows: readonly ContactChannelRow[]): ContactContent['socials'] {
	return [...rows]
		.filter(
			(row) =>
				(row.status === undefined || row.status === 'published') &&
				!isPrivatePhoneChannel(str(row.href)),
		)
		.sort((a, b) => (a.sort ?? Number.MAX_SAFE_INTEGER) - (b.sort ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id))
		.map((row) => ({
			...toLocalizedFields(row.translations ?? [], ['label']),
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
	// BEST FIT section (homework #26b) follows the stack_explainer rule: the
	// columns are optional in the schema so pre-seed builds parse — include the
	// keys only when real content exists.
	const bestFitLabel = toLocalizedString(tr, 'info_section_label_best_fit');
	const bestFit = (['info_best_fit_1', 'info_best_fit_2', 'info_best_fit_3'] as const)
		.map((field) => toLocalizedString(tr, field))
		.filter((line) => line.en.trim());
	return {
		...toLocalizedFields(tr, [
			['pageTitle', 'page_title'], ['stationLabel', 'station_label'],
			['sendErrorMessage', 'send_error_message'],
		]),
		meta: toLocalizedFields(tr, [
			['title', 'meta_title'], ['description', 'meta_description'],
		]),
		infoTerminal: {
			title: str(raw.info_terminal_title),
			command: str(raw.info_terminal_command),
			...toLocalizedFields(tr, [
				['location', 'info_location'], ['responseTime', 'info_response_time'],
				['languages', 'info_languages'],
			]),
			...(bestFit.length ? { bestFit } : {}),
			sectionLabels: {
				...toLocalizedFields(tr, [
					['location', 'info_section_label_location'], ['connect', 'info_section_label_connect'],
					['languages', 'info_section_label_languages'],
				]),
				...(bestFitLabel.en.trim() ? { bestFit: bestFitLabel } : {}),
			},
		},
		formTerminal: {
			title: str(raw.form_terminal_title),
			command: str(raw.form_terminal_command),
			...toLocalizedFields(tr, [['commandOutput', 'form_command_output']]),
			fields: {
				name: {
					label: localizedWithFallback(tr, 'form_field_name_label', raw.form_field_name_label),
					...toLocalizedFields(tr, [['placeholder', 'form_field_name_placeholder']]),
				},
				email: {
					label: localizedWithFallback(tr, 'form_field_email_label', raw.form_field_email_label),
					...toLocalizedFields(tr, [['placeholder', 'form_field_email_placeholder']]),
				},
				message: {
					label: localizedWithFallback(tr, 'form_field_message_label', raw.form_field_message_label),
					...toLocalizedFields(tr, [['placeholder', 'form_field_message_placeholder']]),
				},
			},
			...toLocalizedFields(tr, [
				['submitLabel', 'form_submit_label'], ['bookingPrompt', 'booking_prompt'],
				['bookingButtonLabel', 'booking_button_label'],
			]),
		},
		validation: toLocalizedFields(tr, [
			['required', 'validation_required'], ['invalidEmail', 'validation_invalid_email'],
			['errorSummary', 'validation_error_summary'],
		]),
		success: toLocalizedFields(tr, [
			['validating', 'success_validating'], ['sending', 'success_sending'],
			['sent', 'success_sent'], ['responseTime', 'success_response_time'],
			['meanwhile', 'success_meanwhile'], ['resetLabel', 'success_reset_label'],
			['fieldOk', 'success_field_ok'],
			['workLinkLabel', 'success_work_link_label'],
			['blogLinkLabel', 'success_blog_link_label'],
		]),
		socials,
		web3formsKey: str(raw.web3forms_key),
	};
}

export async function fetchContactContent({ client }: FetcherContext): Promise<ContactContent> {
	const [row, contactChannelRows] = await Promise.all([
		fetchBlockSingleton<BlockRow>(
			client,
			'block_contact_content',
			'fetchContactContent/block_contact_content',
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
	return ContactContentSchema.parse(toContactContent(row, toContactChannels(contactChannelRows as ContactChannelRow[])));
}
