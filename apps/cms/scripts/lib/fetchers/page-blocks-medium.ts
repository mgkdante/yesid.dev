/**
 * Medium-complexity page-block fetchers — tech-stack-page + contact-page.
 *
 * - tech-stack-page (block_tech_stack_page_content): all fields are JSON columns
 *   with nested LocalizedString leaves → toLocalizedJSON for everything.
 * - contact-page (block_contact_content): mixed plain/LocalizedString in nested
 *   terminals + per-field placeholder LS; web3formsKey is a parent-row scalar.
 *
 * Mirrors transformBlockTechStackPageContent + transformBlockContactContent in
 * apps/web/src/lib/adapters/directus.ts.
 */

import { readItems } from '@directus/sdk';
import { toLocalizedString, toLocalizedJSON } from '../locale';
import {
	TechStackPageContentSchema,
	ContactContentSchema,
	type LocalizedString,
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

export function toTechStackPageContent(raw: BlockRow): TechStackPageContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;
	return {
		meta: toLocalizedJSON(tr, 'meta') as TechStackPageContent['meta'],
		hero: toLocalizedJSON(tr, 'hero') as TechStackPageContent['hero'],
		actions: toLocalizedJSON(tr, 'actions') as TechStackPageContent['actions'],
		cta: toLocalizedJSON(tr, 'cta') as TechStackPageContent['cta'],
	};
}

