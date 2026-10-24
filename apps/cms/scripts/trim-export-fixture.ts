#!/usr/bin/env bun
/** Reconstruct a reviewable offline snapshot from the committed generated values. */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { ExportData } from './export-data';
import { siteMeta } from '../../web/src/lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '../../web/src/lib/content/site-seo-defaults';
import { routeSeoOverrides } from '../../web/src/lib/content/route-seo';
import { morphShapes } from '../../web/src/lib/content/morph-shapes';
import { errorPagesById } from '../../web/src/lib/content/error-pages';
import { navLinks, menuItems, footerLinks, mobileLinks, errorPageContent } from '../../web/src/lib/content/nav';
import { sitePages } from '../../web/src/lib/content/site-pages';
import { blogPosts } from '../../web/src/lib/content/blog';
import { blogBodies } from '../../web/src/lib/content/blog-bodies';
import { services } from '../../web/src/lib/content/services';
import { projects } from '../../web/src/lib/content/projects';
import { techStackItems, techStackPageContent } from '../../web/src/lib/content/tech-stack';
import { stackArchetypes } from '../../web/src/lib/content/stack-archetypes';
import { siteLabels } from '../../web/src/lib/content/site-labels';
import { blogPageContent } from '../../web/src/lib/content/blog-page';
import { projectsPageContent } from '../../web/src/lib/content/projects-page';
import { contactContent } from '../../web/src/lib/content/contact-page';
import { legalPages } from '../../web/src/lib/content/legal-pages';
import { heroContent, manifestoContent, proofReelContent, servicesGridContent, aboutContent, ctaContent, closerContent } from '../../web/src/lib/content/site-content';
import { aboutPageContent } from '../../web/src/lib/content/about-page';
import { mirroredMediaAssets } from '../../web/src/lib/content/media-assets';
import { mediaVariants } from '../../web/src/lib/content/media-variants';

export const FIXTURE_PATH = resolve(import.meta.dir, '../../../packages/shared/fixtures/export-data.json');

export function committedExportData(): Required<ExportData> {
	return {
		siteMeta, siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS, routeSeo: routeSeoOverrides,
		morphShapes, errorPageFallback: errorPageContent, errorPages: errorPagesById,
		nav: { navLinks, menuItems, footerLinks, mobileLinks }, sitePages, blogPosts, blogBodies,
		services, projects, techStack: techStackItems, stackArchetypes, siteLabels,
		blogPage: blogPageContent, projectsPage: projectsPageContent,
		techStackPage: techStackPageContent, contactPage: contactContent, legalPages,
		hero: heroContent, manifesto: manifestoContent, proofReel: proofReelContent,
		servicesGrid: servicesGridContent, aboutIntro: aboutContent, cta: ctaContent,
		closer: closerContent, aboutPage: aboutPageContent,
		mediaAssets: mirroredMediaAssets, mediaVariants,
	};
}

type JsonObject = Record<string, unknown>;
const isObject = (value: unknown): value is JsonObject =>
	value !== null && typeof value === 'object' && !Array.isArray(value);
const PROSE = /^(text|description|excerpt|oneLiner|quote|caption|intro|subtitle|summary|content|body|helper|helperLive)$/;
const LOCALE = /^(en|es|fr)$/;
const UUID = /[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i;

/** Keep inline markup, links, template slots and asset references verbatim. */
function shortCopy(value: string): string {
	if (value.length <= 100 || UUID.test(value) || /https?:|mailto:|\{[^}]+\}/.test(value)) return value;
	return value.split(/(<[^>]*>)/g).map((part) =>
		part.startsWith('<') || !part.trim() ? part : 'Fixture copy.',
	).join('');
}

/** Distinguish renderer branches while dropping repeated prose blocks per document. */
function blockBranch(block: JsonObject): string {
	const data = isObject(block.data) ? block.data : {};
	return JSON.stringify([
		block.type, data.level, data.style, data.language, data.alignment,
		String(data.code ?? '').match(/^```([^\s]*)/)?.[1],
		data.withHeadings, data.stretched, data.withBorder, data.withBackground,
		// Inline formatting and link branches must survive paragraph deduplication.
		[...new Set(String(data.text ?? '').match(/<\/?[a-z]+\b/g) ?? [])].sort(),
	]);
}

function trimValue(value: unknown, field = ''): unknown {
	if (typeof value === 'string') return PROSE.test(field) ? shortCopy(value) : value;
	if (Array.isArray(value)) {
		let entries = value;
		if (field === 'blocks') {
			const seen = new Set<string>();
			entries = value.filter((block) => {
				if (!isObject(block)) return true;
				const branch = blockBranch(block);
				const first = !seen.has(branch);
				seen.add(branch);
				// Keep all blocks carrying media UUIDs, images, or route links.
				return first || UUID.test(JSON.stringify(block.data)) || /"(?:url|file|href)"|href\s*=|\{[a-zA-Z]\w*\}/.test(JSON.stringify(block.data));
			});
		}
		return entries.map((entry) => trimValue(entry, field));
	}
	if (!isObject(value)) return value;
	return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
		key, trimValue(entry, LOCALE.test(key) ? field : key),
	]));
}

export function trimExportData(data: ExportData): ExportData {
	return trimValue(data) as ExportData;
}

export function serializeFixture(data: ExportData): string {
	// readCache owns the versioned envelope parser used by the exporter.
	return JSON.stringify({ version: '1', directusUrl: 'fixture', data }, null, '\t') + '\n';
}

if (import.meta.main) {
	const fixture = serializeFixture(trimExportData(committedExportData()));
	await mkdir(dirname(FIXTURE_PATH), { recursive: true });
	await writeFile(FIXTURE_PATH, fixture, 'utf8');
	console.info(`fixture: ${FIXTURE_PATH} (${fixture.split('\n').length - 1} lines)`);
}
