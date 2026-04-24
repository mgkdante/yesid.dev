#!/usr/bin/env bun
/**
 * Seed the Directus `services` domain tree from `fixtures/collections/services.json`.
 *
 * Slice 18 Task 8 migrated this script from the consumer repo (yesid.dev) to
 * yesid.dev-cms per D12 — seed scripts live where the CMS schema lives. The
 * fixture JSON is an export of yesid.dev's `src/lib/content/services.ts`
 * module, frozen as data in this repo so the CMS side has no cross-repo git
 * coupling. After Slice 18 closes, Directus Data Studio becomes the authoring
 * surface and the fixture + yesid.dev's TS module both freeze (Slice 19+
 * introduces a re-export step if we ever need to regenerate the fixture).
 *
 * Strategy:
 *   1. Zod-validate the fixture.
 *   2. Auth to Directus (static token or email/password).
 *   3. Nuke existing services (FK CASCADE clears translations, deliverables,
 *      sections). Idempotent — safe to re-run.
 *   4. Create each service with nested translations/deliverables/sections in
 *      one atomic SDK call.
 *   5. Read back + assert counts.
 *
 * Usage:
 *   bun run seed:services
 *
 * Required env:
 *   DIRECTUS_ADMIN_TOKEN  — preferred (skips /auth/login)
 *   OR
 *   DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD
 *   PUBLIC_DIRECTUS_URL   — optional, defaults to https://cms.yesid.dev
 *
 * Pure transformation helpers (`toServiceRow`, `toTranslationRows`, etc.) are
 * exported for `tests/seed-dry-run.test.ts` to unit-test without hitting the
 * network.
 */

import {
	createDirectus,
	rest,
	staticToken,
	createItem,
	deleteItem,
	readItems,
} from '@directus/sdk';
import { z } from 'zod';
import fixtureData from '../fixtures/collections/services.json' with { type: 'json' };

// --- Types (inlined; no cross-repo imports per D12) --------------------------

export type Locale = 'en' | 'fr' | 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export interface LocalizedString {
	en: string;
	fr?: string;
	es?: string;
}

export interface ImpactMetric {
	value: LocalizedString;
	label: LocalizedString;
}

export type Deliverable = LocalizedString;

export interface Section {
	title: LocalizedString;
	content: LocalizedString;
}

export interface Service {
	id: string;
	title: LocalizedString;
	description: LocalizedString;
	subtitle?: LocalizedString;
	longDescription?: LocalizedString;
	valueProposition?: LocalizedString;
	benefitHeadline?: LocalizedString;
	impactMetric?: ImpactMetric;
	station: number;
	icon?: string;
	svg?: string;
	lottieReverse?: boolean;
	visible?: boolean;
	relatedProjects: readonly string[];
	stack?: readonly string[];
	deliverables?: readonly Deliverable[];
	sections?: readonly Section[];
}

// --- Zod schemas (validate fixture JSON at load-time) ------------------------

const LocalizedStringSchema: z.ZodType<LocalizedString> = z.object({
	en: z.string().min(1),
	fr: z.string().min(1).optional(),
	es: z.string().min(1).optional(),
});

const ImpactMetricSchema: z.ZodType<ImpactMetric> = z.object({
	value: LocalizedStringSchema,
	label: LocalizedStringSchema,
});

const SectionSchema: z.ZodType<Section> = z.object({
	title: LocalizedStringSchema,
	content: LocalizedStringSchema,
});

export const ServiceSchema: z.ZodType<Service> = z.object({
	id: z.string().min(1),
	title: LocalizedStringSchema,
	description: LocalizedStringSchema,
	subtitle: LocalizedStringSchema.optional(),
	longDescription: LocalizedStringSchema.optional(),
	valueProposition: LocalizedStringSchema.optional(),
	benefitHeadline: LocalizedStringSchema.optional(),
	impactMetric: ImpactMetricSchema.optional(),
	station: z.number().int().positive(),
	icon: z.string().min(1).optional(),
	svg: z.string().min(1).optional(),
	lottieReverse: z.boolean().optional(),
	visible: z.boolean().optional(),
	relatedProjects: z.array(z.string().min(1)).readonly(),
	stack: z.array(z.string().min(1)).readonly().optional(),
	deliverables: z.array(LocalizedStringSchema).readonly().optional(),
	sections: z.array(SectionSchema).readonly().optional(),
});

export const ServicesFixtureSchema = z.array(ServiceSchema).min(1).readonly();

// --- Directus row shapes (flat — match the Directus M2O/O2M collection layout) ---

export interface DirectusServiceTranslationRow {
	languages_code: Locale;
	title: string;
	subtitle: string | null;
	description: string;
	long_description: string | null;
	value_proposition: string | null;
	benefit_headline: string | null;
	impact_metric_value: string | null;
	impact_metric_label: string | null;
}

export interface DirectusDeliverableRow {
	sort: number;
	translations: ReadonlyArray<{ languages_code: Locale; label: string }>;
}

export interface DirectusSectionRow {
	sort: number;
	translations: ReadonlyArray<{
		languages_code: Locale;
		title: string;
		content: string;
	}>;
}

