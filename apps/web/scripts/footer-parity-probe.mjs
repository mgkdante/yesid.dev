import { createHash } from 'node:crypto';
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, parse, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

export const WIDTHS = Object.freeze([639, 640, 767, 768, 1023, 1024, 1280]);
export const THEMES = Object.freeze(['dark', 'light']);
export const CAPTURES = Object.freeze([
	Object.freeze({ capture: 'en-initial', locale: 'en', route: '/' }),
	Object.freeze({
		capture: 'fr-after-navigation',
		locale: 'fr',
		route: '/fr',
	}),
]);

const SCHEMA_VERSION = 1;
const VIEWPORT_HEIGHT = 900;
const DEVICE_SCALE_FACTOR = 1;
const TIMEZONE = 'America/Toronto';
const FROZEN_CLOCK = '2026-07-30T16:00:00.000Z';
const RECEIPT_FILE = 'receipt.json';
const FOOTER_SELECTOR = '[data-testid="footer"]';
const MASK_KEYS = Object.freeze(['statusDot', 'systemDate']);
const RECT_KEYS = Object.freeze([
	'footer',
	'grid',
	'groupLabels',
	'hazard',
	'legalNav',
	'links',
	'statusBar',
	'wordmark',
]);
const MOTION_KILL_CSS = `
	*, *::before, *::after {
		animation-delay: 0s !important;
		animation-duration: 0s !important;
		animation-iteration-count: 1 !important;
		caret-color: transparent !important;
		scroll-behavior: auto !important;
		transition-delay: 0s !important;
		transition-duration: 0s !important;
	}
`;

const PROBE_CONFIG = Object.freeze({
	widths: WIDTHS,
	themes: THEMES,
	captures: CAPTURES,
	viewportHeight: VIEWPORT_HEIGHT,
	deviceScaleFactor: DEVICE_SCALE_FACTOR,
	timezone: TIMEZONE,
	frozenClock: FROZEN_CLOCK,
	reducedMotion: 'reduce',
});

function usage() {
	return [
		'Usage:',
		'  node scripts/footer-parity-probe.mjs baseline --url <main-preview> --out <baseline-dir>',
		'  node scripts/footer-parity-probe.mjs candidate --url <pr-preview> --baseline <baseline-dir> --out <candidate-dir>',
	].join('\n');
}

function parseFlagValues(args) {
	const allowed = new Set(['--url', '--out', '--baseline']);
	const values = new Map();
	for (let index = 0; index < args.length; index++) {
		const flag = args[index];
		if (!allowed.has(flag)) throw new Error(`unknown argument ${JSON.stringify(flag)}`);
		if (values.has(flag)) throw new Error(`duplicate argument ${flag}`);
		const value = args[index + 1];
		if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
		values.set(flag, value);
		index++;
	}
	return values;
}

function parseOrigin(input) {
	let url;
	try {
		url = new URL(input);
	} catch (error) {
		throw new Error(`invalid preview URL ${JSON.stringify(input)}`, { cause: error });
	}
	if (!['http:', 'https:'].includes(url.protocol)) {
		throw new Error(`preview URL must use http or https: ${url.href}`);
	}
	if (url.username || url.password) throw new Error('preview URL must not contain credentials');
	return url.origin;
}

function safeDirectory(input, label) {
	const path = resolve(input);
	if (path === parse(path).root) throw new Error(`${label} must not be a filesystem root`);
	return path;
}

export function parseCliArgs(argv) {
	const [mode, ...rest] = argv;
	if (!['baseline', 'candidate'].includes(mode)) {
		throw new Error(`first argument must be baseline or candidate\n${usage()}`);
	}
	const values = parseFlagValues(rest);
	const url = values.get('--url');
	const out = values.get('--out');
	if (!url) throw new Error(`${mode} requires --url`);
	if (!out) throw new Error(`${mode} requires --out`);

	const origin = parseOrigin(url);
	const outDir = safeDirectory(out, '--out');
	if (mode === 'baseline') {
		if (values.has('--baseline')) throw new Error('baseline mode does not accept --baseline');
		return { mode, origin, outDir };
	}

	const baseline = values.get('--baseline');
	if (!baseline) throw new Error('candidate requires --baseline');
	const baselineDir = safeDirectory(baseline, '--baseline');
	if (baselineDir === outDir) throw new Error('--baseline and --out must differ');
	return { mode, origin, baselineDir, outDir };
}

function scenarioId(width, theme, capture) {
	return `w${String(width).padStart(4, '0')}-${theme}-${capture}`;
}

export function buildScenarioMatrix() {
	return WIDTHS.flatMap((width) =>
		THEMES.flatMap((theme) =>
			CAPTURES.map(({ capture, locale, route }) => ({
				id: scenarioId(width, theme, capture),
				width,
				theme,
				capture,
				locale,
				route,
			})),
		),
	);
}

