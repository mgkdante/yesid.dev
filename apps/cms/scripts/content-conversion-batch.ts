#!/usr/bin/env bun
/**
 * content-conversion-batch.ts
 *
 * Value half of the conversion hardening batch (operator calls 2026-07-02):
 *
 *   hero: honesty pass (DEMO labels, simulated-data helper, no fabricated
 *         freshness prefix), identity kicker, CTA label -> booking call
 *   site labels: quiet-mode -> verb labels, blog unfiltered empty state,
 *         service + project detail CTA copy, DEMO dashboard sub-label
 *   about: value prop names the trade (+ the missing comma)
 *   home blocks going live: about-intro bio/interests/stack, CTA subtitle
 *   contact: booking prompt + button, LANGUAGES line, booking row to top
 *   services: search-facing seo_description per service (EN + FR)
 *   projects: cafe-arona -> archived (hidden until cutover)
 *
 * Requires setup-conversion-batch-fields.ts --apply to have run first.
 * The yesid-dev case-study rewrite ships separately via content-projects-yesid.ts.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

const log = createLogger('conversion-batch');

type Values = Record<string, string>;

interface TranslationPatch {
	/** Parent item path used to discover translation row ids, e.g. '/items/block_hero'. */
	parentPath: string;
	/** Translations collection the discovered rows live in. */
	translationsCollection: string;
	label: string;
	values: { en: Values; fr: Values };
}

const TRANSLATION_PATCHES: readonly TranslationPatch[] = [
	{
		parentPath: '/items/block_hero',
		translationsCollection: 'block_hero_translations',
		label: 'hero (identity + honesty + booking CTA)',
		values: {
			en: {
				identity_line: 'freelance digital infrastructure - Montreal',
				cta_contact: 'Book a 20-min intro call',
				sql_live_label: 'DEMO',
				sql_live_badge: 'LIVE',
				sql_meta_template: '5 rows · {queryTime}s · {updatedAgo}',
				refresh_helper:
					'Regenerates the metrics + query results. Simulated STM-style pipeline data, not a live feed.',
				refresh_helper_live: 'Refreshes metrics + query results from the live pipeline.',
			},
			fr: {
				identity_line: 'infrastructure numérique à la pige - Montréal',
				cta_contact: 'Réserver un appel intro de 20 min',
				sql_live_label: 'DÉMO',
				sql_live_badge: 'EN DIRECT',
				sql_meta_template: '5 lignes · {queryTime}s · {updatedAgo}',
				refresh_helper:
					'Régénère les métriques et les résultats de requête. Données simulées, style pipeline STM, pas un flux en direct.',
				refresh_helper_live:
					'Actualise les métriques et les résultats de requête depuis le pipeline en direct.',
			},
		},
	},
	{
		parentPath: '/items/site_labels',
		translationsCollection: 'site_labels_translations',
		label: 'site labels (quiet-mode verbs + empty state + CTAs + DEMO sub)',
		values: {
			en: {
				a11y_quiet_mode_label: 'Collapse all',
				a11y_quiet_mode_label_collapsed: 'Expand all',
				a11y_quiet_mode_enable: 'Collapse all sections on this page',
				a11y_quiet_mode_disable: 'Expand all sections on this page',
				a11y_quiet_mode_remember: 'Always start collapsed',
				a11y_quiet_mode_forget: "Don't start collapsed",
				blog_chrome_listing_no_posts_empty_message: 'Nothing here yet. New posts are in transit.',
				hero_dashboard_vehicles_sub: 'DEMO · STM-STYLE',
				hero_dashboard_vehicles_sub_live: 'STM · LIVE',
			},
			fr: {
				a11y_quiet_mode_label: 'Tout replier',
				a11y_quiet_mode_label_collapsed: 'Tout déplier',
				a11y_quiet_mode_enable: 'Replier toutes les sections de la page',
				a11y_quiet_mode_disable: 'Déplier toutes les sections de la page',
				a11y_quiet_mode_remember: 'Toujours replier',
				a11y_quiet_mode_forget: 'Ne plus replier',
				blog_chrome_listing_no_posts_empty_message:
					'Rien ici pour le moment. Les prochains articles sont en transit.',
				hero_dashboard_vehicles_sub: 'DÉMO · STYLE STM',
				hero_dashboard_vehicles_sub_live: 'STM · EN DIRECT',
			},
		},
	},
	{
		parentPath: '/items/block_about_content',
		translationsCollection: 'block_about_content_translations',
		label: 'about identity value prop (trade clause + comma fix)',
		values: {
			// EN stays <=260 chars (about-page.test.ts conciseness lock).
			en: {
				identity_value_prop:
					"I'm Yesid, a Montreal builder who likes clear systems and plain explanations. My trade runs through databases, pipelines, dashboards, and websites. When clients work with me, I teach them what things mean so they stay behind the wheel.",
			},
			// FR stays <=300 chars and avoids the "Je suis Yesid" construction
			// (both locked by about-page.test.ts).
			fr: {
				identity_value_prop:
					"Moi, c'est Yesid : un gars de Montréal qui aime les systèmes clairs et les explications simples. Mon métier passe par les bases de données, les pipelines, les tableaux de bord et les sites web. Avec mes clients, j'explique ce que les choses veulent dire pour qu'ils gardent le volant.",
			},
		},
	},
	{
		parentPath: '/items/block_about_intro',
		translationsCollection: 'block_about_intro_translations',
		label: 'home about teaser (bio + interests polish)',
		values: {
			en: {
				bio: 'I take data, make it tell stories, and build the systems it moves through.',
				interests: 'Manga · Transit · Space · Montreal food scene',
			},
			fr: {
				bio: 'Je prends la donnée, je lui fais raconter des histoires, et je bâtis les systèmes dans lesquels elle circule.',
				interests: 'Manga · Transport collectif · Espace · Scène bouffe de Montréal',
			},
		},
	},
	{
		parentPath: '/items/block_cta',
		translationsCollection: 'block_cta_translations',
		label: 'home CTA band subtitle (four trades, start-from-your-need)',
		values: {
			en: {
				subtitle: "Database, pipeline, dashboard, website: wherever it's stuck, that's where we start.",
			},
			fr: {
				subtitle:
					"Base de données, pipeline, tableau de bord, site web : peu importe où ça accroche, c'est là qu'on commence.",
			},
		},
	},
	{
		parentPath: '/items/block_contact_content',
		translationsCollection: 'block_contact_content_translations',
		label: 'contact (booking prompt + languages line)',
		values: {
			en: {
				booking_prompt: 'Prefer to talk it through?',
				booking_button_label: 'book --intro-call →',
				info_section_label_languages: 'LANGUAGES',
				info_languages: 'EN · FR · ES',
			},
			fr: {
				booking_prompt: 'Tu préfères en jaser de vive voix?',
				booking_button_label: 'book --intro-call →',
				info_section_label_languages: 'LANGUES',
				info_languages: 'EN · FR · ES',
			},
		},
	},
];

