#!/usr/bin/env bun
/**
 * Create the `stack_archetypes` schema family in Directus (slice-29).
 *
 * stack_archetypes is the data spine of the Tech Stack Engine: goal-shaped
 * stack recipes ("a data dashboard") whose layered M2M links to tech_stack
 * drive the living blueprint on /tech-stack. This script creates:
 *
 *   1. stack_archetypes            (parent, uuid PK, status/slug/sort/icon)
 *   2. stack_archetypes_translations (hidden i18n junction: title/hook/description)
 *   3. stack_archetypes_tech       (hidden layered M2M junction → tech_stack)
 *   4. proof_project / service M2O fields (string FKs — projects/services use slug PKs)
 *   5. tech_stack.layer + tech_stack_translations.enables (engine support fields)
 *   6. flow trigger: adds stack_archetypes to 'Vercel revalidate on publish'
 *   7. read permissions for the public + Build Bot policies
 *
 * Mirrors the archive-lorem-posts shape: lib/* helpers, DRY-RUN BY DEFAULT
 * (no network, no token needed), pure exported plan builder for tests.
 * Pass --apply to write. Apply is idempotent — already-exists answers are
 * logged as `skip` and execution continues.
 *
 * Operator run:
 *   op run --env-file=.env -- bun --cwd apps/cms run setup:archetypes -- --apply
 *
 * Auth: lib/auth getAdminToken resolves DIRECTUS_BUILD_TOKEN →
 * DIRECTUS_ADMIN_TOKEN → email+password. Target URL: PUBLIC_DIRECTUS_URL
 * (defaults to the dev CMS — set it to prod explicitly for the real run).
 */

import { STACK_LAYERS } from '@repo/shared/schemas';
import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, isAlreadyExists, rest } from './lib/schema-apply';

// --- Plan types ------------------------------------------------------------
// SchemaStep is extended locally: stack-archetypes adds the 'flow-trigger' kind
// (registers the collection on the 'Vercel revalidate on publish' flow), which
// the shared 4-kind type in ./lib/schema-apply deliberately does not carry.

export type SchemaStepKind =
	| 'collection'
	| 'field'
	| 'relation'
	| 'flow-trigger'
	| 'permission';

export interface SchemaStep {
	kind: SchemaStepKind;
	/** Human-readable target, e.g. 'stack_archetypes' or 'tech_stack.layer'. */
	target: string;
	method: 'POST' | 'PATCH';
	/** REST path. flow-trigger uses '/flows/:id' — the id is resolved at apply time. */
	path: string;
	payload: Record<string, unknown>;
	/**
	 * permission steps only: policy display names to resolve to a policy id at
	 * apply time. The public policy is stored as '$t:public_label' in this
	 * instance; 'Public' is accepted as an alias.
	 */
	policyNames?: readonly string[];
}

// --- Field-shape helpers (mirror directus/snapshot conventions) ------------

const LAYER_CHOICES = STACK_LAYERS.map((value) => ({
	text: value.charAt(0).toUpperCase() + value.slice(1),
	value,
}));

/** uuid PK — mirrors site_pages.id. */
function uuidPkField() {
	return {
		field: 'id',
		type: 'uuid',
		meta: { hidden: true, special: ['uuid'], readonly: true },
		schema: { is_primary_key: true, is_unique: true },
	};
}

/** integer autoincrement PK — mirrors site_pages_translations.id. */
function autoincrementPkField() {
	return {
		field: 'id',
		type: 'integer',
		meta: { hidden: true },
		schema: { is_primary_key: true, has_auto_increment: true },
	};
}

// --- Pure plan builder (exported for the dry-run test) ----------------------

