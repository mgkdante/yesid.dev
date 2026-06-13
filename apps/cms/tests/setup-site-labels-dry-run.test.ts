import { describe, expect, it } from 'bun:test';
import { buildSiteLabelsPlan, SITE_LABEL_SEEDS, parseFlags } from '../scripts/setup-site-labels-and-chrome';

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
	it('translations collection carries the 25 label columns + pk/fks', () => {
		// go2/w4: +1 — ui_back_to_projects ("← All Projects" on /projects/[slug]).
		// go2/w5: +3, then taste-2 merges the two metro legend labels into ONE
		// ui_metro_caption ('STM métro + REM') — net +2: ui_metro_caption +
		// a11y_replay_intro (hero dot replay button aria).
		const fields = (plan[1].payload as { fields: { field: string }[] }).fields.map((f) => f.field);
		expect(fields.length).toBe(28); // id + site_labels_id + languages_code + 25
		for (const key of Object.keys(SITE_LABEL_SEEDS)) expect(fields).toContain(key);
		expect(fields).toContain('ui_back_to_projects');
		expect(fields).toContain('ui_metro_caption');
		expect(fields).toContain('a11y_replay_intro');
		expect(fields).not.toContain('ui_metro_legend_stm');
		expect(fields).not.toContain('ui_metro_legend_rem');
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
		expect(Object.keys(SITE_LABEL_SEEDS).length).toBe(25);
	});
	it('parseFlags dry-run default', () => {
		expect(parseFlags([])).toEqual({ apply: false, seed: false });
		expect(parseFlags(['--apply', '--seed'])).toEqual({ apply: true, seed: true });
	});
});