export function buildVercelBypassHeaders(secret, origin) {
	if (typeof secret !== 'string' || secret.length === 0) return undefined;
	const hostname = new URL(origin).hostname;
	if (hostname !== 'vercel.app' && !hostname.endsWith('.vercel.app')) return undefined;
	return {
		'x-vercel-protection-bypass': secret,
		'x-vercel-set-bypass-cookie': 'true',
	};
}

export function findSystemDateNodeMatch(textNodes) {
	const matches = textNodes.flatMap((text, nodeIndex) =>
		[...text.matchAll(/\b\d{4}\.\d{2}\.\d{2}\b/g)]
			.filter((match) => match.index !== undefined)
			.map((match) => ({ match, nodeIndex })),
	);
	if (matches.length !== 1) {
		throw new Error(`expected exactly one system date, found ${matches.length}`);
	}
	const { match, nodeIndex } = matches[0];
	return {
		nodeIndex,
		start: match.index,
		end: match.index + match[0].length,
		value: match[0],
	};
}

export function findSystemDateMatch(text) {
	const { nodeIndex: _nodeIndex, ...match } = findSystemDateNodeMatch([text]);
	return match;
}

function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}

export function rasterizeCssRect(rect, image, footerCss) {
	if (
		image.width <= 0 ||
		image.height <= 0 ||
		footerCss.width <= 0 ||
		footerCss.height <= 0
	) {
		throw new Error('image and footer dimensions must be positive');
	}
	const scaleX = image.width / footerCss.width;
	const scaleY = image.height / footerCss.height;
	return {
		left: clamp(Math.floor(rect.left * scaleX), 0, image.width),
		top: clamp(Math.floor(rect.top * scaleY), 0, image.height),
		right: clamp(Math.ceil((rect.left + rect.width) * scaleX), 0, image.width),
		bottom: clamp(Math.ceil((rect.top + rect.height) * scaleY), 0, image.height),
	};
}

function assertImage(image, label) {
	if (
		!Number.isSafeInteger(image.width) ||
		!Number.isSafeInteger(image.height) ||
		image.width <= 0 ||
		image.height <= 0
	) {
		throw new Error(`${label} has invalid dimensions`);
	}
	if (image.pixels.length !== image.width * image.height * 4) {
		throw new Error(`${label} does not contain RGBA8 pixels`);
	}
}

function pixelMask(width, height, rectangles) {
	const mask = new Uint8Array(width * height);
	for (const rect of rectangles) {
		const left = clamp(Math.floor(rect.left), 0, width);
		const top = clamp(Math.floor(rect.top), 0, height);
		const right = clamp(Math.ceil(rect.right), 0, width);
		const bottom = clamp(Math.ceil(rect.bottom), 0, height);
		for (let y = top; y < bottom; y++) {
			mask.fill(1, y * width + left, y * width + right);
		}
	}
	return mask;
}

function countMask(mask) {
	let count = 0;
	for (const value of mask) count += value;
	return count;
}

export function compareRgba(baseline, candidate, baselineMasks, candidateMasks) {
	assertImage(baseline, 'baseline image');
	assertImage(candidate, 'candidate image');
	const dimensionsMatch =
		baseline.width === candidate.width && baseline.height === candidate.height;
	if (!dimensionsMatch) {
		return {
			dimensionsMatch,
			baselineDimensions: { width: baseline.width, height: baseline.height },
			candidateDimensions: { width: candidate.width, height: candidate.height },
			totalPixels: null,
			maskedPixels: null,
			comparedPixels: null,
			driftPixelsOutsideMasks: null,
			driftChannelsOutsideMasks: null,
			maxChannelDeltaOutsideMasks: null,
			pass: false,
		};
	}

	const mask = pixelMask(baseline.width, baseline.height, [
		...baselineMasks,
		...candidateMasks,
	]);
	const maskedPixels = countMask(mask);
	let driftPixelsOutsideMasks = 0;
	let driftChannelsOutsideMasks = 0;
	let maxChannelDeltaOutsideMasks = 0;

	for (let pixel = 0; pixel < mask.length; pixel++) {
		if (mask[pixel]) continue;
		const offset = pixel * 4;
		let pixelDrifted = false;
		for (let channel = 0; channel < 4; channel++) {
			const delta = Math.abs(baseline.pixels[offset + channel] - candidate.pixels[offset + channel]);
			if (delta === 0) continue;
			pixelDrifted = true;
			driftChannelsOutsideMasks++;
			maxChannelDeltaOutsideMasks = Math.max(maxChannelDeltaOutsideMasks, delta);
		}
		if (pixelDrifted) driftPixelsOutsideMasks++;
	}

	const totalPixels = baseline.width * baseline.height;
	return {
		dimensionsMatch,
		baselineDimensions: { width: baseline.width, height: baseline.height },
		candidateDimensions: { width: candidate.width, height: candidate.height },
		totalPixels,
		maskedPixels,
		comparedPixels: totalPixels - maskedPixels,
		driftPixelsOutsideMasks,
		driftChannelsOutsideMasks,
		maxChannelDeltaOutsideMasks,
		pass: driftPixelsOutsideMasks === 0,
	};
}

