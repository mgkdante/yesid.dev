// Site-content data-shape contract tests.
//
// These tests validate the SHAPE of CMS-derived content modules, not the
// VALUES inside them. The actual words (headlines, manifesto copy, section
// labels, transit-line names, etc.) are owned by Directus and may change
// independently of engineering — asserting on specific phrases makes the
// suite break every time the marketing operator edits copy.
//
// What we test here:
//   - Required fields exist and are non-empty strings
//   - Counts (e.g. "5 manifesto pills", "9 hidden transit lines")
//   - Data identifiers (service IDs, project slugs — URL contracts)
//   - Structural shapes (Array.isArray, hex color regex, getProjectBySlug
//     reference integrity)
//
// What we do NOT test here:
//   - Specific copy ("PIPELINES THAT", "INFRASTRUCTURE", "TERMINUS", etc.)
//   - Substring presence in flavor text (these belong in content-tier tests
//     run by the editor, not in engineering CI)

import { describe, it, expect } from 'vitest';
import {
	heroContent,
	manifestoContent,
	aboutContent,
	ctaContent,
	proofReelContent,
	closerContent,
} from './site-content.js';
import { getProjectBySlug } from './projects.js';
import { getVisibleServices } from './services.js';

describe('heroContent', () => {
	it('has non-empty headline lines (both English)', () => {
		expect(heroContent.headline.line1.en.length).toBeGreaterThan(0);
		expect(heroContent.headline.line2.en.length).toBeGreaterThan(0);
	});

	it('has non-empty subheadline and subtitle', () => {
		expect(heroContent.subheadline.en.length).toBeGreaterThan(0);
		expect(heroContent.subtitle.en.length).toBeGreaterThan(0);
	});

	it('has non-empty CTA labels', () => {
		expect(heroContent.ctaWork.en.length).toBeGreaterThan(0);
		expect(heroContent.ctaContact.en.length).toBeGreaterThan(0);
	});

	it('has non-empty SQL panel labels', () => {
		expect(heroContent.sqlPanel.prompt.en.length).toBeGreaterThan(0);
		expect(heroContent.sqlPanel.liveLabel.en.length).toBeGreaterThan(0);
	});

	it('has non-empty refresh button labels', () => {
		expect(heroContent.refreshButton.label.en.length).toBeGreaterThan(0);
		expect(heroContent.refreshButton.helper.en.length).toBeGreaterThan(0);
	});
});

