import { describe, expect, it } from 'bun:test';
import {
	buildSiteLabelsPlan,
	SITE_LABEL_SEEDS,
	SITE_LABEL_FR_SEEDS,
	parseFlags,
} from '../scripts/setup-site-labels-and-chrome';

describe('setup-site-labels-and-chrome plan', () => {
	const plan = buildSiteLabelsPlan();
	it('creates site_labels (singleton) then site_labels_translations then relations', () => {
		const kinds = plan.map((s) => `${s.kind}:${s.target}`);
		expect(kinds[0]).toBe('collection:site_labels');
		expect(kinds[1]).toBe('collection:site_labels_translations');
		expect(plan.filter((s) => s.kind === 'relation').length).toBe(2);
	});
	it('site_labels is a singleton grouped under site_config', () => {
		const meta = (plan[0].payload as { meta: Record<string, unknown> }).meta;
		expect(meta.singleton).toBe(true);
		expect(meta.group).toBe('site_config');
	});
	it('emits the 132 label columns as standalone POST /fields steps (not inline in the collection)', () => {
		// The collection-create carries only structural fields (pk + 2 fks); each
		// label column is a SEPARATE field step so new chrome columns are added to
		// the ALREADY-EXISTING translations collection (the inline collection POST
		// is skipped once it exists — that bug is why the chrome never persisted).
		// slice-30 t1: 25 base + 97 chrome = 122; +10 go2 FR-leak fields = 132.
		const collFields = (plan[1].payload as { fields: { field: string }[] }).fields.map((f) => f.field);
		expect(collFields).toEqual(['id', 'site_labels_id', 'languages_code']);
		const colNames = plan
			.filter((s) => s.kind === 'field' && s.path === '/fields/site_labels_translations')
			.map((s) => (s.payload as { field: string }).field);
		expect(colNames.length).toBe(132);
		for (const key of Object.keys(SITE_LABEL_SEEDS)) expect(colNames).toContain(key);
		expect(colNames).toContain('ui_back_to_projects');
		expect(colNames).toContain('ui_metro_caption');
		expect(colNames).toContain('a11y_replay_intro');
		expect(colNames).not.toContain('ui_metro_legend_stm');
		expect(colNames).not.toContain('ui_metro_legend_rem');
		// slice-30 t1 chrome columns — one representative per new group.
		expect(colNames).toContain('projects_chrome_listing_heading');
		expect(colNames).toContain('blog_chrome_listing_mobile_heading');
		expect(colNames).toContain('services_chrome_detail_back_to_services_label');
		expect(colNames).toContain('nav_chrome_shared_open_menu_aria');
		expect(colNames).toContain('footer_chrome_footer_tagline');
		expect(colNames).toContain('hero_dashboard_vehicles_label');
	});
	it('adds heading + empty_state to block_projects_page_content_translations', () => {
		const chrome = plan.filter((s) => s.kind === 'field' && s.path === '/fields/block_projects_page_content_translations');
		expect(chrome.map((s) => (s.payload as { field: string }).field).sort()).toEqual(['empty_state', 'heading']);
	});
	it('grants Build Bot read + Human Editor CRUD on both new collections', () => {
		const perms = plan.filter((s) => s.kind === 'permission');
		const buildBotReads = perms.filter((s) => s.policyNames?.includes('Build Bot — content read'));
		expect(buildBotReads.length).toBe(2); // read on site_labels + site_labels_translations
		const editorPerms = perms.filter((s) => s.policyNames?.includes('Human Editor'));
		expect(editorPerms.length).toBe(8); // CRUD × 2 collections
	});
	it('seeds are exactly the fixture', () => {
		expect(SITE_LABEL_SEEDS.ui_copyright_template).toBe('© {year} yesid');
		expect(SITE_LABEL_SEEDS.ui_back_to_projects).toBe('← All Projects');
		// taste-2: caption stays operator-cased; the web caption uppercases via CSS.
		expect(SITE_LABEL_SEEDS.ui_metro_caption).toBe('STM métro + REM');
		expect(SITE_LABEL_SEEDS.a11y_replay_intro).toBe('Replay intro');
		// slice-30 t1: chrome seeds copied VERBATIM from the companion/hero-data .ts.
		expect(SITE_LABEL_SEEDS.projects_chrome_meta_title).toBe('Projects | yesid.');
		expect(SITE_LABEL_SEEDS.blog_chrome_listing_mobile_heading).toBe('Blog');
		expect(SITE_LABEL_SEEDS.footer_chrome_footer_tagline).toBe('// digital infrastructure');
		expect(SITE_LABEL_SEEDS.hero_dashboard_vehicles_label).toBe('VEHICLES TRACKED');
		expect(Object.keys(SITE_LABEL_SEEDS).length).toBe(132);
	});
	it('FR translations seed covers every EN column (complete after t1 reconciliation)', () => {
		// slice-30 t1: FR is a SEPARATE site_labels_translations row. The base
		// a11y_/ui_/pages_/email_ FR was assumed to already live in the CMS, but it
		// was NULL there — so the fixture now carries the FULL FR for every EN
		// column. A regen then reproduces the committed site-labels.ts byte-for-byte.
		const enKeys = new Set(Object.keys(SITE_LABEL_SEEDS));
		for (const key of Object.keys(SITE_LABEL_FR_SEEDS)) expect(enKeys.has(key)).toBe(true);
		expect(SITE_LABEL_FR_SEEDS.projects_chrome_meta_title).toBe('Projets | yesid.');
		expect(SITE_LABEL_FR_SEEDS.footer_chrome_footer_tagline).toBe('// infrastructure numérique');
		expect(SITE_LABEL_FR_SEEDS.hero_dashboard_vehicles_label).toBe('VÉHICULES SUIVIS');
		expect(SITE_LABEL_FR_SEEDS.a11y_replay_intro).toBe("Rejouer l'intro");
		expect(Object.keys(SITE_LABEL_FR_SEEDS).length).toBe(132);
	});
	it('parseFlags dry-run default', () => {
		expect(parseFlags([])).toEqual({ apply: false, seed: false });
		expect(parseFlags(['--apply', '--seed'])).toEqual({ apply: true, seed: true });
	});
});