export function summarizeComparisons(comparisons) {
	const passing = comparisons.filter(({ pass }) => pass).length;
	return {
		comparisons: comparisons.length,
		passing,
		failing: comparisons.length - passing,
		driftPixelsOutsideMasks: comparisons.reduce(
			(total, { pixelDiff }) =>
				total +
				(typeof pixelDiff.driftPixelsOutsideMasks === 'number'
					? pixelDiff.driftPixelsOutsideMasks
					: 0),
			0,
		),
		zeroPixelDriftOutsideMasks: comparisons.every(
			({ pixelDiff }) => pixelDiff.driftPixelsOutsideMasks === 0,
		),
	};
}

function decodePng(buffer) {
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	if (buffer.length < signature.length || !buffer.subarray(0, 8).equals(signature)) {
		throw new Error('invalid PNG signature');
	}
	let offset = 8;
	let width = 0;
	let height = 0;
	let bitDepth = 0;
	let colorType = 0;
	let interlace = 0;
	const idat = [];
	while (offset + 12 <= buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const end = offset + 12 + length;
		if (end > buffer.length) throw new Error('truncated PNG chunk');
		const type = buffer.toString('ascii', offset + 4, offset + 8);
		const data = buffer.subarray(offset + 8, offset + 8 + length);
		if (type === 'IHDR') {
			width = data.readUInt32BE(0);
			height = data.readUInt32BE(4);
			bitDepth = data[8];
			colorType = data[9];
			interlace = data[12];
		} else if (type === 'IDAT') {
			idat.push(data);
		} else if (type === 'IEND') {
			break;
		}
		offset = end;
	}
	if (
		width <= 0 ||
		height <= 0 ||
		bitDepth !== 8 ||
		![2, 6].includes(colorType) ||
		interlace !== 0
	) {
		throw new Error(
			`unsupported PNG shape: ${width}x${height} depth=${bitDepth} color=${colorType} interlace=${interlace}`,
		);
	}

	const bytesPerPixel = colorType === 6 ? 4 : 3;
	const inflated = inflateSync(Buffer.concat(idat));
	const stride = width * bytesPerPixel;
	const expectedLength = height * (stride + 1);
	if (inflated.length !== expectedLength) throw new Error('unexpected PNG scanline length');
	const pixels = new Uint8Array(width * height * 4);
	const prior = new Uint8Array(stride);
	const current = new Uint8Array(stride);
	let input = 0;
	for (let y = 0; y < height; y++) {
		const filter = inflated[input++];
		for (let x = 0; x < stride; x++) {
			const raw = inflated[input + x];
			const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
			const above = prior[x];
			const upperLeft = x >= bytesPerPixel ? prior[x - bytesPerPixel] : 0;
			let value;
			if (filter === 0) value = raw;
			else if (filter === 1) value = raw + left;
			else if (filter === 2) value = raw + above;
			else if (filter === 3) value = raw + ((left + above) >> 1);
			else if (filter === 4) {
				const pa = Math.abs(above - upperLeft);
				const pb = Math.abs(left - upperLeft);
				const pc = Math.abs(left + above - 2 * upperLeft);
				value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft);
			} else {
				throw new Error(`unsupported PNG filter ${filter}`);
			}
			current[x] = value & 0xff;
		}
		input += stride;
		for (let x = 0; x < width; x++) {
			const source = x * bytesPerPixel;
			const destination = (y * width + x) * 4;
			pixels[destination] = current[source];
			pixels[destination + 1] = current[source + 1];
			pixels[destination + 2] = current[source + 2];
			pixels[destination + 3] = bytesPerPixel === 4 ? current[source + 3] : 255;
		}
		prior.set(current);
	}
	return { width, height, pixels };
}

function round(value) {
	return Math.round(value * 1000) / 1000;
}

function assertExactKeys(value, expected, label) {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`${label} must be an object`);
	}
	const actual = Object.keys(value).sort();
	if (JSON.stringify(actual) !== JSON.stringify([...expected].sort())) {
		throw new Error(`${label} must contain exactly these keys: ${expected.join(', ')}`);
	}
}

