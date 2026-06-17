/**
 * projects fetcher — reads `projects` with translations + sections + impact_metrics
 * + projects_services M2M. Mirrors apps/web/src/lib/adapters/directus.ts:1672 `toProject`
 * + L2298 `fetchProjects`.
 *
 * Directus status (`draft`/`published`/`archived`) maps to legacy
 * `public`/`private`/`wip` per 18e spec — the adapter is the only place the
 * mapping happens; consumer code stays on the legacy enum.
 */

import { readItems } from '@directus/sdk';
import { z } from 'zod';
import { toLocalizedString, toLocalizedBlockEditorDoc } from '../locale';
import type { BlockEditorDoc } from '@repo/shared';
import {
	ProjectSchema,
	type ImpactMetric,
	type Project,
	type ProjectSection,
	type ProjectStatus,
} from '../schemas/project';
import type { FetcherContext } from './types';

export interface DirectusProjectTranslation {
	languages_code: string;
	title?: string | null;
	one_liner?: string | null;
	description?: BlockEditorDoc | null;
}

export interface DirectusProjectSectionTranslation {
	languages_code: string;
	title?: string | null;
	content?: BlockEditorDoc | null;
}

export interface DirectusProjectSectionRow {
	id: number;
	sort: number | null;
	translations?: DirectusProjectSectionTranslation[];
}

export interface DirectusProjectImpactMetricTranslation {
	languages_code: string;
	label?: string | null;
}

export interface DirectusProjectImpactMetricRow {
	id: number;
	sort: number | null;
	value: string;
	before: string | null;
	translations?: DirectusProjectImpactMetricTranslation[];
}

export interface DirectusProjectsServicesRow {
	id: number;
	project_id: string;
	service_id: string;
}

export interface DirectusProject {
	id: string;
	status: 'draft' | 'published' | 'archived';
	date_published: string | null;
	sort: number | null;
	featured: boolean;
	hero_image: string | null;
	hero_image_light: string | null;
	hero_image_secondary: string | null;
	hero_image_secondary_light: string | null;
	repo_url: string | null;
	live_url: string | null;
	readme_url: string | null;
	location: string | null;
	environment: string | null;
	version: string | null;
	translations?: DirectusProjectTranslation[];
	sections?: DirectusProjectSectionRow[];
	impact_metrics?: DirectusProjectImpactMetricRow[];
	services?: DirectusProjectsServicesRow[];
	/** Normalized tech stack: M2M to tech_stack, ordered by junction `sort`.
	 *  Single source of truth (the old denormalized `stack` json was dropped). */
	tech_stack?: DirectusTechStackJunctionRow[];
	/** Normalized tags: M2M to the shared tags collection, ordered by `sort`
	 *  (the old denormalized `tags` json was dropped). */
	tags?: DirectusTagJunctionRow[];
}

/** tech_stack_projects junction row, expanded to the linked tech name. */
export interface DirectusTechStackJunctionRow {
	sort: number | null;
	tech_stack_id: { id: string; name: string } | null;
}

/** projects_tags / blog_posts_tags junction row, expanded to the tag slug. */
export interface DirectusTagJunctionRow {
	sort: number | null;
	tags_id: { id: string } | null;
}

/** Tech names from the ordered M2M junction (single source of truth for stack). */
export function stackFromTechM2M(rows: DirectusTechStackJunctionRow[] | undefined): string[] {
	return (rows ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((j) => j.tech_stack_id?.name)
		.filter((n): n is string => !!n);
}

/** Tag slugs from the ordered M2M junction (single source of truth for tags). */
export function tagsFromM2M(rows: DirectusTagJunctionRow[] | undefined): string[] {
	return (rows ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((j) => j.tags_id?.id)
		.filter((n): n is string => !!n);
}

export function statusFromDirectus(s: 'draft' | 'published' | 'archived'): ProjectStatus {
	switch (s) {
		case 'published':
			return 'public';
		case 'draft':
			return 'wip';
		case 'archived':
			return 'private';
	}
}

/** Pure transform — DirectusProject → Project. Tested standalone. */
export function toProject(row: DirectusProject): Project {
	const translations = row.translations ?? [];

	const sections: ProjectSection[] = (row.sections ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((s) => ({
			title: toLocalizedString(s.translations ?? [], 'title'),
			content: toLocalizedBlockEditorDoc(s.translations ?? [], 'content'),
		}));

	const impactMetrics: ImpactMetric[] = (row.impact_metrics ?? [])
		.slice()
		.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
		.map((m) => {
			const metric: ImpactMetric = {
				value: m.value,
				label: toLocalizedString(m.translations ?? [], 'label'),
			};
			if (m.before) metric.before = m.before;
			return metric;
		});

	const project: Project = {
		slug: row.id,
		title: toLocalizedString(translations, 'title'),
		oneLiner: toLocalizedString(translations, 'one_liner'),
		description: toLocalizedBlockEditorDoc(translations, 'description'),
		stack: stackFromTechM2M(row.tech_stack),
		tags: tagsFromM2M(row.tags),
		status: statusFromDirectus(row.status),
		featured: row.featured,
		relatedServices: (row.services ?? []).map((j) => j.service_id),
		sections,
	};

	if (row.repo_url) project.repoUrl = row.repo_url;
	if (row.live_url) project.liveUrl = row.live_url;
	if (row.readme_url) project.readmeUrl = row.readme_url;
	if (row.hero_image) project.image = row.hero_image;
	if (row.hero_image_light) project.imageLight = row.hero_image_light;
	if (row.hero_image_secondary) project.imageSecondary = row.hero_image_secondary;
	if (row.hero_image_secondary_light) project.imageSecondaryLight = row.hero_image_secondary_light;
	if (row.location) project.location = row.location;
	if (row.environment) project.environment = row.environment;
	if (row.version) project.version = row.version;

	if (impactMetrics.length > 0) {
		project.impactMetrics = impactMetrics;
		project.impactMetric = impactMetrics[0];
	}

	return project;
}

/** Fetch + validate all projects with nested children expanded. */
export async function fetchProjects({ client }: FetcherContext): Promise<readonly Project[]> {
	const rows = (await client.request(
		readItems('projects', {
			fields: [
				'*',
				{ translations: ['*'] } as unknown as string,
				{ sections: ['id', 'sort', { translations: ['*'] }] } as unknown as string,
				{ impact_metrics: ['id', 'sort', 'value', 'before', { translations: ['*'] }] } as unknown as string,
				{ services: ['id', 'project_id', 'service_id'] } as unknown as string,
				{ tech_stack: ['sort', { tech_stack_id: ['id', 'name'] }] } as unknown as string,
				{ tags: ['sort', { tags_id: ['id'] }] } as unknown as string,
			],
			limit: -1,
		}),
	)) as unknown as DirectusProject[];

	return z.array(ProjectSchema).parse(rows.map(toProject));
}
