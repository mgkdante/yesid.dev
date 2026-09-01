import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { closerContent } from '$lib/content/site-content';

const ROOT = process.cwd();
const REPOSITORY_ROOT = resolve(ROOT, '../..');
const FONT_ROOT = resolve(ROOT, 'vendor/fonts/lacquer');
const ART_ROOT = resolve(ROOT, 'static/svg/graffiti');

const phrases = [
	{ locale: 'en', phrase: 'THE END', letters: 'THEEND' },
	{ locale: 'fr', phrase: 'LA FIN', letters: 'LAFIN' },
	{ locale: 'es', phrase: 'FIN', letters: 'FIN' },
] as const;

describe('localized Lacquer graffiti assets', () => {
	it('publishes only the verified Lacquer provenance', () => {
		const notice = readFileSync(resolve(REPOSITORY_ROOT, 'THIRD_PARTY_NOTICES.md'), 'utf8');
		expect(notice).toContain('Lacquer');
		expect(notice).toContain('SIL Open Font License 1.1');
		expect(notice).not.toContain('Vecteezy');
		expect(closerContent.attribution).toEqual({
			text: {
				en: 'Lacquer typeface by Niki Polyocan and Eli Block',
				es: 'Tipografía Lacquer de Niki Polyocan y Eli Block',
				fr: 'Police Lacquer par Niki Polyocan et Eli Block',
			},
			url: 'https://fonts.google.com/specimen/Lacquer',
		});
	});

	it('rebuilds byte-identical SVGs from the pinned source', () => {
		const result = spawnSync('bun', ['scripts/build-graffiti.mjs', '--check'], {
			cwd: ROOT,
			encoding: 'utf8',
		});

		expect(result.status, result.stderr || result.stdout).toBe(0);
	});

	it('pins the official OFL source font used for the derived outlines', () => {
		const fontPath = resolve(FONT_ROOT, 'Lacquer-Regular.ttf');
		const licensePath = resolve(FONT_ROOT, 'OFL.txt');

		expect(existsSync(fontPath)).toBe(true);
		expect(existsSync(licensePath)).toBe(true);
		expect(createHash('sha256').update(readFileSync(fontPath)).digest('hex')).toBe(
			'140c21f71907a16952926ee354c81081092c90d599c89fe8b4557baeaebbbe83',
		);
		expect(readFileSync(licensePath, 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1');
	});

	it.each(phrases)('emits source-derived body and drip paths for $phrase', ({ locale, phrase, letters }) => {
		const path = resolve(ART_ROOT, `the-end.${locale}.svg`);
		expect(existsSync(path)).toBe(true);

		const document = new DOMParser().parseFromString(readFileSync(path, 'utf8'), 'image/svg+xml');
		expect(document.querySelector('parsererror')).toBeNull();
		const svg = document.documentElement;
		expect(svg.getAttribute('data-phrase')).toBe(phrase);
		expect([...svg.querySelectorAll('g[data-letter]')].map((group) => group.getAttribute('data-letter')).join('')).toBe(
			letters,
		);
		for (const group of svg.querySelectorAll('g[data-letter]')) {
			expect(group.querySelectorAll('path[data-part="body"]')).toHaveLength(1);
			expect(group.querySelectorAll('path[data-part="drip"]')).toHaveLength(1);
			expect(group.querySelector('path[data-part="body"]')?.getAttribute('d')).toBeTruthy();
			expect(group.querySelector('path[data-part="drip"]')?.getAttribute('d')).toBeTruthy();
			expect(group.querySelector('path[data-part="drip"]')?.getAttribute('data-origin-x')).toMatch(/^\d/);
			expect(group.querySelector('path[data-part="drip"]')?.getAttribute('data-origin-y')).toMatch(/^\d/);
		}
		expect(svg.querySelector('text, script, foreignObject, image, use')).toBeNull();
		expect([...svg.querySelectorAll('[href], [xlink\\:href], [onload], [onclick]')]).toHaveLength(0);
	});
});