function validateCssRect(rect, label) {
	assertExactKeys(rect, ['bottom', 'height', 'left', 'right', 'top', 'width'], label);
	for (const [key, value] of Object.entries(rect)) {
		if (typeof value !== 'number' || !Number.isFinite(value)) {
			throw new Error(`${label}.${key} must be a finite number`);
		}
	}
	if (rect.width < 0 || rect.height < 0 || rect.right < rect.left || rect.bottom < rect.top) {
		throw new Error(`${label} has invalid bounds`);
	}
	if (
		Math.abs(rect.right - rect.left - rect.width) > 0.002 ||
		Math.abs(rect.bottom - rect.top - rect.height) > 0.002
	) {
		throw new Error(`${label} has incoherent dimensions`);
	}
}

function validatePixelRect(rect, image, label) {
	assertExactKeys(rect, ['bottom', 'left', 'right', 'top'], label);
	for (const [key, value] of Object.entries(rect)) {
		if (!Number.isSafeInteger(value)) {
			throw new Error(`${label}.${key} must be an integer`);
		}
	}
	if (
		rect.left < 0 ||
		rect.top < 0 ||
		rect.right < rect.left ||
		rect.bottom < rect.top ||
		rect.right > image.width ||
		rect.bottom > image.height
	) {
		throw new Error(`${label} escapes the screenshot`);
	}
}

function validateRectsCss(rectsCss) {
	assertExactKeys(rectsCss, RECT_KEYS, 'rectsCss');
	for (const key of RECT_KEYS) {
		const value = rectsCss[key];
		if (key === 'groupLabels' || key === 'links') {
			if (!Array.isArray(value)) throw new Error(`rectsCss.${key} must be an array`);
			value.forEach((rect, index) => validateCssRect(rect, `rectsCss.${key}[${index}]`));
		} else {
			validateCssRect(value, `rectsCss.${key}`);
		}
	}
}

export function validateCaptureArtifact(capture, expected, pngBuffer, expectedOrigin) {
	if (!capture || typeof capture !== 'object' || Array.isArray(capture)) {
		throw new Error('capture must be an object');
	}
	for (const key of ['id', 'width', 'theme', 'capture', 'locale', 'route']) {
		if (capture[key] !== expected[key]) {
			throw new Error(`capture ${expected.id} has mismatched ${key}`);
		}
	}
	let captureUrl;
	try {
		captureUrl = new URL(capture.url);
	} catch (error) {
		throw new Error(`capture ${expected.id} has an invalid URL`, { cause: error });
	}
	if (captureUrl.origin !== expectedOrigin) {
		throw new Error(`capture ${expected.id} has an unexpected origin`);
	}
	if (captureUrl.pathname !== expected.route) {
		throw new Error(`capture ${expected.id} has an unexpected route`);
	}

	const screenshot = capture.screenshot;
	if (!screenshot || typeof screenshot !== 'object' || Array.isArray(screenshot)) {
		throw new Error(`capture ${expected.id} has invalid screenshot metadata`);
	}
	if (screenshot.file !== `${expected.id}.png`) {
		throw new Error(`capture ${expected.id} has an unexpected screenshot filename`);
	}
	const digest = createHash('sha256').update(pngBuffer).digest('hex');
	if (screenshot.sha256 !== digest) {
		throw new Error(`capture ${expected.id} screenshot digest mismatch`);
	}
	const image = decodePng(pngBuffer);
	if (
		screenshot.widthPx !== image.width ||
		screenshot.heightPx !== image.height ||
		screenshot.pixelCount !== image.width * image.height
	) {
		throw new Error(`capture ${expected.id} screenshot dimensions do not match the artifact`);
	}

	validateRectsCss(capture.rectsCss);
	assertExactKeys(capture.masksCss, MASK_KEYS, `capture ${expected.id} CSS mask keys`);
	assertExactKeys(capture.masksPx, MASK_KEYS, `capture ${expected.id} pixel mask keys`);
	for (const key of MASK_KEYS) {
		validateCssRect(capture.masksCss[key], `masksCss.${key}`);
		validatePixelRect(capture.masksPx[key], image, `masksPx.${key}`);
	}
	const expectedMasksPx = maskPixels(capture.masksCss, image, capture.rectsCss.footer);
	if (JSON.stringify(capture.masksPx) !== JSON.stringify(expectedMasksPx)) {
		throw new Error(`capture ${expected.id} pixel masks do not match CSS geometry`);
	}
	const maskedPixels = countMask(pixelMask(image.width, image.height, Object.values(expectedMasksPx)));
	if (
		capture.maskedPixels !== maskedPixels ||
		capture.unmaskedPixels !== image.width * image.height - maskedPixels
	) {
		throw new Error(`capture ${expected.id} mask pixel counts are incoherent`);
	}
	return image;
}

