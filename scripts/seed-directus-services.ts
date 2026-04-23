#!/usr/bin/env bun
/**
 * Seed Directus `services` + `services_translations` + `services_deliverables`
 * + `services_deliverables_translations` + `services_sections` +
 * `services_sections_translations` from yesid.dev's canonical
 * `src/lib/content/services.ts` TypeScript module.
 *
 * Slice 18 Task 6.
 *
 * Strategy:
 *   1. Auth to Directus via email+password → short-lived access_token.
 *   2. Delete all existing services (FK CASCADE removes translations +
 *      deliverables + sections transitively, so nothing is orphaned).
 *   3. Create each service fresh with nested `translations`, `deliverables`,
 *      and `sections` in one atomic SDK call per service.
 *   4. Verify by reading back + printing a row-count summary.
 *
 * Idempotency: nuke-and-recreate. Safe to re-run. Destructive only on the
 * `services` domain tree — leaves `languages` + other collections untouched.
 *
 * Source of truth: `src/lib/content/services.ts`. Per memory
 * `project_services_sot_directus.md`, after Task 7 flips the adapter seam,
 * Directus becomes canonical and this script becomes "re-seed from frozen
 * source" — not a forward edit path.
 *
 * Usage:
 *   op run --env-file=.env -- bun scripts/seed-directus-services.ts
 *
 * Required env (via 1Password):
 *   DIRECTUS_ADMIN_EMAIL
 *   DIRECTUS_ADMIN_PASSWORD
 *   PUBLIC_DIRECTUS_URL  (optional; defaults to https://cms.yesid.dev)
 */

import {
	createDirectus,
	rest,
	staticToken,
	createItem,
	deleteItem,
	readItems,
} from '@directus/sdk';
import { services } from '../src/lib/content/services';
import type { Service, LocalizedString, Locale } from '../src/lib/types';

const DIRECTUS_URL = process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
const SUPPORTED_LOCALES = ['en', 'fr', 'es'] as const satisfies readonly Locale[];

type DirectusServiceTranslationRow = {
	languages_code: Locale;
	title: string;
	subtitle: string | null;
	description: string;
	long_description: string | null;
	value_proposition: string | null;
	benefit_headline: string | null;
	impact_metric_value: string | null;
	impact_metric_label: string | null;
};

type DirectusDeliverableRow = {
	sort: number;
	translations: Array<{ languages_code: Locale; label: string }>;
};

type DirectusSectionRow = {
	sort: number;
	translations: Array<{ languages_code: Locale; title: string; content: string }>;
};

type DirectusServiceRow = {
	id: string;
	station: number;
	icon?: string;
	svg?: string;
	lottie_reverse: boolean;
	visible: boolean;
	related_projects: readonly string[];
	stack?: readonly string[];
	translations: DirectusServiceTranslationRow[];
	deliverables: DirectusDeliverableRow[];
	sections: DirectusSectionRow[];
};

type Schema = { services: DirectusServiceRow[] };

/** Return the locales present on a LocalizedString (keys with non-empty values). */
function localesIn(s: LocalizedString | undefined): Locale[] {
	if (!s) return [];
	return SUPPORTED_LOCALES.filter((l) => {
		const v = s[l];
		return typeof v === 'string' && v.length > 0;
	});
}

/** Union of all locales referenced across a service's many LocalizedStrings. */
function collectServiceLocales(service: Service): Locale[] {
	const strings: Array<LocalizedString | undefined> = [
		service.title,
		service.description,
		service.subtitle,
		service.longDescription,
		service.valueProposition,
		service.benefitHeadline,
		service.impactMetric?.value,
		service.impactMetric?.label,
		...(service.deliverables ?? []),
		...(service.sections ?? []).flatMap((s) => [s.title, s.content]),
	];
	const present = new Set<Locale>();
	for (const s of strings) {
		for (const l of localesIn(s)) present.add(l);
	}
	return SUPPORTED_LOCALES.filter((l) => present.has(l));
}

function toTranslationRows(service: Service): DirectusServiceTranslationRow[] {
	return collectServiceLocales(service).map((locale) => ({
		languages_code: locale,
		title: service.title[locale] ?? '',
		subtitle: service.subtitle?.[locale] ?? null,
		description: service.description[locale] ?? '',
		long_description: service.longDescription?.[locale] ?? null,
		value_proposition: service.valueProposition?.[locale] ?? null,
		benefit_headline: service.benefitHeadline?.[locale] ?? null,
		impact_metric_value: service.impactMetric?.value?.[locale] ?? null,
		impact_metric_label: service.impactMetric?.label?.[locale] ?? null,
	}));
}

