/**
 * Simple page-block fetchers — blocks whose content is just flat LocalizedString
 * fields composed from translations (no per-locale JSON columns, no nested
 * arrays). Covers /blog (block_blog_page_content) and /projects
 * (block_projects_page_content) page chrome.
 *
 * Architecture note: queries the block_* collection DIRECTLY rather than
 * fetching the parent `pages` row + projecting via M2A. This works because
 * each page has at most one row in its content block collection. The runtime
 * adapter still uses the full M2A loadPage() pattern for type-safe page
 * validation; the export script trades that integration check for simpler
 * code and the build-time drift gate (P7) catches mismatches.
 */

import { readItems } from '@directus/sdk';
import { toLocalizedString } from '../locale';
import {
	BlogPageContentSchema,
	ProjectsPageContentSchema,
	type BlogPageContent,
	type ProjectsPageContent,
} from '@repo/shared';
import type { FetcherContext } from './types';

interface BlogPageTranslation {
	languages_code: string;
	intro?: string | null;
	heading?: string | null;
	back_to_dispatches?: string | null;
	back_to_personal?: string | null;
}

interface BlogPageRow {
	id: number;
	translations?: BlogPageTranslation[];
}

export function toBlogPageContent(row: BlogPageRow): BlogPageContent {
	const tr = (row.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	return {
		intro: toLocalizedString(tr, 'intro'),
		heading: toLocalizedString(tr, 'heading'),
		backToDispatches: toLocalizedString(tr, 'back_to_dispatches'),
		backToPersonal: toLocalizedString(tr, 'back_to_personal'),
	};
}

export async function fetchBlogPageContent({ client }: FetcherContext): Promise<BlogPageContent> {
	const rows = (await client.request(
		readItems('block_blog_page_content', {
			fields: ['id', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as BlogPageRow[];

	if (rows.length === 0) {
		throw new Error('[fetchBlogPageContent] no block_blog_page_content row found');
	}

	return BlogPageContentSchema.parse(toBlogPageContent(rows[0]));
}

interface ProjectsPageTranslation {
	languages_code: string;
	intro?: string | null;
}

interface ProjectsPageRow {
	id: number;
	translations?: ProjectsPageTranslation[];
}

export function toProjectsPageContent(row: ProjectsPageRow): ProjectsPageContent {
	const tr = (row.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	return {
		intro: toLocalizedString(tr, 'intro'),
	};
}

export async function fetchProjectsPageContent({
	client,
}: FetcherContext): Promise<ProjectsPageContent> {
	const rows = (await client.request(
		readItems('block_projects_page_content', {
			fields: ['id', { translations: ['*'] } as unknown as string],
			limit: 1,
		}),
	)) as unknown as ProjectsPageRow[];

	if (rows.length === 0) {
		throw new Error('[fetchProjectsPageContent] no block_projects_page_content row found');
	}

	return ProjectsPageContentSchema.parse(toProjectsPageContent(rows[0]));
}