export interface DirectusServiceRow {
	id: string;
	station: number;
	icon?: string;
	svg?: string;
	lottie_reverse: boolean;
	visible: boolean;
	related_projects: readonly string[];
	stack?: readonly string[];
	translations: readonly DirectusServiceTranslationRow[];
	deliverables: readonly DirectusDeliverableRow[];
	sections: readonly DirectusSectionRow[];
}

interface Schema {
	services: DirectusServiceRow[];
}

// --- Pure transformation helpers (tested in tests/seed-dry-run.test.ts) -----

/** Return the locales present on a LocalizedString (keys with non-empty values). */
export function localesIn(s: LocalizedString | undefined): readonly Locale[] {
	if (!s) return [];
	return SUPPORTED_LOCALES.filter((l) => {
		const v = s[l];
		return typeof v === 'string' && v.length > 0;
	});
}

/** Union of locales referenced across every LocalizedString in a service. */
export function collectServiceLocales(service: Service): readonly Locale[] {
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

export function toTranslationRows(
	service: Service,
): readonly DirectusServiceTranslationRow[] {
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

export function toDeliverableRows(
	service: Service,
): readonly DirectusDeliverableRow[] {
	return (service.deliverables ?? []).map((d, i) => ({
		sort: i,
		translations: localesIn(d).map((locale) => ({
			languages_code: locale,
			label: d[locale] ?? '',
		})),
	}));
}

export function toSectionRows(service: Service): readonly DirectusSectionRow[] {
	return (service.sections ?? []).map((s, i) => {
		const locales = new Set<Locale>();
		for (const l of localesIn(s.title)) locales.add(l);
		for (const l of localesIn(s.content)) locales.add(l);
		return {
			sort: i,
			translations: SUPPORTED_LOCALES.filter((l) => locales.has(l)).map(
				(locale) => ({
					languages_code: locale,
					title: s.title[locale] ?? '',
					content: s.content[locale] ?? '',
				}),
			),
		};
	});
}

export function toServiceRow(service: Service): DirectusServiceRow {
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

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadServicesFixture(): readonly Service[] {
	return ServicesFixtureSchema.parse(fixtureData);
}

// --- Directus I/O (only exercised by the CLI entrypoint) --------------------

interface SeedOptions {
	directusUrl: string;
	token: string;
}

async function getAdminToken(directusUrl: string): Promise<string> {
	if (process.env.DIRECTUS_ADMIN_TOKEN) {
		return process.env.DIRECTUS_ADMIN_TOKEN;
	}
	const email = process.env.DIRECTUS_ADMIN_EMAIL;
	const password = process.env.DIRECTUS_ADMIN_PASSWORD;
	if (!email || !password) {
		throw new Error(
			'Need DIRECTUS_ADMIN_TOKEN, or DIRECTUS_ADMIN_EMAIL + DIRECTUS_ADMIN_PASSWORD. ' +
				'Typical run: DIRECTUS_ADMIN_TOKEN=$(op read ...) bun run seed:services',
		);
	}
	const res = await fetch(`${directusUrl}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	});
	if (!res.ok) {
		throw new Error(
			`[auth] ${res.status} ${res.statusText} — check admin creds + ${directusUrl} reachability`,
		);
	}
	const body = (await res.json()) as { data: { access_token: string } };
	return body.data.access_token;
}

export async function seedServices(
	services: readonly Service[],
	opts: SeedOptions,
): Promise<void> {
	const client = createDirectus<Schema>(opts.directusUrl)
		.with(staticToken(opts.token))
		.with(rest());

	const existing = await client.request(
		readItems('services', { fields: ['id'], limit: -1 }),
	);
	if (existing.length > 0) {
		console.log(`[seed] clearing ${existing.length} existing services...`);
		for (const s of existing) {
			await client.request(deleteItem('services', s.id));
		}
	}

	console.log(`[seed] creating ${services.length} services...`);
	for (const service of services) {
		const row = toServiceRow(service);
		// SDK's createItem returns a read of the created row; shape mismatch
		// against our readonly input is the expected asymmetry — writes are
		// plain objects, the return is a read-shape hydration. Safe to cast.
		await client.request(
			createItem('services', row as unknown as DirectusServiceRow),
		);
		console.log(
			`  ✓ ${service.id.padEnd(24)}  station=${service.station}  ` +
				`locales=${row.translations.length}  ` +
				`deliverables=${row.deliverables.length}  ` +
				`sections=${row.sections.length}`,
		);
	}

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
	if (final.length !== services.length) {
		throw new Error(
			`[seed] count mismatch: expected ${services.length}, got ${final.length}`,
		);
	}
}

async function main(): Promise<void> {
	const directusUrl =
		process.env.PUBLIC_DIRECTUS_URL ?? 'https://cms.yesid.dev';
	console.log(`[seed] target: ${directusUrl}`);

	const services = loadServicesFixture();
	console.log(`[seed] source: ${services.length} services from fixtures/collections/services.json`);

	const token = await getAdminToken(directusUrl);
	await seedServices(services, { directusUrl, token });
	console.log('\n[seed] done.');
}

// Entry-point guard — tests can import transformation helpers without triggering main()
if (import.meta.main) {
	main().catch((err) => {
		console.error('[seed] FAILED:', err);
		process.exit(1);
	});
}
