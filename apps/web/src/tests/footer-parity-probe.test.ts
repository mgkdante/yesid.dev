import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
	buildVercelBypassHeaders,
	buildScenarioMatrix,
	compareRgba,
	compareRects,
	findSystemDateMatch,
	findSystemDateNodeMatch,
	parseCliArgs,
	rasterizeCssRect,
	summarizeComparisons,
	validateCaptureArtifact,
} from '../../scripts/footer-parity-probe.mjs';

function image(width: number, height: number, pixels: number[]) {
	return { width, height, pixels: Uint8Array.from(pixels) };
}

function pngChunk(type: string, data: Buffer) {
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length);
	return Buffer.concat([length, Buffer.from(type), data, Buffer.alloc(4)]);
}

const pngHeader = Buffer.alloc(13);
pngHeader.writeUInt32BE(1, 0);
pngHeader.writeUInt32BE(1, 4);
pngHeader.set([8, 6, 0, 0, 0], 8);
const ONE_PIXEL_PNG = Buffer.concat([
	Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
	pngChunk('IHDR', pngHeader),
	pngChunk('IDAT', deflateSync(Buffer.from([0, 12, 34, 56, 255]))),
	pngChunk('IEND', Buffer.alloc(0)),
]);

function cssRect(left = 0, top = 0, width = 1, height = 1) {
	return {
		left,
		top,
		right: left + width,
		bottom: top + height,
		width,
		height,
	};
}

function baselineCapture() {
	const scenario = buildScenarioMatrix()[0];
	const mask = { left: 0, top: 0, right: 1, bottom: 1 };
	return {
		scenario,
		capture: {
			...scenario,
			url: 'https://main.example.test/',
			screenshot: {
				file: `${scenario.id}.png`,
				sha256: createHash('sha256').update(ONE_PIXEL_PNG).digest('hex'),
				widthPx: 1,
				heightPx: 1,
				pixelCount: 1,
			},
			rectsCss: {
				footer: cssRect(),
				hazard: cssRect(),
				grid: cssRect(),
				statusBar: cssRect(),
				wordmark: cssRect(),
				legalNav: cssRect(),
				groupLabels: [cssRect()],
				links: [cssRect()],
			},
			masksCss: {
				systemDate: cssRect(),
				statusDot: cssRect(),
			},
			masksPx: {
				systemDate: mask,
				statusDot: mask,
			},
			maskedPixels: 1,
			unmaskedPixels: 0,
		},
	};
}