/** Per-service search-facing meta descriptions (EN <=152, FR <=151 chars, verified). */
const SERVICE_SEO_DESCRIPTIONS: Record<string, { en: string; fr: string }> = {
	'database-engineering': {
		en: 'Freelance PostgreSQL and SQL Server consulting in Montreal: schema design, query tuning, migrations with rollback. Fast and safe as your business grows.',
		fr: 'Pigiste PostgreSQL et SQL Server à Montréal : conception de schéma, requêtes optimisées, migrations avec rollback. Ta base reste rapide et sécuritaire.',
	},
	'data-pipeline': {
		en: 'Freelance data pipelines and automation in Montreal: Python, Airflow, dbt. Data that travels on its own and lands clean, on time, every morning.',
		fr: 'Pigiste pipelines de données à Montréal : Python, Airflow, dbt. Tes données voyagent toutes seules et arrivent propres, à temps, chaque matin.',
	},
	'analytics-reporting': {
		en: 'Freelance Power BI dashboards and analytics in Montreal: KPIs, semantic layers, reports your team trusts. Decisions in 15 minutes, not 2 days.',
		fr: 'Pigiste Power BI et analytique à Montréal : KPI, couche sémantique, tableaux de bord fiables. Ton équipe décide en 15 minutes, pas en 2 jours.',
	},
	'web-development': {
		en: 'Freelance web development in Montreal: SvelteKit sites, Shopify stores, live dashboards. Fast pages that put your data in front of people.',
		fr: 'Pigiste web à Montréal : sites SvelteKit, boutiques Shopify, tableaux de bord rapides. Tes données et tes produits rejoignent le monde.',
	},
};

/** CONNECT list order: booking first (icon is the stable key; hrefs could change). */
const CONTACT_CHANNEL_SORTS: Record<string, number> = {
	calendar: 1,
	email: 2,
	github: 3,
	linkedin: 4,
};

/** One tool per station, station order; renders in the about teaser STACK row. */
const ABOUT_INTRO_STACK_ITEMS = ['PostgreSQL', 'dbt + Airflow', 'Power BI', 'SvelteKit'];

