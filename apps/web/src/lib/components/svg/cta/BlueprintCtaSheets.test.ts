import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'src/lib/components/svg/cta');
const read = (name: string) => readFileSync(resolve(ROOT, name), 'utf8');

const sheets = [
	{
		file: 'BlueprintTransitRoute.svelte',
		viewBox: '0 0 600 200',
		motifs: [
			'sheet-frame',
			'twin-track',
			'sleepers',
			'turnout',
			'stop',
			'metro-station',
			'signal-gauge',
			'title-block',
		],
	},
	{
		file: 'BlueprintInterfaceSuite.svelte',
		viewBox: '0 0 840 520',
		motifs: [
			'sheet-frame',
			'website',
			'phone-app',
			'interface-panel',
			'chart-table',
			'dimensions',
			'title-block',
		],
	},
	{
		file: 'BlueprintDataPipeline.svelte',
		viewBox: '0 0 840 260',
		motifs: [
			'sheet-frame',
			'source',
			'transform',
			'store',
			'flow-connectors',
			'rail-datum',
			'callout',
			'title-block',
		],
	},
	{
		file: 'BlueprintCodeSystem.svelte',
		viewBox: '0 0 840 520',
		motifs: [
			'sheet-frame',
			'device-frame',
			'code-geometry',
			'window-controls',
			'system-nodes',
			'dimensions',
			'title-block',
		],
	},
] as const;

const auditedDashArrays = [
	'2 2',
	'2 4',
	'3 2',
	'3 3',
	'4 2',
	'4 3',
	'6 3',
	'6 4',
	'8 4',
	'8 3 2 3',
	'20 5 2 5',
];

describe('CTA blueprint sheet contracts', () => {
	it.each(sheets)('$file has its source-mapped sheet and motif contract', ({ file, viewBox, motifs }) => {
		const source = read(file);
		expect(source).toContain(`viewBox="${viewBox}"`);
		expect(source).toContain('preserveAspectRatio="xMidYMid meet"');
		expect(source).toContain('color="currentColor"');
		for (const motif of motifs) expect(source).toContain(`data-motif="${motif}"`);
	});

	it.each(sheets)('$file stays in the audited SVG dialect', ({ file }) => {
		const source = read(file);
		const svgMarkup = source.slice(source.indexOf('<svg'));
		expect(source).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
		expect(svgMarkup).not.toMatch(/<(mask|filter|foreignObject|image|script)\b/i);
		expect(source).not.toContain('{@html');
		expect(source).not.toMatch(/(?:href|xlink:href)="https?:/);
		expect(source).not.toMatch(/stroke-linecap="round"|stroke-linejoin="round"/);

		for (const dash of source.matchAll(/stroke-dasharray="([^"]+)"/g)) {
			expect(auditedDashArrays).toContain(dash[1]);
		}
		for (const width of source.matchAll(/stroke-width="([0-9.]+)"/g)) {
			expect(Number(width[1])).toBeGreaterThanOrEqual(0.2);
			expect(Number(width[1])).toBeLessThanOrEqual(3);
		}
		for (const radius of source.matchAll(/\brx="([0-9.]+)"/g)) {
			expect(Number(radius[1])).toBeLessThanOrEqual(12);
		}
	});

	it.each(sheets)('$file has unique local SVG ids', ({ file }) => {
		const source = read(file);
		const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