async function collectFooterGeometry(page) {
	const collected = await page.evaluate((selector) => {
		const footer = document.querySelector(selector);
		if (!(footer instanceof HTMLElement)) throw new Error('footer landmark not found');
		const footerBox = footer.getBoundingClientRect();
		const rounded = (value) => Math.round(value * 1000) / 1000;
		const relativeRect = (box) => ({
			left: rounded(box.left - footerBox.left),
			top: rounded(box.top - footerBox.top),
			right: rounded(box.right - footerBox.left),
			bottom: rounded(box.bottom - footerBox.top),
			width: rounded(box.width),
			height: rounded(box.height),
		});
		const one = (query) => {
			const matches = footer.querySelectorAll(query);
			if (matches.length !== 1) {
				throw new Error(`expected one ${query} inside footer, found ${matches.length}`);
			}
			return relativeRect(matches[0].getBoundingClientRect());
		};
		const many = (query) =>
			[...footer.querySelectorAll(query)].map((element) =>
				relativeRect(element.getBoundingClientRect()),
			);

		const status = footer.querySelector('.footer-status-border');
		if (!(status instanceof HTMLElement)) throw new Error('footer status bar not found');
		const walker = document.createTreeWalker(status, NodeFilter.SHOW_TEXT);
		const statusTextNodes = [];
		let textNode;
		while ((textNode = walker.nextNode())) {
			statusTextNodes.push(textNode.textContent ?? '');
		}

		return {
			rects: {
				footer: relativeRect(footerBox),
				hazard: one(':scope > .footer-gradient-sep'),
				grid: one(':scope > .grid'),
				statusBar: relativeRect(status.getBoundingClientRect()),
				wordmark: one('[data-testid="footer-wordmark"]'),
				legalNav: one('[data-testid="footer-legal"]'),
				groupLabels: many('.footer-group-label'),
				links: many('.footer-link'),
			},
			masks: {
				statusDot: one('[data-slot="status-dot"]'),
			},
			statusTextNodes,
		};
	}, FOOTER_SELECTOR);
	const dateMatch = findSystemDateNodeMatch(collected.statusTextNodes);
	const systemDate = await page.evaluate(
		({ selector, nodeIndex, start, end }) => {
			const footer = document.querySelector(selector);
			if (!(footer instanceof HTMLElement)) throw new Error('footer landmark not found');
			const status = footer.querySelector('.footer-status-border');
			if (!(status instanceof HTMLElement)) throw new Error('footer status bar not found');
			const walker = document.createTreeWalker(status, NodeFilter.SHOW_TEXT);
			let node = walker.nextNode();
			for (let index = 0; index < nodeIndex && node; index++) {
				node = walker.nextNode();
			}
			if (!node) throw new Error(`footer status text node ${nodeIndex} not found`);
			const range = document.createRange();
			range.setStart(node, start);
			range.setEnd(node, end);
			const footerBox = footer.getBoundingClientRect();
			const box = range.getBoundingClientRect();
			const rounded = (value) => Math.round(value * 1000) / 1000;
			return {
				left: rounded(box.left - footerBox.left),
				top: rounded(box.top - footerBox.top),
				right: rounded(box.right - footerBox.left),
				bottom: rounded(box.bottom - footerBox.top),
				width: rounded(box.width),
				height: rounded(box.height),
			};
		},
		{ selector: FOOTER_SELECTOR, ...dateMatch },
	);
	const { statusTextNodes: _statusTextNodes, ...geometry } = collected;
	return {
		...geometry,
		masks: {
			systemDate,
			statusDot: geometry.masks.statusDot,
		},
	};
}

async function settle(page) {
	await page.locator(FOOTER_SELECTOR).waitFor({ state: 'visible' });
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise((resolveFrame) =>
			requestAnimationFrame(() => requestAnimationFrame(resolveFrame)),
		);
	});
}

async function assertRenderContext(page, theme, locale) {
	const rendered = await page.locator('html').evaluate((element) => ({
		theme: element.getAttribute('data-theme'),
		locale: element.getAttribute('lang')?.split('-')[0],
	}));
	if (rendered.theme !== theme) {
		throw new Error(`theme mismatch: expected ${theme}, got ${rendered.theme}`);
	}
	// KNOWN BASE DEFECT (2026-07-30, filed in the fast-track slice): the in-app
	// language switch leaves <html lang> stale on unmodified main, on both sites.
	// A parity oracle compares candidate against the base AS IT IS, so the
	// observed locale is recorded into the compared capture record (see
	// compareCapture) — divergence between baseline and candidate fails the
	// comparison. A strict locale throw returns once the fast-track fix lands.
	return { observedLocale: rendered.locale, expectedLocale: locale };
}

