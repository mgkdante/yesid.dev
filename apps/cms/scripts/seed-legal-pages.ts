#!/usr/bin/env bun
/**
 * seed-legal-pages.ts
 *
 * Value half of the legal framework (launch Phase 1, OPS1). Reads the
 * reviewable drafts in ops/legal/legal-pages-2026-07-09.json and upserts:
 *
 *   legal_pages + legal_pages_translations   (en + fr title/body per page)
 *   site_pages rows /legal/<slug>            (route gate + sitemap + nav label;
 *                                             titles en/fr/es so L1 needs no backfill)
 *   nav_links rows placement=footer          (label falls back to the page title)
 *
 * Neutral draft blocks (h2/h3/p/ul/ol) convert to Block Editor docs here:
 * deterministic ids + fixed timestamp keep the emitted module byte-stable.
 *
 * Requires setup-legal-pages-schema.ts --apply to have run first.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';
import drafts from '../ops/legal/legal-pages-2026-07-09.json' with { type: 'json' };

const log = createLogger('seed-legal-pages');

interface DraftBlock {
	kind: 'h2' | 'h3' | 'p' | 'ul' | 'ol';
	text?: string;
	items?: string[];
}

interface DraftLocale {
	title: string;
	blocks: DraftBlock[];
}

interface DraftPage {
	slug: string;
	sort: number;
	en: DraftLocale;
	fr: DraftLocale;
	advisorNotes: string;
}

/** site_pages titles: es now so the L1 flip needs no registry backfill. */
const ES_TITLES: Record<string, string> = {
	privacy: 'Política de privacidad',
	terms: 'Condiciones de uso',
	cookies: 'Política de cookies',
	accessibility: 'Declaración de accesibilidad',
	notice: 'Aviso legal',
};

/** Fixed timestamp so regenerated modules stay byte-stable (Editor.js sets a
 *  real one on any future in-CMS edit, which is fine: content changed). */
const DOC_TIME = 1751500800000;
const DOC_VERSION = '2.31.2';

/** Draft text is plain; Block Editor `text` is raw HTML. Escape the HTML
 *  specials so the renderer shows the literal characters. */
function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function toBlockEditorDoc(slug: string, locale: string, blocks: DraftBlock[]) {
	return {
		time: DOC_TIME,
		version: DOC_VERSION,
		blocks: blocks.map((b, i) => {
			const id = `legal-${slug}-${locale}-${String(i + 1).padStart(3, '0')}`;
			if (b.kind === 'h2' || b.kind === 'h3') {
				return { id, type: 'header', data: { text: escapeHtml(b.text ?? ''), level: b.kind === 'h2' ? 2 : 3 } };
			}
			if (b.kind === 'ul' || b.kind === 'ol') {
				return {
					id,
					type: 'nestedlist',
					data: {
						style: b.kind === 'ul' ? 'unordered' : 'ordered',
						items: (b.items ?? []).map((content) => ({ content: escapeHtml(content), items: [] })),
					},
				};
			}
			return { id, type: 'paragraph', data: { text: escapeHtml(b.text ?? '') } };
		}),
	};
}

async function apiGet(ctx: ApplyContext, path: string): Promise<{ status: number; json: any }> {
	return rest(ctx, 'GET', path);
}

async function apiWrite(ctx: ApplyContext, method: 'POST' | 'PATCH', path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, method, path, body);
	if (res.status >= 400) throw new Error(`${method} ${path} failed (${res.status}): ${JSON.stringify(res.json)}`);
	return res.json;
}

