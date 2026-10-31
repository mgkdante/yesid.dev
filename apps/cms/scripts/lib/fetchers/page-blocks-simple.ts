/**
 * Simple page-block fetchers: blocks whose content is just flat LocalizedString
 * fields composed from translations (no per-locale JSON columns, no nested
 * arrays). Covers /blog (block_blog_page_content) and /projects
 * (block_projects_page_content) listing text.
 *
 * Queries each block_* singleton directly rather than projecting the parent
 * pages M2A tree. These fetchers own the build-time listing-text projections;
 * generated-content verification catches output drift.
 */

import { toLocalizedFields } from '../locale';
import { fetchBlockSingleton } from './singleton';
import {
	BlogPageContentSchema,
	ProjectsPageContentSchema,
	type BlogPageContent,
	type ProjectsPageContent,
} from '@repo/shared';
import type { FetcherContext } from './types';

interface BlogPageTranslation {
	languages_code: string;
	heading?: string | null;
	intro?: string | null;
	personal_heading?: string | null;
	personal_intro?: string | null;
	empty_state?: string | null;
	empty_state_no_posts?: string | null;
}

interface BlogPageRow {
	id: number;
	translations?: BlogPageTranslation[];
}

export function toBlogPageContent(row: BlogPageRow): BlogPageContent {
	return toLocalizedFields(row.translations ?? [], [
		'heading', 'intro', ['personalHeading', 'personal_heading'],
		['personalIntro', 'personal_intro'], ['emptyState', 'empty_state'],
		['emptyStateNoPosts', 'empty_state_no_posts'],
	]);
}

export async function fetchBlogPageContent({ client }: FetcherContext): Promise<BlogPageContent> {
	const row = await fetchBlockSingleton<BlogPageRow>(
		client,
		'block_blog_page_content',
		'fetchBlogPageContent/block_blog_page_content',
		['id', { translations: ['*'] }],
	);
	return BlogPageContentSchema.parse(toBlogPageContent(row));
}

interface ProjectsPageTranslation {
	languages_code: string;
	intro?: string | null;
	heading?: string | null;
	empty_state?: string | null;
}

interface ProjectsPageRow {
	id: number;
	translations?: ProjectsPageTranslation[];
}

export function toProjectsPageContent(row: ProjectsPageRow): ProjectsPageContent {
	return toLocalizedFields(row.translations ?? [], [
		'intro', 'heading', ['emptyState', 'empty_state'],
	]);
}

export async function fetchProjectsPageContent({
	client,
}: FetcherContext): Promise<ProjectsPageContent> {
	const row = await fetchBlockSingleton<ProjectsPageRow>(
		client,
		'block_projects_page_content',
		'fetchProjectsPageContent/block_projects_page_content',
		['id', { translations: ['*'] }],
	);
	return ProjectsPageContentSchema.parse(toProjectsPageContent(row));
}
