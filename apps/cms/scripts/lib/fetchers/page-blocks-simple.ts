/**
 * Simple page-block fetchers: blocks whose content is just flat LocalizedString
 * fields composed from translations (no per-locale JSON columns, no nested
 * arrays). Covers /blog (block_blog_page_content) and /projects
 * (block_projects_page_content) page chrome.
 *
 * Architecture note: queries the block_* collection DIRECTLY rather than
 * fetching the parent `pages` row + projecting via M2A. Queried via
 * `readSingleton` + `asSingletonRow` (shape-tolerant during flips). The
 * runtime adapter still uses the full M2A loadPage() pattern for type-safe
 * page validation; the export script trades that integration check for
 * simpler code and the build-time drift gate (P7) catches mismatches.
 */

import { toLocalizedString } from '../locale';
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
	intro?: string | null;
	heading?: string | null;
	back_to_dispatches?: string | null;
	back_to_personal?: string | null;
	personal_heading?: string | null;
	personal_intro?: string | null;
	to_personal_label?: string | null;
	to_personal_subtitle?: string | null;
	to_professional_label?: string | null;
	to_professional_subtitle?: string | null;
	entry_rail_work_title?: string | null;
	entry_rail_work_prompt?: string | null;
	entry_rail_services_label?: string | null;
	entry_rail_contact_label?: string | null;
	entry_rail_routes_title?: string | null;
	entry_rail_route_case_studies_label?: string | null;
	entry_rail_route_services_label?: string | null;
	entry_rail_route_stack_label?: string | null;
	entry_rail_route_about_label?: string | null;
	entry_rail_route_contact_label?: string | null;
}

interface BlogPageRow {
	id: number;
	entry_rail_services_href?: string | null;
	entry_rail_contact_href?: string | null;
	entry_rail_route_case_studies_href?: string | null;
	entry_rail_route_services_href?: string | null;
	entry_rail_route_stack_href?: string | null;
	entry_rail_route_about_href?: string | null;
	entry_rail_route_contact_href?: string | null;
	translations?: BlogPageTranslation[];
}

function href(value: string | null | undefined, fallback: string): string {
	return value && value.trim() ? value : fallback;
}

export function toBlogPageContent(row: BlogPageRow): BlogPageContent {
	const tr = (row.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	return {
		intro: toLocalizedString(tr, 'intro'),
		heading: toLocalizedString(tr, 'heading'),
		backToDispatches: toLocalizedString(tr, 'back_to_dispatches'),
		backToPersonal: toLocalizedString(tr, 'back_to_personal'),
		personalHeading: toLocalizedString(tr, 'personal_heading'),
		personalIntro: toLocalizedString(tr, 'personal_intro'),
		toPersonalLabel: toLocalizedString(tr, 'to_personal_label'),
		toPersonalSubtitle: toLocalizedString(tr, 'to_personal_subtitle'),
		toProfessionalLabel: toLocalizedString(tr, 'to_professional_label'),
		toProfessionalSubtitle: toLocalizedString(tr, 'to_professional_subtitle'),
		entryRail: {
			workWithMe: {
				title: toLocalizedString(tr, 'entry_rail_work_title'),
				prompt: toLocalizedString(tr, 'entry_rail_work_prompt'),
				primary: {
					label: toLocalizedString(tr, 'entry_rail_services_label'),
					href: href(row.entry_rail_services_href, '/services'),
				},
				secondary: {
					label: toLocalizedString(tr, 'entry_rail_contact_label'),
					href: href(row.entry_rail_contact_href, '/contact'),
				},
			},
			routes: {
				title: toLocalizedString(tr, 'entry_rail_routes_title'),
				links: [
					{
						label: toLocalizedString(tr, 'entry_rail_route_about_label'),
						href: href(row.entry_rail_route_about_href, '/about'),
					},
					{
						label: toLocalizedString(tr, 'entry_rail_route_case_studies_label'),
						href: href(row.entry_rail_route_case_studies_href, '/projects'),
					},
					{
						label: toLocalizedString(tr, 'entry_rail_route_services_label'),
						href: href(row.entry_rail_route_services_href, '/services'),
					},
					{
						label: toLocalizedString(tr, 'entry_rail_route_stack_label'),
						href: href(row.entry_rail_route_stack_href, '/tech-stack'),
					},
					{
						label: toLocalizedString(tr, 'entry_rail_route_contact_label'),
						href: href(row.entry_rail_route_contact_href, '/contact'),
					},
				],
			},
		},
	};
}

export async function fetchBlogPageContent({ client }: FetcherContext): Promise<BlogPageContent> {
	const row = await fetchBlockSingleton<BlogPageRow>(
		client,
		'block_blog_page_content',
		'fetchBlogPageContent/block_blog_page_content',
		[
			'id',
			'entry_rail_services_href',
			'entry_rail_contact_href',
			'entry_rail_route_case_studies_href',
			'entry_rail_route_services_href',
			'entry_rail_route_stack_href',
			'entry_rail_route_about_href',
			'entry_rail_route_contact_href',
			{ translations: ['*'] },
		],
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
	const tr = (row.translations ?? []) as ReadonlyArray<{ languages_code: string }>;
	return {
		intro: toLocalizedString(tr, 'intro'),
		heading: toLocalizedString(tr, 'heading'),
		emptyState: toLocalizedString(tr, 'empty_state'),
	};
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