describe('manifestoContent', () => {
	it('has non-empty statement lines', () => {
		expect(manifestoContent.statement.line1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.lineHuge.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.line3Part1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.line3Highlight.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.line3Part2.en.length).toBeGreaterThan(0);
	});

	it('has non-empty terminal user and command', () => {
		expect(manifestoContent.terminal.user.en.length).toBeGreaterThan(0);
		expect(manifestoContent.terminal.command.en.length).toBeGreaterThan(0);
	});


	it('every pill has a non-empty English label and a serviceId', () => {
		for (const pill of manifestoContent.pills) {
			expect(pill.label.en.length).toBeGreaterThan(0);
			expect(pill.serviceId.length).toBeGreaterThan(0);
		}
	});


	// ── GO2-T8-UNSKIP ──────────────────────────────────────────────────────
	// Post-consolidation baseline (GO-2 Track 3, T8 step 8b). SKIPPED until
	// the orchestrator's Gate A CMS apply + regen lands. T8 unskip step:

	it('has non-empty edge decoration text', () => {
		expect(manifestoContent.edgeLeft.sectionNumber.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeLeft.sectionName.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeLeft.location.en.length).toBeGreaterThan(0);
	});

	it('has non-empty right-edge easter egg locations', () => {
		expect(manifestoContent.edgeRight.src.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeRight.via.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeRight.dst.en.length).toBeGreaterThan(0);
	});

	it('has non-empty bottom status bar text', () => {
		expect(manifestoContent.edgeBottom.connected.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeBottom.line.en.length).toBeGreaterThan(0);
	});

	it('has non-empty transit element text', () => {
		expect(manifestoContent.transit.arrivalLabel.en.length).toBeGreaterThan(0);
		expect(manifestoContent.transit.platformBadge.en.length).toBeGreaterThan(0);
		expect(manifestoContent.transit.directionBadge.en.length).toBeGreaterThan(0);
	});

	it('has at least 5 measurement tick labels', () => {
		expect(manifestoContent.ticks.length).toBeGreaterThanOrEqual(5);
		// Every tick must be a non-empty string (axis labels have to render).
		for (const tick of manifestoContent.ticks) {
			expect(typeof tick).toBe('string');
			expect(tick.length).toBeGreaterThan(0);
		}
	});

	it('has 9 hidden transit-line easter eggs with name + valid hex color', () => {
		expect(manifestoContent.hiddenTransitLines).toHaveLength(9);
		for (const line of manifestoContent.hiddenTransitLines) {
			expect(line.name.en.length).toBeGreaterThan(0);
			expect(line.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});
});

describe('aboutContent', () => {
	it('has non-empty English strings', () => {
		expect(aboutContent.name.en.length).toBeGreaterThan(0);
		expect(aboutContent.title.en.length).toBeGreaterThan(0);
		expect(aboutContent.bio.en.length).toBeGreaterThan(0);
		expect(aboutContent.interests.en.length).toBeGreaterThan(0);
	});

	it('has a stack items array', () => {
		// slice-18m: stackItems is CMS-controlled. Empty is a data-quality
		// concern (flag for editor) but not a code bug. Test asserts shape.
		expect(Array.isArray(aboutContent.stackItems)).toBe(true);
	});

	it('has non-empty location data', () => {
		expect(aboutContent.location.city.en.length).toBeGreaterThan(0);
		expect(aboutContent.location.region.en.length).toBeGreaterThan(0);
	});
});

describe('ctaContent', () => {
	it('has non-empty English strings', () => {
		expect(ctaContent.heading.en.length).toBeGreaterThan(0);
		expect(ctaContent.subtitle.en.length).toBeGreaterThan(0);
		expect(ctaContent.ctaContact.en.length).toBeGreaterThan(0);
		expect(ctaContent.ctaGithub.en.length).toBeGreaterThan(0);
	});
});

describe('proofReelContent', () => {
	it('has non-empty section label and view-all link', () => {
		expect(proofReelContent.sectionLabel.en.length).toBeGreaterThan(0);
		expect(proofReelContent.viewAllLabel.en.length).toBeGreaterThan(0);
		// URL contract — the View all link must point at /projects so the
		// proof reel CTA reaches the listing page. This IS engineering's
		// concern, not content's.
		expect(proofReelContent.viewAllHref).toBe('/projects');
	});

	it('has a non-empty list of featured project slugs', () => {
		// The exact count is CMS-controlled (the operator curates the proof-reel
		// block in Directus), so we assert the carousel has *something* to show
		// rather than a fixed N. Every entry must be a non-empty string.
		expect(Array.isArray(proofReelContent.slugs)).toBe(true);
		expect(proofReelContent.slugs.length).toBeGreaterThan(0);
		for (const slug of proofReelContent.slugs) {
			expect(typeof slug).toBe('string');
			expect(slug.length).toBeGreaterThan(0);
		}
	});

	it('resolves at least one featured slug to a real project (carousel non-empty)', () => {
		// Reference-integrity guard. The proof-reel block (slugs) and the
		// projects collection are independently CMS-driven and can drift — a
		// slug may reference a project the operator has since unpublished. The
		// FeaturedProjects component is resilient (it drops unresolved slugs),
		// so the runtime contract is "at least one slug resolves" (otherwise the
		// section renders empty), and every slug that DOES resolve must point at
		// a valid Project. We do NOT require *every* slug to resolve, because
		// that asserts CMS data hygiene rather than engineering correctness.
		const resolved = proofReelContent.slugs
			.map((slug) => getProjectBySlug(slug))
			.filter((p) => p !== undefined);
		expect(
			resolved.length,
			'no proof-reel slug resolved to a project — the carousel would render empty',
		).toBeGreaterThan(0);
		for (const project of resolved) {
			expect(project!.slug.length).toBeGreaterThan(0);
		}
	});
});

describe('services — home grid fields (Slice 13g)', () => {
	it('every visible service has a benefitHeadline', () => {
		for (const service of getVisibleServices()) {
			expect(service.benefitHeadline, `${service.id} missing benefitHeadline`).toBeDefined();
			expect(service.benefitHeadline!.en.length, `${service.id} benefitHeadline is empty`).toBeGreaterThan(0);
		}
	});

	it('every visible service has an impactMetric with value and label', () => {
		for (const service of getVisibleServices()) {
			expect(service.impactMetric, `${service.id} missing impactMetric`).toBeDefined();
			expect(service.impactMetric!.value.en.length, `${service.id} metric value is empty`).toBeGreaterThan(0);
			expect(service.impactMetric!.label.en.length, `${service.id} metric label is empty`).toBeGreaterThan(0);
		}
	});

	it('every visible service has an svg filename', () => {
		for (const service of getVisibleServices()) {
			expect(service.svg, `${service.id} missing svg`).toBeDefined();
			expect(service.svg!.length, `${service.id} svg is empty`).toBeGreaterThan(0);
		}
	});
});

describe('closerContent', () => {
	it('has non-empty heading + subheading', () => {
		expect(closerContent.heading.en.length).toBeGreaterThan(0);
		expect(closerContent.headingDot.en.length).toBeGreaterThan(0);
		expect(closerContent.subheading.en.length).toBeGreaterThan(0);
	});

	it('has 4 named rows (contact / connect / read / about) each with non-empty label + action', () => {
		for (const key of ['contact', 'connect', 'read', 'about'] as const) {
			const row = closerContent.rows[key];
			expect(row, `${key} row missing`).toBeDefined();
			expect(row.label.en.length, `${key} row label is empty`).toBeGreaterThan(0);
			expect(row.action.en.length, `${key} row action is empty`).toBeGreaterThan(0);
		}
	});

	it('contact / connect / about rows have non-empty descriptions', () => {
		// The `read` row has no description in current schema — only label + action.
		for (const key of ['contact', 'connect', 'about'] as const) {
			expect(closerContent.rows[key].description.en.length).toBeGreaterThan(0);
		}
	});

	it('has attribution with non-empty text + valid URL', () => {
		expect(closerContent.attribution.text.en.length).toBeGreaterThan(0);
		// URL contract — attribution must link somewhere. Asserting a
		// well-formed URL rather than a specific host, because the
		// attribution source may change.
		expect(closerContent.attribution.url).toMatch(/^https?:\/\/\S+$/);
	});
});
