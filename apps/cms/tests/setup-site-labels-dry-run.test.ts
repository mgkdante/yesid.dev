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
	it('translations collection carries the 122 label columns + pk/fks', () => {
		// go2/w4: +1 — ui_back_to_projects ("← All Projects" on /projects/[slug]).
		// go2/w5: +3, then taste-2 merges the two metro legend labels into ONE
		// ui_metro_caption ('STM métro + REM') — net +2: ui_metro_caption +
		// a11y_replay_intro (hero dot replay button aria). → 25 original.
		// slice-30 t1: +97 code-owned chrome columns (projects_/blog_/services_/
		// nav_/footer_/hero_) mirroring the companion + hero-data labels → 122.
		const fields = (plan[1].payload as { fields: { field: string }[] }).fields.map((f) => f.field);
		expect(fields.length).toBe(125); // id + site_labels_id + languages_code + 122
		for (const key of Object.keys(SITE_LABEL_SEEDS)) expect(fields).toContain(key);
		expect(fields).toContain('ui_back_to_projects');
		expect(fields).toContain('ui_metro_caption');
		expect(fields).toContain('a11y_replay_intro');
		expect(fields).not.toContain('ui_metro_legend_stm');
		expect(fields).not.toContain('ui_metro_legend_rem');
		// slice-30 t1 chrome columns — one representative per new group.
		expect(fields).toContain('projects_chrome_listing_heading');
		expect(fields).toContain('blog_chrome_listing_mobile_heading');
		expect(fields).toContain('services_chrome_detail_back_to_services_label');
		expect(fields).toContain('nav_chrome_shared_open_menu_aria');
		expect(fields).toContain('footer_chrome_footer_tagline');
		expect(fields).toContain('hero_dashboard_vehicles_label');
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
		expect(Object.keys(SITE_LABEL_SEEDS).length).toBe(122);
	});
	it('FR translations seed is a sparse subset of the EN columns', () => {
		// slice-30 t1: FR is a SEPARATE site_labels_translations row. Every FR key
		// must be a real EN column; the original a11y_/ui_/pages_/email_ FR lives
		// in the live CMS, so only the chrome groups carry FR in the fixture layer.
		const enKeys = new Set(Object.keys(SITE_LABEL_SEEDS));
		for (const key of Object.keys(SITE_LABEL_FR_SEEDS)) expect(enKeys.has(key)).toBe(true);
		expect(SITE_LABEL_FR_SEEDS.projects_chrome_meta_title).toBe('Projets | yesid.');
		expect(SITE_LABEL_FR_SEEDS.footer_chrome_footer_tagline).toBe('// infrastructure numérique');
		expect(SITE_LABEL_FR_SEEDS.hero_dashboard_vehicles_label).toBe('VÉHICULES SUIVIS');
		expect(Object.keys(SITE_LABEL_FR_SEEDS).length).toBe(97);
	});
	it('parseFlags dry-run default', () => {
		expect(parseFlags([])).toEqual({ apply: false, seed: false });
		expect(parseFlags(['--apply', '--seed'])).toEqual({ apply: true, seed: true });
	});
});
