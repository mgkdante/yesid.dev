/**
 * Flatten plan for the fixed-shape per-locale JSON columns (go2-t1b).
 *
 * Each entry maps ONE new flat column to the JSON path it replaces.
 * - scope 'translation': new column on the *_translations row; value copied
 *   from the SAME row's JSON column (per-locale, bare strings inside).
 * - scope 'parent': locale-invariant leaf; new column on the parent block
 *   row; value copied from the EN translation row's JSON column.
 *
 * Seeded entries (operator addendum + go2/w5): the 5 hero terminal templates
 * and the stack_explainer on block_tech_stack_page_content_translations have
 * NO JSON source — they are extracted from hardcoded /tech-stack component
 * strings. Each carries an EN `seed`; the migration writes the seed to the EN
 * row when the JSON dig misses. `{count}` stays a literal token — the
 * component interpolates it from data.items.length (computed, never stored).
 *
 * Consumed by: setup-block-flat-fields.ts (creates fields),
 * migrate-block-json-to-flat.ts (backfills + verifies), and the
 * flat-field-plan tests (locked counts / collision guard).
 */

export interface TranslationFlatField {
	scope: 'translation';
	collection: string;
	field: string;
	/** Directus column type. 'json' is used only for per-locale list columns (polaroids). */
	type: 'string' | 'text' | 'json';
	sourceField: string;
	/** Path inside the JSON value; [] copies the whole value. */
	sourcePath: readonly string[];
	/**
	 * EN seed for net-new columns with no JSON source (hardcoded component
	 * strings). Written to the EN row only, and only when the JSON dig misses.
	 */
	seed?: string;
}

export interface ParentFlatField {
	scope: 'parent';
	collection: string;
	field: string;
	type: 'string' | 'boolean' | 'json';
	/** Translations collection holding the source JSON (EN row wins). */
	translationsCollection: string;
	sourceField: string;
	sourcePath: readonly string[];
	/** Skip the write when the parent column already has a non-null value. */
	onlyIfNull?: boolean;
}

export type FlatField = TranslationFlatField | ParentFlatField;

/** Long-copy columns get `text` (input-multiline) instead of string(255). */
const TEXT_FIELDS = new Set([
	'identity_value_prop',
	'weather_hook',
	'meta_description',
	'form_command_output',
	'success_meanwhile',
]);

function t(
	collection: string,
	sourceField: string,
	map: Record<string, readonly string[]>,
): TranslationFlatField[] {
	return Object.entries(map).map(([field, sourcePath]) => ({
		scope: 'translation',
		collection,
		field,
		type: TEXT_FIELDS.has(field) ? 'text' : 'string',
		sourceField,
		sourcePath,
	}));
}