async function newContext(browser, origin, width, theme) {
	const extraHTTPHeaders = buildVercelBypassHeaders(
		process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
		origin,
	);
	const context = await browser.newContext({
		viewport: { width, height: VIEWPORT_HEIGHT },
		colorScheme: theme,
		deviceScaleFactor: DEVICE_SCALE_FACTOR,
		timezoneId: TIMEZONE,
		reducedMotion: 'reduce',
		...(extraHTTPHeaders ? { extraHTTPHeaders } : {}),
	});
	await context.addInitScript(
		({ selectedTheme, frozenEpoch }) => {
			localStorage.setItem('theme', selectedTheme);
			const NativeDate = Date;
			function FrozenDate(...args) {
				if (new.target) {
					return new NativeDate(...(args.length === 0 ? [frozenEpoch] : args));
				}
				return new NativeDate(frozenEpoch).toString();
			}
			Object.setPrototypeOf(FrozenDate, NativeDate);
			FrozenDate.prototype = NativeDate.prototype;
			FrozenDate.now = () => frozenEpoch;
			FrozenDate.parse = NativeDate.parse;
			FrozenDate.UTC = NativeDate.UTC;
			globalThis.Date = FrozenDate;
		},
		{ selectedTheme: theme, frozenEpoch: Date.parse(FROZEN_CLOCK) },
	);
	return context;
}

async function gotoEnglish(page, origin, theme) {
	const url = new URL('/', `${origin}/`).href;
	const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
	if (!response?.ok()) {
		throw new Error(`navigation failed (${response?.status() ?? 'no response'}): ${url}`);
	}
	await page.addStyleTag({ content: MOTION_KILL_CSS });
	await settle(page);
	return assertRenderContext(page, theme, 'en');
}

async function navigateToFrench(page, theme) {
	const marker = `footer-parity-${Math.random().toString(36).slice(2)}`;
	await page.evaluate((value) => {
		globalThis.__footerParityDocumentMarker = value;
	}, marker);
	const toggle = page.getByTestId('language-toggle');
	await toggle.waitFor({ state: 'visible' });
	await Promise.all([
		page.waitForURL((url) => url.pathname === '/fr'),
		toggle.click(),
	]);
	const stayedInApp = await page.evaluate(
		(value) => globalThis.__footerParityDocumentMarker === value,
		marker,
	);
	if (!stayedInApp) throw new Error('EN to FR navigation reloaded the document');
	await settle(page);
	return assertRenderContext(page, theme, 'fr');
}

function maskPixels(masksCss, image, footerCss) {
	return Object.fromEntries(
		Object.entries(masksCss).map(([name, rect]) => [
			name,
			rasterizeCssRect(rect, image, footerCss),
		]),
	);
}

async function capture(page, outDir, scenario) {
	const footer = page.locator(FOOTER_SELECTOR);
	await footer.scrollIntoViewIfNeeded();
	await settle(page);
	const geometry = await collectFooterGeometry(page);
	const file = `${scenario.id}.png`;
	const buffer = await footer.screenshot({
		path: join(outDir, file),
		animations: 'disabled',
		caret: 'hide',
	});
	const image = decodePng(buffer);
	const masksPx = maskPixels(geometry.masks, image, geometry.rects.footer);
	const maskedPixels = countMask(
		pixelMask(image.width, image.height, Object.values(masksPx)),
	);
	return {
		...scenario,
		url: page.url(),
		screenshot: {
			file,
			sha256: createHash('sha256').update(buffer).digest('hex'),
			widthPx: image.width,
			heightPx: image.height,
			pixelCount: image.width * image.height,
		},
		rectsCss: geometry.rects,
		masksCss: geometry.masks,
		masksPx,
		maskedPixels,
		unmaskedPixels: image.width * image.height - maskedPixels,
	};
}

async function capturePair(browser, origin, outDir, width, theme) {
	const context = await newContext(browser, origin, width, theme);
	const page = await context.newPage();
	try {
		const enContext = await gotoEnglish(page, origin, theme);
		const english = {
			...(await capture(page, outDir, {
				id: scenarioId(width, theme, 'en-initial'),
				width,
				theme,
				capture: 'en-initial',
				locale: 'en',
				route: '/',
			})),
			renderContext: enContext,
		};
		const frContext = await navigateToFrench(page, theme);
		const french = {
			...(await capture(page, outDir, {
				id: scenarioId(width, theme, 'fr-after-navigation'),
				width,
				theme,
				capture: 'fr-after-navigation',
				locale: 'fr',
				route: '/fr',
			})),
			renderContext: frContext,
		};
		return [english, french];
	} finally {
		await context.close();
	}
}

async function captureMatrix(browser, origin, outDir) {
	const captures = [];
	for (const width of WIDTHS) {
		for (const theme of THEMES) {
			captures.push(...(await capturePair(browser, origin, outDir, width, theme)));
		}
	}
	const expected = buildScenarioMatrix().map(({ id }) => id);
	const actual = captures.map(({ id }) => id);
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		throw new Error('capture matrix order drifted from the frozen contract');
	}
	return captures;
}