function toDeliverableRows(service: Service): DirectusDeliverableRow[] {
	return (service.deliverables ?? []).map((d, i) => ({
		sort: i,
		translations: localesIn(d).map((locale) => ({
			languages_code: locale,
			label: d[locale] ?? '',
		})),
	}));
}

function toSectionRows(service: Service): DirectusSectionRow[] {
	return (service.sections ?? []).map((s, i) => {
		const locales = new Set<Locale>();
		for (const l of localesIn(s.title)) locales.add(l);
		for (const l of localesIn(s.content)) locales.add(l);
		return {
			sort: i,
			translations: SUPPORTED_LOCALES.filter((l) => locales.has(l)).map((locale) => ({
				languages_code: locale,
				title: s.title[locale] ?? '',
				content: s.content[locale] ?? '',
			})),
		};
	});
}

function toServiceRow(service: Service): DirectusServiceRow {
	const row: DirectusServiceRow = {
		id: service.id,
		station: service.station,
		lottie_reverse: service.lottieReverse ?? false,
		visible: service.visible ?? true,
		related_projects: service.relatedProjects,
		translations: toTranslationRows(service),
		deliverables: toDeliverableRows(service),
		sections: toSectionRows(service),
	};
	if (service.icon) row.icon = service.icon;
	if (service.svg) row.svg = service.svg;
	if (service.stack && service.stack.length > 0) row.stack = service.stack;
	return row;
}

async function getAdminToken(): Promise<string> {
	// Token short-circuit: use a pre-existing admin access_token if provided.
	// Useful in CI or when 1P CLI isn't available; skips the /auth/login
	// round-trip and avoids burning a credential read per run.
	if (process.env.DIRECTUS_ADMIN_TOKEN) {
		return process.env.DIRECTUS_ADMIN_TOKEN;
	}
	const email = process.env.DIRECTUS_ADMIN_EMAIL;
	const password = process.env.DIRECTUS_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error(
			'Need DIRECTUS_ADMIN_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD. ' +
				'Typical run: op run --env-file=.env -- bun scripts/seed-directus-services.ts',
		);
	}
	const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		throw new Error(`[auth] ${res.status} ${res.statusText} — check admin creds + ${DIRECTUS_URL} reachability`);
	}
	const body = (await res.json()) as { data: { access_token: string } };
	return body.data.access_token;
}

async function main() {
	console.log(`[seed] target: ${DIRECTUS_URL}`);
	console.log(`[seed] source: ${services.length} services from src/lib/content/services.ts`);

	const token = await getAdminToken();
	const client = createDirectus<Schema>(DIRECTUS_URL).with(staticToken(token)).with(rest());

	// Clear existing services (CASCADE removes translations + deliverables + sections).
	const existing = await client.request(
		readItems('services', { fields: ['id'], limit: -1 }),
	);
	if (existing.length > 0) {
		console.log(`[seed] clearing ${existing.length} existing services...`);
		for (const s of existing) {
			await client.request(deleteItem('services', s.id));
		}
	}

	// Create fresh with atomic nested creation per service.
	console.log(`[seed] creating ${services.length} services...`);
	for (const service of services) {
		const row = toServiceRow(service);
		await client.request(createItem('services', row));
		console.log(
			`  ✓ ${service.id.padEnd(24)}  station=${service.station}  ` +
				`locales=${row.translations.length}  ` +
				`deliverables=${row.deliverables.length}  ` +
				`sections=${row.sections.length}`,
		);
	}

	// Verify by reading back.
	const final = await client.request(
		readItems('services', {
			fields: [
				'id',
				'station',
				{ translations: ['languages_code'] },
				{ deliverables: ['id'] },
				{ sections: ['id'] },
			],
			limit: -1,
			sort: ['station'],
		}),
	);
	console.log(`\n[seed] verified: ${final.length} services in Directus`);
	for (const s of final) {
		const translations = Array.isArray(s.translations) ? s.translations : [];
		const deliverables = Array.isArray(s.deliverables) ? s.deliverables : [];
		const sections = Array.isArray(s.sections) ? s.sections : [];
		console.log(
			`  ${s.id.padEnd(24)}  station=${s.station}  ` +
				`locales=${translations.length}  ` +
				`deliverables=${deliverables.length}  ` +
				`sections=${sections.length}`,
		);
	}

	if (final.length !== services.length) {
		throw new Error(
			`[seed] count mismatch: expected ${services.length}, got ${final.length}`,
		);
	}
	console.log('\n[seed] done.');
}

main().catch((err) => {
	console.error('[seed] FAILED:', err);
	process.exit(1);
});
