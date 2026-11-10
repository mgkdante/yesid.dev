import { ProjectSchema } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { ogFontFiles } from '@yesid/seo-kit/og/files';
import { OG_CTA_TONES, buildOgCardSvg, escapeXml, type OgCard } from './card';
import { inlinedOgFontFiles } from './font-files';
import { createOgCardRenderer } from './render';
import { Resvg } from '@resvg/resvg-js';

const ORANGE = '#E07800';
const renderer = createOgCardRenderer(ogFontFiles);
const card = (overrides: Partial<OgCard> = {}): OgCard => ({
	eyebrow: 'BLOG',
	title: 'Thinking in matrices',
	cta: 'Read the article',
	ctaTone: 'action',
	...overrides,
});
const pixels = (svg: string) =>
	new Resvg(svg, {
		font: { fontFiles: [...ogFontFiles], loadSystemFonts: false, defaultFontFamily: 'Inter' },
	}).render();
const rgbAt = (image: ReturnType<typeof pixels>, x: number, y: number) => {
	const offset = (Math.round(y) * image.width + Math.round(x)) * 4;
	return `#${[...image.pixels.subarray(offset, offset + 3)].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
};

describe('share card', () => {
	it.each([
		['no closing mark', 'Thinking in matrices'],
		['its own period', 'Thinking in matrices.'],
	])('draws one orange dot beside a title with %s', (_label, title) => {
		const svg = renderer.svg(card({ title }));
		const dots = [...svg.matchAll(/<circle data-title-dot="1" cx="([\d.]+)" cy="([\d.]+)" r="[\d.]+" fill="([^"]+)"/g)];
		expect(dots).toHaveLength(1);
		expect(dots[0]![3]).toBe(ORANGE);
		expect(svg).not.toContain('matrices.<');
		const image = pixels(svg);
		expect(rgbAt(image, Number(dots[0]![1]), Number(dots[0]![2]))).toBe(ORANGE);
	});

	it('turns a closing question mark orange instead of adding a dot', () => {
		const svg = renderer.svg(card({ title: 'Does your website need instant publishing?' }));
		expect(svg).not.toContain('data-title-dot');
		expect(svg).toContain(`<tspan fill="${ORANGE}">?</tspan>`);
	});

	it('shows the call to action on the tone that matches where it leads', () => {
		const action = renderer.svg(card({ ctaTone: 'action' }));
		const conversion = renderer.svg(card({ cta: 'Book a call', ctaTone: 'conversion' }));
		expect(action).toContain('Read the article');
		expect(action).toContain(`data-cta="1" fill="${OG_CTA_TONES.action}"`);
		expect(conversion).toContain('Book a call');
		expect(conversion).toContain(`data-cta="1" fill="${OG_CTA_TONES.conversion}"`);
	});

	it('escapes copy that would break the SVG', () => {
		const svg = renderer.svg(card({ title: 'R&D <now>', subtitle: 'A & B' }));
		expect(svg).toContain('R&amp;D &lt;now&gt;');
		expect(svg).toContain('A &amp; B');
	});

	it('keeps a dot-only title visible and drops characters XML cannot carry', () => {
		const onlyMark = renderer.svg(card({ title: '...' }));
		expect(onlyMark).toContain('>...<');
		expect(() => pixels(renderer.svg(card({ title: 'Bad \u0001 title', subtitle: 'Also \u0008 bad' })))).not.toThrow();
	});

	it('renders with the fonts the prerender route writes to disk', () => {
		const files = inlinedOgFontFiles();
		expect(files).toHaveLength(3);
		const fromDisk = createOgCardRenderer(files);
		expect(fromDisk.measure('Transit', { family: 'Inter', weight: 900 })).toBeGreaterThan(0);
		expect(fromDisk.png(card()).byteLength).toBeGreaterThan(1_000);
		expect(inlinedOgFontFiles()).toBe(files);
	});

	it('renders a full CMS summary near the description limit without cutting sentences', () => {
		const subtitle = 'This project brings together complete information for people making decisions about their daily work. It keeps the useful context available in one place and explains the limits of the published results.';
		const svg = renderer.svg(card({ title: 'CMS project', subtitle, fullSubtitle: true }));
		const text = Array.from(svg.matchAll(/<text[^>]*>(.*?)<\/text>/g), (match) => match[1]).join(' ');
		expect(text).toContain(subtitle);
		expect(renderer.png(card({ title: 'CMS project', subtitle, fullSubtitle: true })).byteLength).toBeLessThan(150_000);
	});

	it.each(['One\nlook\nfor\nevery\nsite.', 'W'.repeat(200), 'Wide words '.repeat(18).trim()])('renders the complete normalized CMS line: %s', (subtitle) => {
		const svg = renderer.svg(card({ title: 'CMS project', subtitle, fullSubtitle: true }));
		const text = Array.from(svg.matchAll(/<text[^>]*>(.*?)<\/text>/g), (match) => match[1]).join(' ');
		expect(text.replaceAll(' ', '')).toContain(subtitle.replace(/\s+/gu, ''));
		expect(svg).not.toContain('…');
	});

	it.each([
		Array(6).fill('W'.repeat(32)).join(' '),
		Array(6).fill('W'.repeat(32)).join(' ') + ' WW',
		'WM'.repeat(100),
		Array(12).fill('MWMWMWMWMWMWMWM').join(' '),
		Array(20).fill('éÉàçüñWWW').join(' '),
		'https://example.com/' + 'WideWW/path?key=value&'.repeat(8),
	])('renders accepted adversarial one-liners fully within bounds: %s', (input) => {
		const subtitle = ProjectSchema.shape.oneLiner.parse({ en: input }).en;
		const fromDisk = createOgCardRenderer(inlinedOgFontFiles());
		const svg = fromDisk.svg(card({ title: 'CMS project', subtitle, fullSubtitle: true }));
		const lines = [...svg.matchAll(/<text[^>]*font-weight="500"[^>]*fill="[^"]+">.*?<\/text>/g)]
			.filter(([text]) => text.includes('font-family="Inter"'));
		const content = lines.map(([text]) => />(.*?)<\/text>/.exec(text)![1]);
		// Line breaks may occur inside words; no character may be lost or added.
		expect(content.join('').replace(/\s/gu, '')).toBe(escapeXml(subtitle).replace(/\s/gu, ''));
		for (const [text] of lines) {
			const size = Number(/font-size="([\d.]+)"/.exec(text)![1]);
			expect(size).toBeGreaterThanOrEqual(18);
			const box = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">${text}</svg>`, {
				font: { fontFiles: [...inlinedOgFontFiles()], loadSystemFonts: false },
			}).getBBox()!;
			expect(box.x).toBeGreaterThanOrEqual(80);
			expect(box.x + box.width).toBeLessThanOrEqual(1120);
			expect(box.y).toBeGreaterThanOrEqual(146);
			expect(box.y + box.height).toBeLessThanOrEqual(448);
		}
		expect(fromDisk.png(card({ title: 'CMS project', subtitle, fullSubtitle: true })).byteLength).toBeGreaterThan(1000);
	}, 30_000);

	it('honours a manual line break in code-owned titles', () => {
		const svg = renderer.svg(card({ title: 'Websites &\nOnline Stores' }));
		expect(svg).toContain('>Websites &amp;<');
		expect(svg).toContain('>Online Stores<');
	});

	it.each([
		['the longest real title', 'What can move forward before the product catalogue is final?'],
		['a long French title', 'Accéléré par l’IA, piloté par l’humain : mon vrai flux de travail'],
		['an absurdly long title', 'word '.repeat(60).trim()],
		['a very long unbroken word', 'Internationalization-and-localization-considerations'],
		['an unbroken word too long for any size', 'x'.repeat(200)],
	])('keeps %s inside the margins and the size budget', (_label, title) => {
		const svg = renderer.svg(
			card({ title, subtitle: 'Live bus positions and reliability history for Montréal and Ottawa, measured every single day.' }),
		);
		const image = pixels(svg);
		expect([image.width, image.height]).toEqual([1200, 630]);
		// Everything but the faint grid stays dark in the side margins.
		for (let y = 0; y < 630; y += 3) {
			for (const x of [40, 60, 1140, 1160]) {
				const [r, g, b] = rgbAt(image, x, y).slice(1).match(/../g)!.map((hex) => parseInt(hex, 16));
				expect(Math.max(r!, g!, b!), `pixel ${x},${y}`).toBeLessThan(60);
			}
		}
		expect(image.asPng().byteLength).toBeLessThan(150_000);
		// Long titles take many real font measurements, which is slow on a busy machine.
	}, 30_000);

	it('keeps titles beside art clear of the art column', () => {
		const title = 'Sites web et\nboutiques en ligne';
		const measure = (text: string) => text.length * 0.6;
		const narrow = buildOgCardSvg(card({ title, art: { svg: '<g data-art/>', contentWidth: 620 } }), measure);
		const wide = buildOgCardSvg(card({ title }), measure);
		const size = (svg: string) => Number(/font-weight="900" font-size="(\d+)"/.exec(svg)![1]);
		expect(narrow).toContain('<g data-art/>');
		expect(size(narrow)).toBeLessThan(size(wide));
	});
});
