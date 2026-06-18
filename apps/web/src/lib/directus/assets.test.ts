// Unit tests for the Directus asset helper (18c Task 47).
//
// Scope: asset URL composition + srcset builder. Pure string work — no
// network, no env. The factory `createAssets(baseUrl)` is the test seam so
// PUBLIC_DIRECTUS_URL isn't touched here.

import { describe, it, expect } from 'vitest';
import { createAssets } from './assets';

const assets = createAssets('https://cms.yesid.dev');

describe('asset', () => {
	it('returns /assets/:id without a query when no preset is given', () => {
		expect(assets.asset('abc-123')).toBe('https://cms.yesid.dev/assets/abc-123');
	});

	it('appends ?key=<preset> when a preset is given', () => {
		expect(assets.asset('abc-123', 'hero-1200')).toBe(
			'https://cms.yesid.dev/assets/abc-123?key=hero-1200',
		);
	});

	it('strips a trailing slash from the base URL (prevents //assets/)', () => {
		const trimmed = createAssets('https://cms.yesid.dev/');
		expect(trimmed.asset('id')).toBe('https://cms.yesid.dev/assets/id');
	});

	it('URL-encodes the asset id (covers slashes + special chars)', () => {
		expect(assets.asset('folder/child')).toBe(
			'https://cms.yesid.dev/assets/folder%2Fchild',
		);
	});
});

describe('buildSrcSet', () => {
	it('composes a single-entry srcset when one preset is given', () => {
		expect(assets.buildSrcSet('id', ['hero-1200'])).toBe(
			'https://cms.yesid.dev/assets/id?key=hero-1200 1200w',
		);
	});

	it('composes multi-entry srcset with ascending widths + comma-space joins', () => {
		expect(assets.buildSrcSet('id', ['thumb-300', 'card-600', 'hero-1200'])).toBe(
			[
				'https://cms.yesid.dev/assets/id?key=thumb-300 300w',
				'https://cms.yesid.dev/assets/id?key=card-600 600w',
				'https://cms.yesid.dev/assets/id?key=hero-1200 1200w',
			].join(', '),
		);
	});

	it('omits the width descriptor for presets without a -NNN suffix', () => {
		// A preset like "hero-og" (no trailing digits) falls back to 1x.
		expect(assets.buildSrcSet('id', ['hero-og'])).toBe(
			'https://cms.yesid.dev/assets/id?key=hero-og',
		);
	});

	it('returns an empty string when called with an empty preset list', () => {
		expect(assets.buildSrcSet('id', [])).toBe('');
	});
});

describe('mirrored media assets', () => {
	const mirrored = createAssets('https://cms.yesid.dev', {
		allowDirectusFallback: false,
		mirroredAssets: {
			'6048a712-de42-4cca-ab51-6f92d64685c2': '/images/work/yesid-dev-home.png',
		},
	});

	it('resolves a known CMS UUID to the mirrored static path without a Directus host', () => {
		expect(mirrored.asset('6048a712-de42-4cca-ab51-6f92d64685c2')).toBe(
			'/images/work/yesid-dev-home.png',
		);
		expect(mirrored.asset('6048a712-de42-4cca-ab51-6f92d64685c2', 'card-600')).toBe(
			'/images/work/yesid-dev-home.png',
		);
	});

	it('builds mirrored srcsets without PUBLIC_DIRECTUS_URL-backed entries', () => {
		expect(
			mirrored.buildSrcSet('6048a712-de42-4cca-ab51-6f92d64685c2', [
				'thumb-300',
				'card-600',
			]),
		).toBe('/images/work/yesid-dev-home.png 300w, /images/work/yesid-dev-home.png 600w');
	});

	it('fails loud for unknown UUIDs when Directus fallback is disabled', () => {
		expect(() => mirrored.asset('unknown-uuid', 'card-600')).toThrow(
			'[assets] no mirrored media asset for "unknown-uuid"',
		);
	});

	it('keeps an explicit Directus fallback path available for dev/editing flows', () => {
		const devAssets = createAssets('https://cms.dev.yesid.dev', {
			allowDirectusFallback: true,
			mirroredAssets: {},
		});

		expect(devAssets.asset('unknown-uuid', 'card-600')).toBe(
			'https://cms.dev.yesid.dev/assets/unknown-uuid?key=card-600',
		);
	});
});