export function buildSchemaPlan(): SchemaStep[] {
	const steps: SchemaStep[] = [];

	// 1. Parent collection — editor-facing, grouped under tech_stack_page.
	steps.push({
		kind: 'collection',
		target: 'stack_archetypes',
		method: 'POST',
		path: '/collections',
		payload: {
			collection: 'stack_archetypes',
			meta: {
				group: 'tech_stack_page',
				icon: 'hub',
				note:
					'Goal archetypes for the Tech Stack Engine — each row is a buildable outcome whose layered tech links draw the blueprint.',
				archive_field: 'status',
				archive_value: 'archived',
				unarchive_value: 'published',
				archive_app_filter: true,
				display_template: '{{slug}}',
				sort_field: 'sort',
			},
			schema: {},
			fields: [
				uuidPkField(),
				{
					field: 'status',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: 'Published', value: 'published' },
								{ text: 'Archived', value: 'archived' },
							],
						},
						width: 'half',
					},
					schema: { default_value: 'published', is_nullable: false },
				},
				{
					field: 'slug',
					type: 'string',
					meta: {
						interface: 'input',
						options: { slug: true, trim: true },
						required: true,
						note: 'Kebab-case identifier (e.g. data-dashboard). Stable engine key.',
					},
					schema: { is_unique: true, is_nullable: false },
				},
				{
					field: 'sort',
					type: 'integer',
					meta: { hidden: true, interface: 'input' },
					schema: {},
				},
				{
					field: 'icon',
					type: 'string',
					meta: {
						interface: 'input',
						note: 'material icon name for the archetype card',
						width: 'half',
					},
					schema: { is_nullable: true },
				},
			],
		},
	});

	// 2. Translations junction collection — hidden, mirrors *_translations siblings.
	steps.push({
		kind: 'collection',
		target: 'stack_archetypes_translations',
		method: 'POST',
		path: '/collections',
		payload: {
			collection: 'stack_archetypes_translations',
			meta: {
				hidden: true,
				icon: 'import_export',
				note: 'Translated copy for stack_archetypes (title, hook, description).',
			},
			schema: {},
			fields: [
				autoincrementPkField(),
				{
					field: 'stack_archetypes_id',
					type: 'uuid',
					meta: { hidden: true },
					schema: {},
				},
				{
					field: 'languages_code',
					type: 'string',
					meta: { hidden: true },
					schema: {},
				},
				{
					field: 'title',
					type: 'string',
					meta: { interface: 'input', required: true },
					schema: { is_nullable: false },
				},
				{
					field: 'hook',
					type: 'string',
					meta: { interface: 'input', required: true, note: 'one-liner on the card' },
					schema: { is_nullable: false },
				},
				{
					field: 'description',
					type: 'text',
					meta: { interface: 'input-multiline' },
					schema: { is_nullable: true },
				},
			],
		},
	});

	// 3. Translations junction relations — exact site_pages_translations shape.
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes_translations.stack_archetypes_id',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes_translations',
			field: 'stack_archetypes_id',
			related_collection: 'stack_archetypes',
			meta: {
				one_field: 'translations',
				junction_field: 'languages_code',
				one_deselect_action: 'nullify',
			},
			schema: { on_delete: 'CASCADE' },
		},
	});
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes_translations.languages_code',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes_translations',
			field: 'languages_code',
			related_collection: 'languages',
			meta: {
				one_field: null,
				junction_field: 'stack_archetypes_id',
				one_deselect_action: 'nullify',
			},
			schema: { on_delete: 'CASCADE' },
		},
	});

	// 4. translations alias field on the parent.
	steps.push({
		kind: 'field',
		target: 'stack_archetypes.translations',
		method: 'POST',
		path: '/fields/stack_archetypes',
		payload: {
			field: 'translations',
			type: 'alias',
			meta: {
				interface: 'translations',
				special: ['translations'],
				options: { languageField: 'code' },
			},
		},
	});

	// 5. proof_project M2O → projects (string slug PK — verified in snapshot).
	steps.push({
		kind: 'field',
		target: 'stack_archetypes.proof_project',
		method: 'POST',
		path: '/fields/stack_archetypes',
		payload: {
			field: 'proof_project',
			type: 'string',
			meta: {
				interface: 'select-dropdown-m2o',
				special: ['m2o'],
				display: 'related-values',
				// projects has no separate slug column — the PK `id` IS the slug.
				display_options: { template: '{{id}}' },
				note: 'the real project that proves this archetype',
				width: 'half',
			},
			schema: { is_nullable: true },
		},
	});
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes.proof_project',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes',
			field: 'proof_project',
			related_collection: 'projects',
			meta: { one_field: null, one_deselect_action: 'nullify' },
			schema: { on_delete: 'SET NULL' },
		},
	});

	// 6. service M2O → services (string slug PK, e.g. 'sql-development').
	steps.push({
		kind: 'field',
		target: 'stack_archetypes.service',
		method: 'POST',
		path: '/fields/stack_archetypes',
		payload: {
			field: 'service',
			type: 'string',
			meta: {
				interface: 'select-dropdown-m2o',
				special: ['m2o'],
				display: 'related-values',
				display_options: { template: '{{id}}' },
				note: 'the service that delivers this outcome',
				width: 'half',
			},
			schema: { is_nullable: true },
		},
	});
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes.service',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes',
			field: 'service',
			related_collection: 'services',
			meta: { one_field: null, one_deselect_action: 'nullify' },
			schema: { on_delete: 'SET NULL' },
		},
	});

	// 7. Layered tech junction collection — hidden.
	steps.push({
		kind: 'collection',
		target: 'stack_archetypes_tech',
		method: 'POST',
		path: '/collections',
		payload: {
			collection: 'stack_archetypes_tech',
			meta: {
				hidden: true,
				icon: 'import_export',
				note: 'Layered M2M junction stack_archetypes → tech_stack. layer drives the blueprint row.',
			},
			schema: {},
			fields: [
				autoincrementPkField(),
				{
					field: 'stack_archetypes_id',
					type: 'uuid',
					meta: { hidden: true },
					schema: {},
				},
				{
					field: 'tech_stack_id',
					type: 'string',
					meta: { hidden: true },
					schema: {},
				},
				{
					field: 'layer',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						options: { choices: LAYER_CHOICES },
						required: true,
						width: 'half',
					},
					schema: { is_nullable: false },
				},
				{
					field: 'sort',
					type: 'integer',
					meta: { interface: 'input', hidden: true },
					schema: {},
				},
			],
		},
	});

	// 8. Tech junction relations.
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes_tech.stack_archetypes_id',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes_tech',
			field: 'stack_archetypes_id',
			related_collection: 'stack_archetypes',
			meta: {
				one_field: 'tech',
				junction_field: 'tech_stack_id',
				sort_field: 'sort',
				one_deselect_action: 'nullify',
			},
			schema: { on_delete: 'CASCADE' },
		},
	});
	steps.push({
		kind: 'relation',
		target: 'stack_archetypes_tech.tech_stack_id',
		method: 'POST',
		path: '/relations',
		payload: {
			collection: 'stack_archetypes_tech',
			field: 'tech_stack_id',
			related_collection: 'tech_stack',
			meta: {
				one_field: null,
				junction_field: 'stack_archetypes_id',
				one_deselect_action: 'nullify',
			},
			schema: { on_delete: 'CASCADE' },
		},
	});

	// 9. tech alias field on the parent.
	steps.push({
		kind: 'field',
		target: 'stack_archetypes.tech',
		method: 'POST',
		path: '/fields/stack_archetypes',
		payload: {
			field: 'tech',
			type: 'alias',
			meta: {
				interface: 'list-m2m',
				special: ['m2m'],
				note: 'stack composition — layer drives the blueprint row',
			},
		},
	});

	// 10. tech_stack.layer — default blueprint layer for compose mode.
	steps.push({
		kind: 'field',
		target: 'tech_stack.layer',
		method: 'POST',
		path: '/fields/tech_stack',
		payload: {
			field: 'layer',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				options: { choices: LAYER_CHOICES },
				width: 'half',
				note: 'default blueprint layer — per-archetype links may override',
			},
			schema: { is_nullable: true },
		},
	});

	// 11. tech_stack_translations.enables — preview-slot caption copy.
	steps.push({
		kind: 'field',
		target: 'tech_stack_translations.enables',
		method: 'POST',
		path: '/fields/tech_stack_translations',
		payload: {
			field: 'enables',
			type: 'string',
			meta: {
				interface: 'input',
				note: "one sentence: what this tech enables, e.g. 'stores and queries your data reliably'",
			},
			schema: { is_nullable: true },
		},
	});

	// 12. Flow trigger — rebuild the site when archetypes publish/update.
	steps.push({
		kind: 'flow-trigger',
		target: 'stack_archetypes',
		method: 'PATCH',
		path: '/flows/:id',
		payload: {
			flowName: 'Vercel revalidate on publish',
			addCollection: 'stack_archetypes',
		},
	});

	// 13. Read permissions — public site + Build Bot for the export pipeline.
	const POLICY_GROUPS: readonly (readonly string[])[] = [
		['Public', '$t:public_label'],
		['Build Bot — content read'],
	];
	const NEW_COLLECTIONS = [
		'stack_archetypes',
		'stack_archetypes_translations',
		'stack_archetypes_tech',
	] as const;
	for (const policyNames of POLICY_GROUPS) {
		for (const collection of NEW_COLLECTIONS) {
			steps.push({
				kind: 'permission',
				target: `${policyNames[0]}:${collection}`,
				method: 'POST',
				path: '/permissions',
				payload: {
					collection,
					action: 'read',
					permissions: {},
					validation: null,
					presets: null,
					fields: ['*'],
				},
				policyNames,
			});
		}
	}

	return steps;
}

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	// --dry-run is the default; only an explicit --apply writes.
	return { apply: argv.includes('--apply') };
}