async function upsertLegalPage(ctx: ApplyContext, page: DraftPage): Promise<void> {
	const existing = await apiGet(ctx, `/items/legal_pages/${page.slug}?fields=id,translations.id,translations.languages_code`);
	if (existing.status === 404 || existing.status === 403) {
		await apiWrite(ctx, 'POST', '/items/legal_pages', {
			id: page.slug,
			status: 'published',
			sort: page.sort,
			translations: (['en', 'fr'] as const).map((locale) => ({
				languages_code: locale,
				title: page[locale].title,
				body: toBlockEditorDoc(page.slug, locale, page[locale].blocks),
			})),
		});
		log.info(`  ok legal_pages.${page.slug} created (en+fr)`);
		return;
	}
	const rows = (existing.json?.data?.translations ?? []) as Array<{ id: number; languages_code: string }>;
	const byLocale = Object.fromEntries(rows.map((r) => [r.languages_code, r.id]));
	await apiWrite(ctx, 'PATCH', `/items/legal_pages/${page.slug}`, { status: 'published', sort: page.sort });
	for (const locale of ['en', 'fr'] as const) {
		const payload = {
			title: page[locale].title,
			body: toBlockEditorDoc(page.slug, locale, page[locale].blocks),
		};
		if (byLocale[locale] !== undefined) {
			await apiWrite(ctx, 'PATCH', `/items/legal_pages_translations/${byLocale[locale]}`, payload);
		} else {
			await apiWrite(ctx, 'POST', '/items/legal_pages_translations', {
				...payload,
				legal_pages_id: page.slug,
				languages_code: locale,
			});
		}
	}
	log.info(`  ok legal_pages.${page.slug} updated (en+fr)`);
}

async function upsertSitePage(ctx: ApplyContext, page: DraftPage, sort: number): Promise<string> {
	const path = `/legal/${page.slug}`;
	const existing = await apiGet(ctx, `/items/site_pages?filter[path][_eq]=${encodeURIComponent(path)}&fields=id,status`);
	const rows = (existing.json?.data ?? []) as Array<{ id: string; status: string }>;
	if (rows.length > 0) {
		log.info(`  skip site_pages ${path} already exists (${rows[0].status})`);
		return rows[0].id;
	}
	const created = await apiWrite(ctx, 'POST', '/items/site_pages', {
		status: 'published',
		path,
		type: 'freeform',
		sort,
		translations: [
			{ languages_code: 'en', title: page.en.title },
			{ languages_code: 'fr', title: page.fr.title },
			{ languages_code: 'es', title: ES_TITLES[page.slug] ?? page.en.title },
		],
	});
	log.info(`  ok site_pages ${path} created (en+fr+es titles)`);
	return created?.data?.id as string;
}

async function upsertFooterLink(ctx: ApplyContext, sitePageId: string, slug: string, sort: number): Promise<void> {
	const existing = await apiGet(
		ctx,
		`/items/nav_links?filter[placement][_eq]=footer&filter[page][_eq]=${sitePageId}&fields=id`,
	);
	const rows = (existing.json?.data ?? []) as Array<{ id: string }>;
	if (rows.length > 0) {
		log.info(`  skip nav_links footer -> /legal/${slug} already exists`);
		return;
	}
	await apiWrite(ctx, 'POST', '/items/nav_links', {
		status: 'published',
		placement: 'footer',
		page: sitePageId,
		// href column is schema-required; the fetcher still prefers page.path
		// when the FK is expanded, so keep the two in lockstep.
		href: `/legal/${slug}`,
		priority: 1,
		sort,
	});
	log.info(`  ok nav_links footer -> /legal/${slug}`);
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const pages = drafts.pages as DraftPage[];
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${pages.length} legal pages (en+fr) + site_pages rows + footer nav_links`);
	for (const page of pages) {
		log.info(
			`  ${page.slug}: en "${page.en.title}" (${page.en.blocks.length} blocks) / fr "${page.fr.title}" (${page.fr.blocks.length} blocks) -> /legal/${page.slug}`,
		);
	}
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	for (const [i, page] of pages.entries()) {
		await upsertLegalPage(ctx, page);
		const sitePageId = await upsertSitePage(ctx, page, 20 + i);
		await upsertFooterLink(ctx, sitePageId, page.slug, 90 + i);
	}
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[seed-legal-pages] FAILED:', error);
		process.exit(1);
	});
}
