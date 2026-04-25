#!/usr/bin/env bun
/**
 * Seed the Directus `projects` family from `fixtures/collections/projects.json`.
 *
 * Slice 18 18e. Mirrors seed-services.ts shape (lib/* helpers + dry-run + reset
 * + pure helpers exported for tests).
 *
 * Phase 4 deposit: ProjectsFixtureSchema + ProjectFixture type + loadProjectsFixture.
 * Pure transform helpers + Directus I/O land in Phase 5.
 *
 * Pure transformation helpers exported for tests/seed-projects-dry-run.test.ts.
 */

import { z } from 'zod';
import fixtureData from '../fixtures/collections/projects.json' with { type: 'json' };

// --- Types -----------------------------------------------------------------

export type Locale = 'en' | 'fr' | 'es';
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'fr', 'es'] as const;

export type ProjectStatus = 'draft' | 'published' | 'archived';

// --- Zod schemas (validate fixture JSON at load-time) ----------------------

const TranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	one_liner: z.string(),
	description: z.string(),
});

const SectionTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	title: z.string().min(1),
	content: z.string(),
});

const SectionSchema = z.object({
	sort: z.number().int().min(0),
	translations: z.array(SectionTranslationSchema).min(1),
});

const ImpactMetricTranslationSchema = z.object({
	languages_code: z.enum(['en', 'fr', 'es']),
	label: z.string().min(1),
});

const ImpactMetricSchema = z.object({
	sort: z.number().int().min(0),
	value: z.string().min(1),
	before: z.string().nullable(),
	translations: z.array(ImpactMetricTranslationSchema).min(1),
});

const ProjectFixtureSchema = z.object({
	id: z.string().min(1),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	sort: z.number().int().min(0),
	featured: z.boolean(),
	hero_image_legacy_path: z.string().nullable(),
	repo_url: z.string().nullable(),
	live_url: z.string().nullable(),
	readme_url: z.string().nullable(),
	location: z.string().nullable(),
	environment: z.string().nullable(),
	version: z.string().nullable(),
	stack: z.array(z.string()).readonly(),
	tags: z.array(z.string()).readonly(),
	translations: z.array(TranslationSchema).min(1),
	sections: z.array(SectionSchema),
	impact_metrics: z.array(ImpactMetricSchema),
	related_services: z.array(z.string()).readonly(),
});

export type ProjectFixture = z.infer<typeof ProjectFixtureSchema>;

export const ProjectsFixtureSchema = z.array(ProjectFixtureSchema).min(1).readonly();

/** Parse + return the fixture. Exported for tests to share the same code path. */
export function loadProjectsFixture(): readonly ProjectFixture[] {
	return ProjectsFixtureSchema.parse(fixtureData);
}

// --- Pure helpers + Directus I/O lands in Phase 5 ---

if (import.meta.main) {
	console.error('seed-projects: pure helpers + I/O land in Phase 5.');
	process.exit(1);
}