describe('footer parity probe contract', () => {
	it('parses the frozen two-run baseline and candidate commands', () => {
		expect(
			parseCliArgs([
				'baseline',
				'--url',
				'https://main.example.test/path',
				'--out',
				'/tmp/footer-main',
			]),
		).toEqual({
			mode: 'baseline',
			origin: 'https://main.example.test',
			outDir: '/tmp/footer-main',
		});

		expect(
			parseCliArgs([
				'candidate',
				'--url',
				'https://pr.example.test/',
				'--baseline',
				'/tmp/footer-main',
				'--out',
				'/tmp/footer-pr',
			]),
		).toEqual({
			mode: 'candidate',
			origin: 'https://pr.example.test',
			baselineDir: '/tmp/footer-main',
			outDir: '/tmp/footer-pr',
		});
	});

	it('rejects incomplete, unsafe, or destructive command arguments', () => {
		expect(() => parseCliArgs([])).toThrow(/baseline|candidate/);
		expect(() =>
			parseCliArgs(['baseline', '--url', 'file:///tmp/site', '--out', '/tmp/footer-main']),
		).toThrow(/http or https/);
		expect(() =>
			parseCliArgs([
				'candidate',
				'--url',
				'https://pr.example.test',
				'--out',
				'/tmp/footer-pr',
			]),
		).toThrow(/--baseline/);
		expect(() =>
			parseCliArgs([
				'candidate',
				'--url',
				'https://pr.example.test',
				'--baseline',
				'/tmp/footer-main',
				'--out',
				'/tmp/footer-main',
			]),
		).toThrow(/must differ/);
	});

	it('locks the 7 widths by 2 themes by 2 navigation states matrix', () => {
		const matrix = buildScenarioMatrix();

		expect(matrix).toHaveLength(28);
		expect([...new Set(matrix.map(({ width }) => width))]).toEqual([
			639, 640, 767, 768, 1023, 1024, 1280,
		]);
		expect([...new Set(matrix.map(({ theme }) => theme))]).toEqual(['dark', 'light']);
		expect([...new Set(matrix.map(({ capture }) => capture))]).toEqual([
			'en-initial',
			'fr-after-navigation',
		]);
		expect(matrix[0]).toEqual({
			id: 'w0639-dark-en-initial',
			width: 639,
			theme: 'dark',
			capture: 'en-initial',
			locale: 'en',
			route: '/',
		});
		expect(matrix[1]).toEqual({
			id: 'w0639-dark-fr-after-navigation',
			width: 639,
			theme: 'dark',
			capture: 'fr-after-navigation',
			locale: 'fr',
			route: '/fr',
		});
	});

	it('adds Vercel protection bypass headers only when a secret is supplied', () => {
		expect(buildVercelBypassHeaders(undefined, 'https://pr.vercel.app')).toBeUndefined();
		expect(buildVercelBypassHeaders('', 'https://pr.vercel.app')).toBeUndefined();
		expect(buildVercelBypassHeaders('test-secret', 'https://pr.vercel.app')).toEqual({
			'x-vercel-protection-bypass': 'test-secret',
			'x-vercel-set-bypass-cookie': 'true',
		});
		expect(buildVercelBypassHeaders('test-secret', 'https://example.test')).toBeUndefined();
	});

	it('isolates the date text instead of masking the whole status line', () => {
		expect(findSystemDateMatch('SYSTEM ONLINE 2026.07.30')).toEqual({
			start: 14,
			end: 24,
			value: '2026.07.30',
		});
		expect(findSystemDateNodeMatch(['SYSTEM ONLINE ', '2026.07.30'])).toEqual({
			nodeIndex: 1,
			start: 0,
			end: 10,
			value: '2026.07.30',
		});
		expect(() => findSystemDateMatch('SYSTEM ONLINE')).toThrow(/exactly one system date/);
		expect(() =>
			findSystemDateMatch('2026.07.30 compared with 2026.07.31'),
		).toThrow(/exactly one system date/);
		expect(() =>
			findSystemDateNodeMatch(['2026.07.30', '2026.07.31']),
		).toThrow(/exactly one system date/);
	});

	it('rasterizes and clamps fractional footer-relative CSS masks', () => {
		expect(
			rasterizeCssRect(
				{ left: 1.2, top: -0.5, width: 2, height: 2.2 },
				{ width: 4, height: 4 },
				{ width: 4, height: 4 },
			),
		).toEqual({ left: 1, top: 0, right: 4, bottom: 2 });
	});

	it('allows drift inside the union of baseline and candidate masks', () => {
		const baseline = image(2, 1, [10, 20, 30, 255, 40, 50, 60, 255]);
		const changedFirst = image(2, 1, [99, 20, 30, 255, 40, 50, 60, 255]);
		const changedSecond = image(2, 1, [10, 20, 30, 255, 99, 50, 60, 255]);
		const firstPixel = { left: 0, top: 0, right: 1, bottom: 1 };
		const secondPixel = { left: 1, top: 0, right: 2, bottom: 1 };

		expect(compareRgba(baseline, changedFirst, [firstPixel], [])).toMatchObject({
			dimensionsMatch: true,
			totalPixels: 2,
			maskedPixels: 1,
			comparedPixels: 1,
			driftPixelsOutsideMasks: 0,
			driftChannelsOutsideMasks: 0,
			maxChannelDeltaOutsideMasks: 0,
			pass: true,
		});
		expect(compareRgba(baseline, changedSecond, [], [secondPixel])).toMatchObject({
			maskedPixels: 1,
			driftPixelsOutsideMasks: 0,
			pass: true,
		});
	});

	it('fails on any unmasked channel drift or dimension mismatch', () => {
		const baseline = image(2, 1, [10, 20, 30, 255, 40, 50, 60, 255]);
		const changed = image(2, 1, [10, 20, 30, 255, 49, 50, 60, 254]);
		const drift = compareRgba(baseline, changed, [], []);

		expect(drift).toMatchObject({
			dimensionsMatch: true,
			driftPixelsOutsideMasks: 1,
			driftChannelsOutsideMasks: 2,
			maxChannelDeltaOutsideMasks: 9,
			pass: false,
		});
		expect(
			compareRgba(
				image(1, 1, [0, 0, 0, 255]),
				image(2, 1, [0, 0, 0, 255, 0, 0, 0, 255]),
				[],
				[],
			),
		).toMatchObject({ dimensionsMatch: false, pass: false });
	});

	it('treats masked date or status-dot geometry drift as rect drift', () => {
		const baseline = {
			rectsCss: { footer: cssRect(0, 0, 640, 200) },
			masksCss: {
				systemDate: cssRect(500, 170, 80, 12),
				statusDot: cssRect(480, 170, 8, 8),
			},
		};
		const candidate = structuredClone(baseline);
		candidate.masksCss.statusDot.left += 1;
		candidate.masksCss.statusDot.right += 1;

		expect(compareRects(baseline, candidate)).toMatchObject({
			match: false,
			mismatchCount: 2,
			maxAbsDeltaCss: 1,
		});
	});

	it('verifies baseline screenshot integrity and the exact two-mask contract', () => {
		const { scenario, capture } = baselineCapture();

		expect(
			validateCaptureArtifact(capture, scenario, ONE_PIXEL_PNG, 'https://main.example.test'),
		).toMatchObject({ width: 1, height: 1 });

		expect(() =>
			validateCaptureArtifact(
				{
					...capture,
					screenshot: { ...capture.screenshot, sha256: '0'.repeat(64) },
				},
				scenario,
				ONE_PIXEL_PNG,
				'https://main.example.test',
			),
		).toThrow(/digest/);

		expect(() =>
			validateCaptureArtifact(
				{ ...capture, url: 'https://main.example.test/not-the-root' },
				scenario,
				ONE_PIXEL_PNG,
				'https://main.example.test',
			),
		).toThrow(/route/);

		expect(() =>
			validateCaptureArtifact(
				{
					...capture,
					masksPx: {
						...capture.masksPx,
						wholeFooter: { left: 0, top: 0, right: 1, bottom: 1 },
					},
				},
				scenario,
				ONE_PIXEL_PNG,
				'https://main.example.test',
			),
		).toThrow(/mask keys/);
	});

	it('summarizes every comparison and preserves exact drift counts', () => {
		expect(
			summarizeComparisons([
				{ pass: true, pixelDiff: { driftPixelsOutsideMasks: 0 } },
				{ pass: false, pixelDiff: { driftPixelsOutsideMasks: 3 } },
			]),
		).toEqual({
			comparisons: 2,
			passing: 1,
			failing: 1,
			driftPixelsOutsideMasks: 3,
			zeroPixelDriftOutsideMasks: false,
		});
	});
});
