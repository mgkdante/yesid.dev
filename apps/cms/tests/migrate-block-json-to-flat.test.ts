import { describe, expect, it } from 'bun:test';
import {
	buildTranslationPatch,
	buildParentPatch,
} from '../scripts/migrate-block-json-to-flat';

describe('buildTranslationPatch', () => {
	it('flattens hero JSON columns for any locale row', () => {
		const frRow = {
			id: 2,
			languages_code: 'fr',
			headline: { line1: 'NE CASSEZ', line2: 'PAS', ariaSuffix: 'la prod' },
			sql_panel: null,
			refresh_button: { label: 'rafraîchir', helper: '' },
			hero_anim: { scrollDown: 'défiler' },
		};
		const patch = buildTranslationPatch('block_hero_translations', frRow);
		expect(patch).toEqual({
			headline_line1: 'NE CASSEZ',
			headline_line2: 'PAS',
			headline_aria_suffix: 'la prod',
			refresh_label: 'rafraîchir',
			scroll_down: 'défiler',
		}); // sql_panel null → skipped; empty helper → skipped
	});
	it('copies the polaroids array whole per locale', () => {
		const row = {
			id: 1,
			languages_code: 'en',
			identity: { name: 'Yesid', polaroids: [{ src: 'a.jpg', alt: 'A', caption: 'cap', rotate: -2 }] },
		};
		const patch = buildTranslationPatch('block_about_content_translations', row);
		expect(patch.identity_name).toBe('Yesid');
		expect(patch.polaroids).toEqual([{ src: 'a.jpg', alt: 'A', caption: 'cap', rotate: -2 }]);
	});
	it('seeds the hero terminal templates on the EN row only (operator addendum)', () => {
		const enRow = {
			id: 1,
			languages_code: 'en',
			hero: { overline: 'Infrastructure Map', stats: { technologies: 'technologies' } },
		};
		const patch = buildTranslationPatch('block_tech_stack_page_content_translations', enRow);
		expect(patch.hero_overline).toBe('Infrastructure Map');
		expect(patch.hero_stat_technologies).toBe('technologies');
		expect(patch.terminal_cmd).toBe('~ yesid --stack --verbose');
		expect(patch.terminal_loading).toBe('→ loading {count} nodes...');
		expect(patch.terminal_success).toBe('✓ successful');
		expect(patch.terminal_cataloged).toBe('→ {count} technologies cataloged');
		expect(patch.terminal_status).toBe('interactive map online.');

		// Non-EN rows do NOT receive the EN seeds.
		const frRow = { id: 2, languages_code: 'fr', hero: { overline: 'Carte' } };
		const frPatch = buildTranslationPatch('block_tech_stack_page_content_translations', frRow);
		expect(frPatch.hero_overline).toBe('Carte');
		expect(frPatch.terminal_cmd).toBeUndefined();
	});
});

describe('buildParentPatch', () => {
	it('pulls locale-invariant leaves from the EN row, keeps booleans/arrays', () => {
		const enRow = {
			id: 1,
			languages_code: 'en',
			weather: { city: 'Montreal', enabled: false },
			identity: { headshot: '/img/yo.jpg' },
			cta: { command: 'whoami', buttonHref: '/contact', lines: [{ text: 'hi', color: 'muted' }], socials: [] },
		};
		const patch = buildParentPatch('block_about_content', enRow, {});
		expect(patch.weather_enabled).toBe(false);
		expect(patch.headshot).toBe('/img/yo.jpg');
		expect(patch.cta_command).toBe('whoami');
		expect(patch.cta_lines).toEqual([{ text: 'hi', color: 'muted' }]);
		expect(patch.cta_socials).toEqual([]);
	});
	it('onlyIfNull steps respect an existing parent value', () => {
		const enRow = { id: 1, languages_code: 'en', cta: { href: '/json-href' } };
		const patch = buildParentPatch('block_closer', enRow, { cta_href: '/contact' });
		expect(patch.cta_href).toBeUndefined();
		const patch2 = buildParentPatch('block_closer', enRow, { cta_href: null });
		expect(patch2.cta_href).toBe('/json-href');
	});
});