function prepareOutputDirectory(outDir) {
	if (existsSync(outDir)) {
		if (!statSync(outDir).isDirectory()) throw new Error(`output is not a directory: ${outDir}`);
		if (readdirSync(outDir).length !== 0) {
			throw new Error(`output directory must be empty: ${outDir}`);
		}
		return;
	}
	mkdirSync(outDir, { recursive: true });
}

function writeReceipt(outDir, receipt) {
	const path = join(outDir, RECEIPT_FILE);
	writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, { flag: 'wx' });
	process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

function loadChromium() {
	const require = createRequire(import.meta.url);
	const playwrightTestRequire = createRequire(require.resolve('@playwright/test/package.json'));
	const playwrightRequire = createRequire(playwrightTestRequire.resolve('playwright/package.json'));
	return playwrightRequire('playwright-core').chromium;
}

function baselineReceipt(origin, outDir, captures) {
	return {
		schemaVersion: SCHEMA_VERSION,
		kind: 'footer-parity-baseline',
		origin,
		outputDirectory: outDir,
		generatedAt: new Date().toISOString(),
		config: PROBE_CONFIG,
		captures,
		summary: {
			captures: captures.length,
			pixels: captures.reduce((total, item) => total + item.screenshot.pixelCount, 0),
			maskedPixels: captures.reduce((total, item) => total + item.maskedPixels, 0),
		},
	};
}

function readBaselineReceipt(baselineDir) {
	const path = join(baselineDir, RECEIPT_FILE);
	const receipt = JSON.parse(readFileSync(path, 'utf8'));
	if (
		receipt.schemaVersion !== SCHEMA_VERSION ||
		receipt.kind !== 'footer-parity-baseline' ||
		JSON.stringify(receipt.config) !== JSON.stringify(PROBE_CONFIG)
	) {
		throw new Error(`incompatible baseline receipt: ${path}`);
	}
	const expectedIds = buildScenarioMatrix().map(({ id }) => id);
	const actualIds = receipt.captures?.map(({ id }) => id);
	if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
		throw new Error(`baseline receipt has an incomplete capture matrix: ${path}`);
	}
	const expectedOrigin = parseOrigin(receipt.origin);
	const scenarios = buildScenarioMatrix();
	for (let index = 0; index < scenarios.length; index++) {
		const capture = receipt.captures[index];
		const artifact = readFileSync(artifactPath(baselineDir, capture.screenshot?.file));
		validateCaptureArtifact(capture, scenarios[index], artifact, expectedOrigin);
	}
	const expectedSummary = {
		captures: receipt.captures.length,
		pixels: receipt.captures.reduce(
			(total, capture) => total + capture.screenshot.pixelCount,
			0,
		),
		maskedPixels: receipt.captures.reduce(
			(total, capture) => total + capture.maskedPixels,
			0,
		),
	};
	if (JSON.stringify(receipt.summary) !== JSON.stringify(expectedSummary)) {
		throw new Error(`baseline receipt has an incoherent summary: ${path}`);
	}
	return receipt;
}

function artifactPath(root, file) {
	if (typeof file !== 'string' || basename(file) !== file || file.includes(sep)) {
		throw new Error(`unsafe screenshot filename ${JSON.stringify(file)}`);
	}
	return join(root, file);
}

function flattenNumbers(value, path = '', output = new Map()) {
	if (typeof value === 'number') {
		output.set(path, value);
		return output;
	}
	if (Array.isArray(value)) {
		value.forEach((entry, index) => flattenNumbers(entry, `${path}[${index}]`, output));
		return output;
	}
	if (value && typeof value === 'object') {
		for (const [key, entry] of Object.entries(value)) {
			flattenNumbers(entry, path ? `${path}.${key}` : key, output);
		}
	}
	return output;
}

export function compareRects(baseline, candidate) {
	const baselineValues = flattenNumbers(baseline);
	const candidateValues = flattenNumbers(candidate);
	const paths = [...new Set([...baselineValues.keys(), ...candidateValues.keys()])].sort();
	const deltas = [];
	let maxAbsDeltaCss = 0;
	for (const path of paths) {
		const baselineValue = baselineValues.get(path);
		const candidateValue = candidateValues.get(path);
		const delta =
			baselineValue === undefined || candidateValue === undefined
				? null
				: round(candidateValue - baselineValue);
		if (delta === 0) continue;
		if (typeof delta === 'number') maxAbsDeltaCss = Math.max(maxAbsDeltaCss, Math.abs(delta));
		deltas.push({ path, baseline: baselineValue ?? null, candidate: candidateValue ?? null, delta });
	}
	return {
		match: deltas.length === 0,
		mismatchCount: deltas.length,
		maxAbsDeltaCss,
		deltas,
	};
}