export function describeStep(step: SchemaStep): string {
	return `  ${step.kind.padEnd(12)} ${step.method.padEnd(5)} ${step.path.padEnd(32)} → ${step.target}`;
}

// --- Apply-time I/O ----------------------------------------------------------

const log = createLogger('setup-stack-archetypes');

async function applyFlowTrigger(ctx: ApplyContext, step: SchemaStep): Promise<void> {
	const { flowName, addCollection } = step.payload as {
		flowName: string;
		addCollection: string;
	};
	const flows = await rest(ctx, 'GET', '/flows?fields=id,name,options&limit=-1');
	if (flows.status >= 400) {
		throw new Error(`GET /flows failed (${flows.status}): ${JSON.stringify(flows.json)}`);
	}
	const flow = (flows.json?.data ?? []).find(
		(f: { name: string }) => f.name === flowName,
	);
	if (!flow) {
		throw new Error(`flow not found: '${flowName}' — cannot register ${addCollection}`);
	}
	const collections: string[] = flow.options?.collections ?? [];
	if (collections.includes(addCollection)) {
		log.info(`  skip flow-trigger — '${flowName}' already watches ${addCollection}`);
		return;
	}
	const patch = await rest(ctx, 'PATCH', `/flows/${flow.id}`, {
		options: { ...flow.options, collections: [...collections, addCollection] },
	});
	if (patch.status >= 400) {
		throw new Error(
			`PATCH /flows/${flow.id} failed (${patch.status}): ${JSON.stringify(patch.json)}`,
		);
	}
	log.info(`  ✓ flow-trigger — '${flowName}' now watches ${addCollection}`);
}