export async function fetchTechStackPageContent({
	client,
}: FetcherContext): Promise<TechStackPageContent> {
	const rows = (await client.request(
		readItems('block_tech_stack_page_content', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];

	if (rows.length === 0) {
		throw new Error('[fetchTechStackPageContent] no block_tech_stack_page_content row found');
	}

	return TechStackPageContentSchema.parse(toTechStackPageContent(rows[0]));
}

// ---------------------------------------------------------------------------
// contact-page
// ---------------------------------------------------------------------------

export function toContactContent(raw: BlockRow): ContactContent {
	const tr = (raw.translations ?? []) as ReadonlyArray<Record<string, unknown>>;

	// --- infoTerminal: title/command plain; location/responseTime/sectionLabels LS ---
	const infoByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const it = row.info_terminal;
		if (it && typeof it === 'object' && !Array.isArray(it)) {
			infoByLocale.set(code, it as Record<string, unknown>);
		}
	}
	const enInfo = infoByLocale.get('en') ?? {};
	const locationLS: LocalizedString = {
		en: typeof enInfo.location === 'string' ? enInfo.location : '',
	};
	const responseTimeLS: LocalizedString = {
		en: typeof enInfo.responseTime === 'string' ? enInfo.responseTime : '',
	};
	const sectionLabelLocationLS: LocalizedString = { en: '' };
	const sectionLabelConnectLS: LocalizedString = { en: '' };
	const enSectionLabels =
		enInfo.sectionLabels && typeof enInfo.sectionLabels === 'object' && !Array.isArray(enInfo.sectionLabels)
			? (enInfo.sectionLabels as Record<string, unknown>)
			: {};
	sectionLabelLocationLS.en =
		typeof enSectionLabels.location === 'string' ? enSectionLabels.location : '';
	sectionLabelConnectLS.en =
		typeof enSectionLabels.connect === 'string' ? enSectionLabels.connect : '';
	for (const [locale, it] of infoByLocale) {
		if (locale === 'en') continue;
		if (typeof it.location === 'string' && it.location.length > 0) {
			if (locale === 'fr') locationLS.fr = it.location;
			else if (locale === 'es') locationLS.es = it.location;
		}
		if (typeof it.responseTime === 'string' && it.responseTime.length > 0) {
			if (locale === 'fr') responseTimeLS.fr = it.responseTime;
			else if (locale === 'es') responseTimeLS.es = it.responseTime;
		}
		const sl =
			it.sectionLabels && typeof it.sectionLabels === 'object' && !Array.isArray(it.sectionLabels)
				? (it.sectionLabels as Record<string, unknown>)
				: {};
		if (typeof sl.location === 'string' && sl.location.length > 0) {
			if (locale === 'fr') sectionLabelLocationLS.fr = sl.location;
			else if (locale === 'es') sectionLabelLocationLS.es = sl.location;
		}
		if (typeof sl.connect === 'string' && sl.connect.length > 0) {
			if (locale === 'fr') sectionLabelConnectLS.fr = sl.connect;
			else if (locale === 'es') sectionLabelConnectLS.es = sl.connect;
		}
	}
	const infoTerminal: ContactContent['infoTerminal'] = {
		title: typeof enInfo.title === 'string' ? enInfo.title : '',
		command: typeof enInfo.command === 'string' ? enInfo.command : '',
		location: locationLS,
		responseTime: responseTimeLS,
		sectionLabels: {
			location: sectionLabelLocationLS,
			connect: sectionLabelConnectLS,
		},
	};

	// --- formTerminal: nested with mixed plain/LS ---
	const formByLocale = new Map<string, Record<string, unknown>>();
	for (const row of tr) {
		const code = row.languages_code as string;
		const ft = row.form_terminal;
		if (ft && typeof ft === 'object' && !Array.isArray(ft)) {
			formByLocale.set(code, ft as Record<string, unknown>);
		}
	}
	const enForm = formByLocale.get('en') ?? {};
	const commandOutputLS: LocalizedString = {
		en: typeof enForm.commandOutput === 'string' ? enForm.commandOutput : '',
	};
	const submitLabelLS: LocalizedString = {
		en: typeof enForm.submitLabel === 'string' ? enForm.submitLabel : '',
	};
	for (const [locale, ft] of formByLocale) {
		if (locale === 'en') continue;
		if (typeof ft.commandOutput === 'string' && ft.commandOutput.length > 0) {
			if (locale === 'fr') commandOutputLS.fr = ft.commandOutput;
			else if (locale === 'es') commandOutputLS.es = ft.commandOutput;
		}
		if (typeof ft.submitLabel === 'string' && ft.submitLabel.length > 0) {
			if (locale === 'fr') submitLabelLS.fr = ft.submitLabel;
			else if (locale === 'es') submitLabelLS.es = ft.submitLabel;
		}
	}

	function buildTerminalField(fieldName: string): ContactContent['formTerminal']['fields']['name'] {
		const enFields =
			enForm.fields && typeof enForm.fields === 'object' && !Array.isArray(enForm.fields)
				? (enForm.fields as Record<string, unknown>)
				: {};
		const enField =
			enFields[fieldName] && typeof enFields[fieldName] === 'object'
				? (enFields[fieldName] as Record<string, unknown>)
				: {};
		const label = typeof enField.label === 'string' ? enField.label : '';
		const placeholderLS: LocalizedString = {
			en: typeof enField.placeholder === 'string' ? enField.placeholder : '',
		};
		for (const [locale, ft] of formByLocale) {
			if (locale === 'en') continue;
			const ftFields =
				ft.fields && typeof ft.fields === 'object' && !Array.isArray(ft.fields)
					? (ft.fields as Record<string, unknown>)
					: {};
			const ftField =
				ftFields[fieldName] && typeof ftFields[fieldName] === 'object'
					? (ftFields[fieldName] as Record<string, unknown>)
					: {};
			if (typeof ftField.placeholder === 'string' && ftField.placeholder.length > 0) {
				if (locale === 'fr') placeholderLS.fr = ftField.placeholder;
				else if (locale === 'es') placeholderLS.es = ftField.placeholder;
			}
		}
		return { label, placeholder: placeholderLS };
	}

	const formTerminal: ContactContent['formTerminal'] = {
		title: typeof enForm.title === 'string' ? enForm.title : '',
		command: typeof enForm.command === 'string' ? enForm.command : '',
		commandOutput: commandOutputLS,
		fields: {
			name: buildTerminalField('name'),
			email: buildTerminalField('email'),
			message: buildTerminalField('message'),
		},
		submitLabel: submitLabelLS,
	};

	const validation = toLocalizedJSON(tr, 'validation') as ContactContent['validation'];
	const success = toLocalizedJSON(tr, 'success') as ContactContent['success'];

	const enRow = tr.find((r) => r.languages_code === 'en') ?? tr[0];
	const rawSocials =
		enRow && Array.isArray(enRow.socials)
			? (enRow.socials as Array<Record<string, unknown>>)
			: [];
	const socials: ContactContent['socials'] = rawSocials.map((s) => ({
		label: typeof s.label === 'string' ? s.label : '',
		href: typeof s.href === 'string' ? s.href : '',
		icon: typeof s.icon === 'string' ? s.icon : '',
	}));

	const meta = toLocalizedJSON(tr, 'meta') as ContactContent['meta'];

	return {
		pageTitle: toLocalizedString(tr, 'page_title'),
		stationLabel: toLocalizedString(tr, 'station_label'),
		sendErrorMessage: toLocalizedString(tr, 'send_error_message'),
		meta,
		infoTerminal,
		formTerminal,
		validation,
		success,
		socials,
		web3formsKey: typeof raw.web3forms_key === 'string' ? raw.web3forms_key : '',
	};
}

export async function fetchContactContent({ client }: FetcherContext): Promise<ContactContent> {
	const rows = (await client.request(
		readItems('block_contact_content', {
			fields: ['*', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlockRow[];

	if (rows.length === 0) {
		throw new Error('[fetchContactContent] no block_contact_content row found');
	}

	return ContactContentSchema.parse(toContactContent(rows[0]));
}