function compareCapture(baselineDir, candidateDir, baseline, candidate) {
	const baselineImage = decodePng(
		readFileSync(artifactPath(baselineDir, baseline.screenshot.file)),
	);
	const candidateImage = decodePng(
		readFileSync(artifactPath(candidateDir, candidate.screenshot.file)),
	);
	const pixelDiff = compareRgba(
		baselineImage,
		candidateImage,
		Object.values(baseline.masksPx),
		Object.values(candidate.masksPx),
	);
	const rectDiff = compareRects(
		{ rectsCss: baseline.rectsCss, masksCss: baseline.masksCss },
		{ rectsCss: candidate.rectsCss, masksCss: candidate.masksCss },
	);
	const renderContextMatches =
		JSON.stringify(baseline.renderContext ?? null) ===
		JSON.stringify(candidate.renderContext ?? null);
	return {
		id: candidate.id,
		width: candidate.width,
		theme: candidate.theme,
		capture: candidate.capture,
		locale: candidate.locale,
		renderContext: candidate.renderContext ?? null,
		renderContextMatches,
		route: candidate.route,
		baseline: {
			url: baseline.url,
			screenshot: baseline.screenshot,
			rectsCss: baseline.rectsCss,
			masksCss: baseline.masksCss,
		},
		candidate: {
			url: candidate.url,
			screenshot: candidate.screenshot,
			rectsCss: candidate.rectsCss,
			masksCss: candidate.masksCss,
		},
		rectDiff,
		pixelDiff,
		pass: rectDiff.match && pixelDiff.pass && renderContextMatches,
	};
}

function candidateReceipt(origin, outDir, baselineDir, baseline, captures) {
	const baselineById = new Map(baseline.captures.map((capture) => [capture.id, capture]));
	const comparisons = captures.map((capture) => {
		const baselineCapture = baselineById.get(capture.id);
		if (!baselineCapture) throw new Error(`baseline is missing ${capture.id}`);
		return compareCapture(baselineDir, outDir, baselineCapture, capture);
	});
	const comparisonSummary = summarizeComparisons(comparisons);
	const rectMismatches = comparisons.reduce(
		(total, comparison) => total + comparison.rectDiff.mismatchCount,
		0,
	);
	return {
		schemaVersion: SCHEMA_VERSION,
		kind: 'footer-parity-candidate',
		origin,
		outputDirectory: outDir,
		generatedAt: new Date().toISOString(),
		config: PROBE_CONFIG,
		baseline: {
			origin: baseline.origin,
			directory: baselineDir,
		},
		comparisons,
		summary: {
			...comparisonSummary,
			rectMismatches,
			zeroRectDrift: rectMismatches === 0,
			pass: comparisonSummary.failing === 0,
		},
	};
}

async function runBaseline(args) {
	prepareOutputDirectory(args.outDir);
	const chromium = loadChromium();
	const browser = await chromium.launch({ headless: true });
	try {
		const captures = await captureMatrix(browser, args.origin, args.outDir);
		const scenarios = buildScenarioMatrix();
		captures.forEach((capture, index) => {
			const artifact = readFileSync(artifactPath(args.outDir, capture.screenshot.file));
			validateCaptureArtifact(capture, scenarios[index], artifact, args.origin);
		});
		const receipt = baselineReceipt(args.origin, args.outDir, captures);
		writeReceipt(args.outDir, receipt);
	} finally {
		await browser.close();
	}
}

async function runCandidate(args) {
	const baseline = readBaselineReceipt(args.baselineDir);
	prepareOutputDirectory(args.outDir);
	const chromium = loadChromium();
	const browser = await chromium.launch({ headless: true });
	try {
		const captures = await captureMatrix(browser, args.origin, args.outDir);
		const scenarios = buildScenarioMatrix();
		captures.forEach((capture, index) => {
			const artifact = readFileSync(artifactPath(args.outDir, capture.screenshot.file));
			validateCaptureArtifact(capture, scenarios[index], artifact, args.origin);
		});
		const receipt = candidateReceipt(
			args.origin,
			args.outDir,
			args.baselineDir,
			baseline,
			captures,
		);
		writeReceipt(args.outDir, receipt);
		if (!receipt.summary.pass) process.exitCode = 1;
	} finally {
		await browser.close();
	}
}

export async function main(argv = process.argv.slice(2)) {
	const args = parseCliArgs(argv);
	if (args.mode === 'baseline') await runBaseline(args);
	else await runCandidate(args);
}

const isMain =
	process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
	void main().catch((error) => {
		process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
		process.exitCode = 2;
	});
}