export const FLAT_FIELD_PLAN: readonly FlatField[] = [
	// ── block_hero_translations (12) ─────────────────────────────────────
	...t('block_hero_translations', 'headline', {
		headline_line1: ['line1'],
		headline_line2: ['line2'],
		headline_aria_suffix: ['ariaSuffix'],
	}),
	...t('block_hero_translations', 'sql_panel', {
		sql_prompt: ['prompt'],
		sql_live_label: ['liveLabel'],
		sql_col_route: ['columns', 'route'],
		sql_col_avg_delay: ['columns', 'avgDelayS'],
		sql_col_vehicles: ['columns', 'vehicles'],
		sql_meta_template: ['metaTemplate'],
	}),
	...t('block_hero_translations', 'refresh_button', {
		refresh_label: ['label'],
		refresh_helper: ['helper'],
	}),
	...t('block_hero_translations', 'hero_anim', { scroll_down: ['scrollDown'] }),

	// ── block_manifesto_translations (25) ────────────────────────────────
	...t('block_manifesto_translations', 'statement', {
		statement_line1: ['line1'],
		statement_line_huge: ['lineHuge'],
		statement_line3_part1: ['line3Part1'],
		statement_line3_highlight: ['line3Highlight'],
		statement_line3_part2: ['line3Part2'],
	}),
	...t('block_manifesto_translations', 'terminal', {
		terminal_user: ['user'],
		terminal_command: ['command'],
	}),
	...t('block_manifesto_translations', 'edge_left', {
		edge_left_section_number: ['sectionNumber'],
		edge_left_section_name: ['sectionName'],
		edge_left_location: ['location'],
	}),
	...t('block_manifesto_translations', 'edge_right', {
		edge_right_lat: ['lat'],
		edge_right_lng: ['lng'],
		edge_right_src: ['src'],
		edge_right_via: ['via'],
		edge_right_dst: ['dst'],
		edge_right_node: ['node'],
		edge_right_status: ['status'],
	}),
	...t('block_manifesto_translations', 'edge_bottom', {
		edge_bottom_connected: ['connected'],
		edge_bottom_line: ['line'],
		edge_bottom_url: ['url'],
		edge_bottom_version: ['version'],
		edge_bottom_scroll_hint: ['scrollHint'],
	}),
	...t('block_manifesto_translations', 'transit', {
		transit_arrival_label: ['arrivalLabel'],
		transit_platform_badge: ['platformBadge'],
		transit_direction_badge: ['directionBadge'],
	}),

	// ── block_closer_translations (18) ───────────────────────────────────
	...t('block_closer_translations', 'cta', { cta_label: ['label'] }),
	...t('block_closer_translations', 'attribution', { attribution_text: ['text'] }),
	...t('block_closer_translations', 'terminal', {
		terminal_title: ['title'],
		terminal_city: ['city'],
		terminal_encoding: ['encoding'],
		terminal_destinations_label: ['destinationsLabel'],
		terminal_prompt: ['prompt'],
	}),
	...t('block_closer_translations', 'rows', {
		rows_contact_label: ['contact', 'label'],
		rows_contact_description: ['contact', 'description'],
		rows_contact_action: ['contact', 'action'],
		rows_connect_label: ['connect', 'label'],
		rows_connect_description: ['connect', 'description'],
		rows_connect_action: ['connect', 'action'],
		rows_read_label: ['read', 'label'],
		rows_read_action: ['read', 'action'],
		rows_about_label: ['about', 'label'],
		rows_about_description: ['about', 'description'],
		rows_about_action: ['about', 'action'],
	}),

	// ── block_tech_stack_page_content_translations (19) ──────────────────
	...t('block_tech_stack_page_content_translations', 'meta', {
		meta_title: ['title'],
		meta_description: ['description'],
	}),
	...t('block_tech_stack_page_content_translations', 'hero', {
		hero_overline: ['overline'],
		hero_title_line1: ['titleLine1'],
		hero_title_line2: ['titleLine2'],
		hero_terminal_aria: ['terminalAria'],
		hero_stat_technologies: ['stats', 'technologies'],
	}),
	// Hero terminal line templates (operator addendum) — seeded, no JSON source.
	// sourcePath mirrors the recomposed output shape (hero.terminal.*); the
	// hero JSON has no `terminal` key, so the dig always misses and the EN
	// seed applies. {count} is interpolated by the component at render time.
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'terminal_cmd',
		type: 'string',
		sourceField: 'hero',
		sourcePath: ['terminal', 'cmd'],
		seed: '~ yesid --stack --verbose',
	},
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'terminal_loading',
		type: 'string',
		sourceField: 'hero',
		sourcePath: ['terminal', 'loading'],
		seed: '→ loading {count} nodes...',
	},
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'terminal_success',
		type: 'string',
		sourceField: 'hero',
		sourcePath: ['terminal', 'success'],
		seed: '✓ successful',
	},
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'terminal_cataloged',
		type: 'string',
		sourceField: 'hero',
		sourcePath: ['terminal', 'cataloged'],
		seed: '→ {count} technologies cataloged',
	},
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'terminal_status',
		type: 'string',
		sourceField: 'hero',
		sourcePath: ['terminal', 'status'],
		seed: 'interactive map online.',
	},
	// "What is a stack?" explainer (go2/w5 engine-layered-learning) — seeded,
	// same precedent as the terminal templates: the hero JSON has no
	// `stackExplainer` key, so the dig always misses and the EN seed applies.
	// type 'text' → setup script emits input-multiline, width full.
	{
		scope: 'translation',
		collection: 'block_tech_stack_page_content_translations',
		field: 'stack_explainer',
		type: 'text',
		sourceField: 'hero',
		sourcePath: ['stackExplainer'],
		seed: 'A "stack" is just the parts list of a piece of software: the interface people touch, the logic that decides things, the data it remembers, and the infrastructure it runs on. That\'s the whole secret. Once you can read a stack, a quote can\'t hide much from you — poke the blueprints below and see for yourself.',
	},
	...t('block_tech_stack_page_content_translations', 'actions', {
		action_get_in_touch: ['getInTouch'],
		action_view_services: ['viewServices'],
	}),
	...t('block_tech_stack_page_content_translations', 'cta', {
		cta_heading_line1: ['headingLine1'],
		cta_heading_line2: ['headingLine2'],
		cta_sub: ['sub'],
		cta_availability: ['availability'],
	}),

	// ── block_contact_content_translations (21) ──────────────────────────
	...t('block_contact_content_translations', 'meta', {
		meta_title: ['title'],
		meta_description: ['description'],
	}),
	...t('block_contact_content_translations', 'info_terminal', {
		info_location: ['location'],
		info_response_time: ['responseTime'],
		info_section_label_location: ['sectionLabels', 'location'],
		info_section_label_connect: ['sectionLabels', 'connect'],
	}),
	...t('block_contact_content_translations', 'form_terminal', {
		form_command_output: ['commandOutput'],
		form_submit_label: ['submitLabel'],
		form_field_name_placeholder: ['fields', 'name', 'placeholder'],
		form_field_email_placeholder: ['fields', 'email', 'placeholder'],
		form_field_message_placeholder: ['fields', 'message', 'placeholder'],
	}),
	...t('block_contact_content_translations', 'validation', {
		validation_required: ['required'],
		validation_invalid_email: ['invalidEmail'],
		validation_error_summary: ['errorSummary'],
	}),
	...t('block_contact_content_translations', 'success', {
		success_validating: ['validating'],
		success_sending: ['sending'],
		success_sent: ['sent'],
		success_response_time: ['responseTime'],
		success_meanwhile: ['meanwhile'],
		success_reset_label: ['resetLabel'],
		success_field_ok: ['fieldOk'],
	}),

	// ── block_about_content_translations (27) ────────────────────────────
	...t('block_about_content_translations', 'identity', {
		identity_name: ['name'],
		identity_title: ['title'],
		identity_value_prop: ['valueProp'],
	}),
	{
		scope: 'translation',
		collection: 'block_about_content_translations',
		field: 'polaroids',
		type: 'json',
		sourceField: 'identity',
		sourcePath: ['polaroids'],
	},
	...t('block_about_content_translations', 'weather', {
		weather_city: ['city'],
		weather_hook: ['hook'],
	}),
	...t('block_about_content_translations', 'cta', {
		cta_button_label: ['buttonLabel'],
		cta_availability: ['availability'],
	}),
	...t('block_about_content_translations', 'stop_labels', {
		stop_identity: ['identity'],
		stop_metrics: ['metrics'],
		stop_testimonials: ['testimonials'],
		stop_process: ['process'],
		stop_stack: ['stack'],
		stop_clients: ['clients'],
		stop_interests: ['interests'],
		stop_snapshots: ['snapshots'],
		stop_location: ['location'],
		stop_next: ['next'],
	}),
	...t('block_about_content_translations', 'labels', {
		label_clients_served: ['clientsServed'],
		label_polaroid_prev_aria: ['polaroidPrevAria'],
		label_polaroid_next_aria: ['polaroidNextAria'],
		label_testimonials_carousel_aria: ['testimonialsCarouselAria'],
		label_testimonials_tab_nav_aria: ['testimonialsTabNavAria'],
		label_testimonial_slide_aria: ['testimonialSlideAria'],
		label_show_testimonial_aria: ['showTestimonialAria'],
	}),
	...t('block_about_content_translations', 'meta', {
		meta_title: ['title'],
		meta_description: ['description'],
	}),

	// ── block_about_intro_translations (2) ───────────────────────────────
	...t('block_about_intro_translations', 'location', {
		location_city: ['city'],
		location_region: ['region'],
	}),

	// ── parent scalar moves (13) ─────────────────────────────────────────
	// contact (7) — terminal chrome is locale-invariant plain strings in the schema
	{ scope: 'parent', collection: 'block_contact_content', field: 'info_terminal_title', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'info_terminal', sourcePath: ['title'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'info_terminal_command', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'info_terminal', sourcePath: ['command'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'form_terminal_title', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'form_terminal', sourcePath: ['title'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'form_terminal_command', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'form_terminal', sourcePath: ['command'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'form_field_name_label', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'form_terminal', sourcePath: ['fields', 'name', 'label'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'form_field_email_label', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'form_terminal', sourcePath: ['fields', 'email', 'label'] },
	{ scope: 'parent', collection: 'block_contact_content', field: 'form_field_message_label', type: 'string', translationsCollection: 'block_contact_content_translations', sourceField: 'form_terminal', sourcePath: ['fields', 'message', 'label'] },
	// about (6)
	{ scope: 'parent', collection: 'block_about_content', field: 'headshot', type: 'string', translationsCollection: 'block_about_content_translations', sourceField: 'identity', sourcePath: ['headshot'] },
	{ scope: 'parent', collection: 'block_about_content', field: 'weather_enabled', type: 'boolean', translationsCollection: 'block_about_content_translations', sourceField: 'weather', sourcePath: ['enabled'] },
	{ scope: 'parent', collection: 'block_about_content', field: 'cta_command', type: 'string', translationsCollection: 'block_about_content_translations', sourceField: 'cta', sourcePath: ['command'] },
	{ scope: 'parent', collection: 'block_about_content', field: 'cta_button_href', type: 'string', translationsCollection: 'block_about_content_translations', sourceField: 'cta', sourcePath: ['buttonHref'] },
	{ scope: 'parent', collection: 'block_about_content', field: 'cta_lines', type: 'json', translationsCollection: 'block_about_content_translations', sourceField: 'cta', sourcePath: ['lines'] },
	{ scope: 'parent', collection: 'block_about_content', field: 'cta_socials', type: 'json', translationsCollection: 'block_about_content_translations', sourceField: 'cta', sourcePath: ['socials'] },
] as const;

export function translationFieldsFor(collection: string): TranslationFlatField[] {
	return FLAT_FIELD_PLAN.filter(
		(f): f is TranslationFlatField => f.scope === 'translation' && f.collection === collection,
	);
}

export function parentFieldsFor(collection: string): ParentFlatField[] {
	return FLAT_FIELD_PLAN.filter(
		(f): f is ParentFlatField => f.scope === 'parent' && f.collection === collection,
	);
}

export function digPath(value: unknown, path: readonly string[]): unknown {
	let cur: unknown = value;
	for (const key of path) {
		if (cur === null || typeof cur !== 'object') return undefined;
		cur = (cur as Record<string, unknown>)[key];
	}
	return cur;
}