async function applyPermission(ctx: ApplyContext, step: SchemaStep): Promise<void> {
	const policies = await rest(ctx, 'GET', '/policies?fields=id,name&limit=-1');
	if (policies.status >= 400) {
		throw new Error(
			`GET /policies failed (${policies.status}): ${JSON.stringify(policies.json)}`,
		);
	}
	const names = step.policyNames ?? [];
	const policy = (policies.json?.data ?? []).find((p: { name: string }) =>
		names.includes(p.name),
	);
	if (!policy) {
		// Build Bot exists on prod only — a missing policy on this instance is a
		// skip, not a failure (the prod apply grants it there).
		log.info(`  skip permission — no policy named [${names.join(', ')}] on this instance`);
		return;
	}
	const payload = step.payload as { collection: string; action: string };
	const existing = await rest(
		ctx,
		'GET',
		`/permissions?limit=1&filter[policy][_eq]=${policy.id}` +
			`&filter[collection][_eq]=${payload.collection}&filter[action][_eq]=${payload.action}`,
	);
	if ((existing.json?.data ?? []).length > 0) {
		log.info(`  skip permission — ${policy.name} already reads ${payload.collection}`);
		return;
	}
	const post = await rest(ctx, 'POST', '/permissions', {
		...step.payload,
		policy: policy.id,
	});
	if (post.status >= 400) {
		throw new Error(
			`POST /permissions ${payload.collection} failed (${post.status}): ${JSON.stringify(post.json)}`,
		);
	}
	log.info(`  ✓ permission — ${policy.name} read ${payload.collection}`);
}

export async function applySchemaPlan(plan: SchemaStep[], ctx: ApplyContext): Promise<void> {
	for (const step of plan) {
		if (step.kind === 'flow-trigger') {
			await applyFlowTrigger(ctx, step);
			continue;
		}
		if (step.kind === 'permission') {
			await applyPermission(ctx, step);
			continue;
		}
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) {
			log.info(`  ✓ ${step.kind} — ${step.target}`);
			continue;
		}
		if (isAlreadyExists(res.status, res.json)) {
			log.info(`  skip ${step.kind} — ${step.target} already exists`);
			continue;
		}
		throw new Error(
			`${step.method} ${step.path} (${step.target}) failed (${res.status}): ${JSON.stringify(res.json)}`,
		);
	}
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildSchemaPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${plan.length} steps`);
	for (const step of plan) log.info(describeStep(step));

	if (!apply) {
		log.info('dry-run complete (no reads, no writes). Pass --apply to execute.');
		return;
	}

	const token = await getAdminToken(url);
	await applySchemaPlan(plan, { directusUrl: url, token });
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[setup-stack-archetypes] FAILED:', err);
		process.exit(1);
	});
}
