#!/usr/bin/env bun
/**
 * setup-conversion-batch-fields.ts
 *
 * Schema half of the conversion hardening batch (homework #19/#20/#21/#25 +
 * audit fixes). Creates the new translation columns the batch needs:
 *
 *   block_hero_translations.identity_line            hero identity kicker
 *   site_labels_translations.a11y_quiet_mode_label_collapsed
 *   site_labels_translations.blog_chrome_listing_no_posts_empty_message
 *   block_contact_content_translations.booking_prompt / booking_button_label
 *   block_contact_content_translations.info_section_label_languages / info_languages
 *   services_translations.seo_description             search-facing meta copy
 *
 * Also refreshes the stale field notes on the 5 existing quiet-mode columns
 * (their notes still embed the old "Quiet mode" defaults).
 *
 * DEV-ONLY. Dry-run by default; pass --apply to write schema.
 */

import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { type ApplyContext, type SchemaStep, isAlreadyExists, rest } from './lib/schema-apply';

const log = createLogger('conversion-batch-fields');

interface FieldSpec {
	collection: string;
	field: string;
	type?: 'string' | 'text';
	note: string;
	sort?: number;
	width?: 'half' | 'full';
}

const NEW_FIELDS: readonly FieldSpec[] = [
	{
		collection: 'block_hero_translations',
		field: 'identity_line',
		note: 'Hero identity kicker above the headline. Stored human-case; rendered ALL CAPS by CSS. Default: "freelance digital infrastructure - Montreal"',
		width: 'full',
	},
	{
		collection: 'site_labels_translations',
		field: 'a11y_quiet_mode_label_collapsed',
		note: 'Microcopy (go2-t1c). Group: a11y. Collapsed-state visible label of the collapse/expand-all control. Default: "Expand all"',
		sort: 145,
	},
	{
		collection: 'site_labels_translations',
		field: 'blog_chrome_listing_no_posts_empty_message',
		note: 'Microcopy. Group: blog. Blog listing empty state when no filters are active. Default: "Nothing here yet. New posts are in transit."',
		sort: 146,
	},
	{
		collection: 'block_hero_translations',
		field: 'sql_live_badge',
		note: 'SQL panel badge when REAL transit KPIs are on screen (sql_live_label holds the DEMO-state badge). Default: "LIVE"',
	},
	{
		collection: 'block_hero_translations',
		field: 'refresh_helper_live',
		note: 'Refresh helper when real KPIs are on screen. Default: "Refreshes metrics + query results from the live pipeline."',
		width: 'full',
	},
	{
		collection: 'site_labels_translations',
		field: 'hero_dashboard_vehicles_sub_live',
		note: 'Group: hero dashboard. Vehicles card sub-label when REAL KPIs are on screen (hero_dashboard_vehicles_sub holds the DEMO state). Default: "STM · LIVE"',
		sort: 157,
	},
	{
		collection: 'block_contact_content_translations',
		field: 'booking_prompt',
		note: 'Form terminal booking prompt above the booking link. Default: "Prefer to talk it through?"',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'booking_button_label',
		note: 'Form terminal booking link label; terminal command stays untranslated. Default: "book --intro-call →"',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'info_section_label_languages',
		note: 'Info terminal LANGUAGES section label. Default: "LANGUAGES"',
	},
	{
		collection: 'block_contact_content_translations',
		field: 'info_languages',
		note: 'Info terminal languages value. Adding a language later is one CMS edit (e.g. "EN · FR · ES"). Default: "EN · FR"',
	},
	{
		collection: 'services_translations',
		field: 'seo_description',
		type: 'text',
		note: 'Search-facing meta description (~155 chars: locality + tech + freelance). The on-page one-liner stays in description; this field only feeds <meta name="description">.',
	},
];

/** Stale notes on the 5 existing quiet-mode columns; values move to verb labels. */
const NOTE_PATCHES: ReadonlyArray<{ field: string; note: string }> = [
	{
		field: 'a11y_quiet_mode_label',
		note: 'Microcopy (go2-t1c). Group: a11y. Open-state visible label of the collapse/expand-all control. Default: "Collapse all"',
	},
	{
		field: 'a11y_quiet_mode_enable',
		note: 'Microcopy (go2-t1c). Group: a11y. Open-state tooltip. Default: "Collapse all sections on this page"',
	},
	{
		field: 'a11y_quiet_mode_disable',
		note: 'Microcopy (go2-t1c). Group: a11y. Collapsed-state tooltip. Default: "Expand all sections on this page"',
	},
	{
		field: 'a11y_quiet_mode_remember',
		note: 'Microcopy (go2-t1c). Group: a11y. Persist control, not-remembered state. Default: "Always start collapsed"',
	},
	{
		field: 'a11y_quiet_mode_forget',
		note: 'Microcopy (go2-t1c). Group: a11y. Persist control, remembered state. Default: "Don\'t start collapsed"',
	},
];

export function buildFieldPlan(): SchemaStep[] {
	return NEW_FIELDS.map((spec) => ({
		kind: 'field',
		target: `${spec.collection}.${spec.field}`,
		method: 'POST',
		path: `/fields/${spec.collection}`,
		payload: {
			field: spec.field,
			type: spec.type ?? 'string',
			meta: {
				interface: spec.type === 'text' ? 'input-multiline' : 'input',
				note: spec.note,
				width: spec.width ?? 'half',
				...(spec.sort === undefined ? {} : { sort: spec.sort }),
			},
			schema: { is_nullable: true },
		},
	}));
}

async function applyPlan(plan: readonly SchemaStep[], ctx: ApplyContext): Promise<void> {
	for (const step of plan) {
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) {
			log.info(`  ok ${step.kind} - ${step.target}`);
			continue;
		}
		if (isAlreadyExists(res.status, res.json)) {
			log.info(`  skip ${step.kind} - ${step.target} already exists`);
			continue;
		}
		throw new Error(`${step.method} ${step.path} (${step.target}) failed (${res.status}): ${JSON.stringify(res.json)}`);
	}
}

async function patchQuietModeNotes(ctx: ApplyContext): Promise<void> {
	for (const patch of NOTE_PATCHES) {
		const res = await rest(ctx, 'PATCH', `/fields/site_labels_translations/${patch.field}`, {
			meta: { note: patch.note },
		});
		if (res.status >= 400) {
			throw new Error(
				`PATCH /fields/site_labels_translations/${patch.field} failed (${res.status}): ${JSON.stringify(res.json)}`,
			);
		}
		log.info(`  ok note - site_labels_translations.${patch.field}`);
	}
}

async function main(): Promise<void> {
	const apply = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	assertDevCms(url);
	const plan = buildFieldPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);
	log.info(`plan: ${plan.length} new fields + ${NOTE_PATCHES.length} note refreshes`);
	for (const step of plan) log.info(`  field ${step.target}`);
	for (const patch of NOTE_PATCHES) log.info(`  note  site_labels_translations.${patch.field}`);
	if (!apply) {
		log.info('dry-run complete. Pass --apply to write schema.');
		return;
	}
	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	await applyPlan(plan, ctx);
	await patchQuietModeNotes(ctx);
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[conversion-batch-fields] FAILED:', error);
		process.exit(1);
	});
}
