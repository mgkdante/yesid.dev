#!/usr/bin/env bun
/**
 * Add explicit project hero media slots to Directus dev CMS.
 *
 * The project row owns card and proof-reel media:
 * - hero_image: desktop/default
 * - hero_image_light: desktop/light
 * - hero_image_secondary: optional mobile/default
 * - hero_image_secondary_light: optional mobile/light
 *
 * Gallery image blocks can still hold any extra case-study media. These fields
 * are the stable source for cards, home proof reel, and the first gallery images.
 *
 * DEV-ONLY. Dry-run by default, pass --apply to write.
 */

import { assertDevCms, defaultDirectusUrl, requireEnv } from './lib/sdk';

type StepKind = 'field' | 'relation' | 'field-sort';

interface Step {
	kind: StepKind;
	target: string;
	method: 'POST' | 'PATCH';
	path: string;
	payload: Record<string, unknown>;
}

const HERO_FIELDS = [
	{
		field: 'hero_image_light',
		note: 'Light theme variant for project hero image 1.',
		sort: 42,
	},
	{
		field: 'hero_image_secondary',
		note: 'Project hero image 2. Optional mobile or secondary view for cards and proof reel.',
		sort: 43,
	},
	{
		field: 'hero_image_secondary_light',
		note: 'Light theme variant for project hero image 2.',
		sort: 44,
	},
] as const;

function fileImageField(field: string, note: string, sort: number): Record<string, unknown> {
	return {
		field,
		type: 'uuid',
		meta: {
			display: 'image',
			field,
			group: 'grp_media',
			hidden: false,
			interface: 'file-image',
			note,
			readonly: false,
			required: false,
			searchable: true,
			sort,
			width: 'half',
		},
		schema: {
			is_nullable: true,
		},
	};
}

export function buildProjectHeroMediaPlan(): Step[] {
	const steps: Step[] = [];
	for (const item of HERO_FIELDS) {
		steps.push({
			kind: 'field',
			target: `projects.${item.field}`,
			method: 'POST',
			path: '/fields/projects',
			payload: fileImageField(item.field, item.note, item.sort),
		});
		steps.push({
			kind: 'relation',
			target: `projects.${item.field}`,
			method: 'POST',
			path: '/relations',
			payload: {
				collection: 'projects',
				field: item.field,
				related_collection: 'directus_files',
				meta: {
					one_field: null,
					one_deselect_action: 'nullify',
				},
				schema: {
					on_delete: 'SET NULL',
				},
			},
		});
	}

	steps.push({
		kind: 'field-sort',
		target: 'projects.svg_illustration',
		method: 'PATCH',
		path: '/fields/projects/svg_illustration',
		payload: {
			meta: { sort: 45 },
		},
	});

	return steps;
}

async function rest(
	directusUrl: string,
	token: string,
	step: Step,
): Promise<{ status: number; json: unknown }> {
	const response = await fetch(`${directusUrl}${step.path}`, {
		method: step.method,
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(step.payload),
	});
	const text = await response.text();
	let json: unknown = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { raw: text };
	}
	return { status: response.status, json };
}

function alreadyExists(status: number, json: unknown): boolean {
	if (status < 400) return false;
	const errors = (json as { errors?: Array<{ message?: string; extensions?: { code?: string } }> })?.errors ?? [];
	return errors.some(
		(error) =>
			error.extensions?.code === 'RECORD_NOT_UNIQUE' ||
			/already exists/i.test(error.message ?? '') ||
			/already has an associated relationship/i.test(error.message ?? ''),
	);
}

export async function apply(opts: {
	directusUrl: string;
	token: string;
	dryRun?: boolean;
}): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const log: string[] = [];
	const plan = buildProjectHeroMediaPlan();

	for (const step of plan) {
		log.push(`${dryRun ? '[plan]' : '[run ]'} ${step.method} ${step.path} ${step.target}`);
		if (dryRun) continue;
		const result = await rest(opts.directusUrl, opts.token, step);
		if (result.status < 400) {
			log.push(`[done] ${step.target}`);
			continue;
		}
		if (alreadyExists(result.status, result.json)) {
			log.push(`[skip] ${step.target} already exists`);
			continue;
		}
		throw new Error(`${step.method} ${step.path} failed for ${step.target}: ${JSON.stringify(result.json)}`);
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = dryRun ? 'dry-run' : requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN. Re-run with --apply.' : 'APPLIED.'}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[add-project-hero-media-fields] FAILED:', error);
		process.exit(1);
	});
}