async function apiGet(ctx: ApplyContext, path: string): Promise<any> {
	const res = await rest(ctx, 'GET', path);
	if (res.status >= 400) throw new Error(`GET ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPatch(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'PATCH', path, body);
	if (res.status >= 400) throw new Error(`PATCH ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

/** Discover translation row ids through the parent (no FK name assumptions). */
async function translationRowIds(
	ctx: ApplyContext,
	parentPath: string,
): Promise<Record<string, number>> {
	const json = await apiGet(ctx, `${parentPath}?fields=translations.id,translations.languages_code`);
	const rows = (json?.data?.translations ?? []) as Array<{ id: number; languages_code: string }>;
	if (rows.length === 0) throw new Error(`${parentPath}: no translation rows found`);
	return Object.fromEntries(rows.map((row) => [row.languages_code, row.id]));
}

async function applyTranslationPatches(ctx: ApplyContext): Promise<void> {
	for (const patch of TRANSLATION_PATCHES) {
		const ids = await translationRowIds(ctx, patch.parentPath);
		for (const locale of ['en', 'fr'] as const) {
			const rowId = ids[locale];
			if (rowId === undefined) throw new Error(`${patch.parentPath}: missing ${locale} translation row`);
			await apiPatch(ctx, `/items/${patch.translationsCollection}/${rowId}`, patch.values[locale]);
			log.info(`  ok ${patch.label} [${locale}] row ${rowId} (${Object.keys(patch.values[locale]).length} fields)`);
		}
	}
}

async function applyServiceSeoDescriptions(ctx: ApplyContext): Promise<void> {
	for (const [serviceId, copy] of Object.entries(SERVICE_SEO_DESCRIPTIONS)) {
		const ids = await translationRowIds(ctx, `/items/services/${serviceId}`);
		for (const locale of ['en', 'fr'] as const) {
			const rowId = ids[locale];
			if (rowId === undefined) throw new Error(`services/${serviceId}: missing ${locale} translation row`);
			await apiPatch(ctx, `/items/services_translations/${rowId}`, { seo_description: copy[locale] });
			log.info(`  ok services.${serviceId} seo_description [${locale}]`);
		}
	}
}

async function applyContactChannelSorts(ctx: ApplyContext): Promise<void> {
	const json = await apiGet(ctx, '/items/contact_channels?fields=id,icon,sort&limit=-1');
	const rows = (json?.data ?? []) as Array<{ id: string | number; icon: string; sort: number | null }>;
	for (const row of rows) {
		const sort = CONTACT_CHANNEL_SORTS[row.icon];
		if (sort === undefined) continue;
		if (row.sort === sort) {
			log.info(`  skip contact_channels.${row.icon} sort already ${sort}`);
			continue;
		}
		await apiPatch(ctx, `/items/contact_channels/${row.id}`, { sort });
		log.info(`  ok contact_channels.${row.icon} sort ${row.sort ?? 'null'} -> ${sort}`);
	}
}

async function applyAboutIntroStack(ctx: ApplyContext): Promise<void> {
	await apiPatch(ctx, '/items/block_about_intro', { stack_items: ABOUT_INTRO_STACK_ITEMS });
	log.info(`  ok block_about_intro.stack_items -> [${ABOUT_INTRO_STACK_ITEMS.join(', ')}]`);
}

async function archiveCafeArona(ctx: ApplyContext): Promise<void> {
	const existing = await apiGet(ctx, '/items/projects/cafe-arona?fields=id,status');
	const status = existing?.data?.status as string | undefined;
	if (status === 'archived') {
		log.info('  skip projects.cafe-arona already archived');
		return;
	}
	// "archived" is the only hiding status: draft maps to wip and still renders.
	await apiPatch(ctx, '/items/projects/cafe-arona', { status: 'archived' });
	log.info(`  ok projects.cafe-arona status ${status ?? 'unknown'} -> archived (hidden until cutover)`);
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	// Prod promotion path (mirrors sync-push.ts's double-ack ethos): dev is
	// the default and the guard stays; promoting the SAME canonical values to
	// prod requires BOTH the flag and the ack env naming the prod host.
	const prodAck =
		process.argv.includes('--promote-prod') &&
		process.env.CONTENT_BATCH_ALLOW_PROD === 'cms.yesid.dev';
	if (prodAck) {
		log.info('⚠️  PROD PROMOTION acknowledged (--promote-prod + CONTENT_BATCH_ALLOW_PROD).');
	} else {
		assertDevCms(url);
	}
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${TRANSLATION_PATCHES.length} translation patch groups, ` +
		`${Object.keys(SERVICE_SEO_DESCRIPTIONS).length} service SEO descriptions, ` +
		'contact channel sorts, about-intro stack items, cafe-arona archive');
	for (const patch of TRANSLATION_PATCHES) {
		log.info(`  patch ${patch.label}: ${Object.keys(patch.values.en).join(', ')}`);
	}
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write values.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	await applyTranslationPatches(ctx);
	await applyServiceSeoDescriptions(ctx);
	await applyContactChannelSorts(ctx);
	await applyAboutIntroStack(ctx);
	await archiveCafeArona(ctx);
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[conversion-batch] FAILED:', error);
		process.exit(1);
	});
}
