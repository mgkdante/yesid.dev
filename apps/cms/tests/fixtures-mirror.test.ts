/**
 * Fixtures mirror real content (Homework #15, 2026-07-01: "mirror. Please
 * delete all lorem work").
 *
 * Disaster recovery used to restore 4 lorem projects and the retired
 * 6-service catalog. scripts/refresh-fixtures.ts now regenerates the fixture
 * JSON from the dev CMS; these hermetic checks (no network) keep the
 * committed fixtures honest in CI:
 *
 *   1. no lorem-* row survives in any of the three refreshed fixtures
 *   2. the visible service catalog is exactly the four current stations
 *   3. every published fixture project also exists in the committed
 *      generated content module (identity cross-check, parsed textually:
 *      that module is GENERATED and stays hands-off)
 *
 * Structure/identity only: content edits (titles, copy, metrics) must not
 * break this suite.
 */

import { describe, expect, it } from 'bun:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const CMS_ROOT = resolve(import.meta.dir, '..');
const FIXTURES = join(CMS_ROOT, 'fixtures', 'collections');
const GENERATED_PROJECTS_MODULE = resolve(
	CMS_ROOT,
	'../web/src/lib/content/projects.ts',
);

const CURRENT_STATIONS = [
	'database-engineering',
	'data-pipeline',
	'analytics-reporting',
	'web-development',
] as const;

interface RowWithId {
	id: string;
}

function loadFixture(name: string): RowWithId[] {
	return JSON.parse(readFileSync(join(FIXTURES, name), 'utf-8')) as RowWithId[];
}

describe('fixtures mirror real content (no lorem)', () => {
	for (const name of ['projects.json', 'services.json', 'blog-posts.json']) {
		it(`${name} contains no lorem- rows`, () => {
			const lorem = loadFixture(name)
				.map((r) => r.id)
				.filter((id) => id.startsWith('lorem-'));
			expect(lorem).toEqual([]);
		});
	}
});

describe('services fixture matches the four-station catalog', () => {
	it('visible services are exactly the current stations', () => {
		const services = loadFixture('services.json') as Array<RowWithId & { visible: boolean }>;
		const visible = services
			.filter((s) => s.visible)
			.map((s) => s.id)
			.sort();
		expect(visible).toEqual([...CURRENT_STATIONS].sort());
	});
});

describe('projects fixture cross-checks the committed generated module', () => {
	it('every published fixture project id appears in content/projects.ts', () => {
		const projects = loadFixture('projects.json') as Array<RowWithId & { status: string }>;
		expect(projects.length).toBeGreaterThan(0);
		const generated = readFileSync(GENERATED_PROJECTS_MODULE, 'utf-8');
		const missing = projects
			.filter((p) => p.status === 'published')
			.map((p) => p.id)
			.filter((id) => !generated.includes(`'${id}'`) && !generated.includes(`"${id}"`));
		expect(missing).toEqual([]);
	});
});

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, 'utf8')) as T;
}

const CONSENT_DESCRIPTIONS = {
	en: {
		fixture: 'site-labels.json',
		copy: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
	},
	fr: {
		fixture: 'site-labels.fr.json',
		copy: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
	},
	es: {
		fixture: 'site-labels.es.json',
		copy: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
	},
} as const satisfies Record<'en' | 'fr' | 'es', { fixture: string; copy: string }>;

const SOURCE_PRESERVATION_SHA256 = {
	'site-labels.json': '04f75b348f0287dd637a5f8e87b1f45caa43a1d475f22307c80b3644abbd2217',
	'site-labels.fr.json': '9cb55b693bbc431ee259291627dcaac8e3308565f44013ec7dc690c6d050d3dd',
	'site-labels.es.json': '52ebd03c73a03b53f9f61eaf798124fae9c8a38bac3a1ede01e5dceaf4eca6ec',
} as const;

const CONSENT_DESCRIPTION_SENTINEL = '<task-6-consent-description>';
const APPROVED_GRAFFITI_LABELS = {
	'site-labels.fr.json': {
		current: 'graffiti LA FIN',
		preimage: 'graffiti THE END',
	},
} as const;
function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}

function canonicalJson(raw: string): string {
	return `${JSON.stringify(JSON.parse(raw), null, '\t')}\n`;
}

function normalizeApprovedLabelBytes(raw: string, fixture: string): string {
	const labels = JSON.parse(raw) as Record<string, string>;
	labels.ui_analytics_consent_description = CONSENT_DESCRIPTION_SENTINEL;

	const graffiti = APPROVED_GRAFFITI_LABELS[
		fixture as keyof typeof APPROVED_GRAFFITI_LABELS
	];
	if (graffiti) {
		if (labels.a11y_closer_graffiti !== graffiti.current) {
			throw new Error(`unexpected approved graffiti label in ${fixture}`);
		}
		labels.a11y_closer_graffiti = graffiti.preimage;
	}

	return `${JSON.stringify(labels, null, '\t')}\n`;
}

describe('approved analytics consent fixture copy', () => {
	for (const locale of ['en', 'fr', 'es'] as const) {
		it(`uses the approved ${locale.toUpperCase()} consent description`, () => {
			const { fixture, copy } = CONSENT_DESCRIPTIONS[locale];
			const labels = readJson<Record<string, string>>(
				join(CMS_ROOT, 'fixtures', 'content', fixture),
			);
			expect(labels.ui_analytics_consent_description).toBe(copy);
		});
	}
});

describe('source preservation allows only the approved consent and graffiti labels', () => {
	for (const { fixture } of Object.values(CONSENT_DESCRIPTIONS)) {
		it(`${fixture} differs only at the authorized labels`, () => {
			const raw = readFileSync(join(CMS_ROOT, 'fixtures', 'content', fixture), 'utf8');
			expect(raw).toBe(canonicalJson(raw));
			expect(sha256(normalizeApprovedLabelBytes(raw, fixture))).toBe(
				SOURCE_PRESERVATION_SHA256[fixture],
			);
		});
	}

});
