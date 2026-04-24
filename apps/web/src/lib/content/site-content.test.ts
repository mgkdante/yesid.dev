import { describe, it, expect } from 'vitest';
import { heroContent, manifestoContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta, proofReelContent, closerContent } from './site-content.js';
import { getProjectBySlug } from './projects.js';
import { getVisibleServices } from './services.js';

describe('heroContent', () => {
	it('has headline lines as non-empty English strings', () => {
		expect(heroContent.headline.line1.en).toBe('PIPELINES THAT');
		expect(heroContent.headline.line2.en).toBe("DON'T BREAK.");
	});

	it('has subheadline text', () => {
		expect(heroContent.subheadline.en).toBe('Data that tell the truth.');
	});

	it('has subtitle text', () => {
		expect(heroContent.subtitle.en.length).toBeGreaterThan(0);
	});

	it('has CTA labels', () => {
		expect(heroContent.ctaWork.en.length).toBeGreaterThan(0);
		expect(heroContent.ctaContact.en.length).toBeGreaterThan(0);
	});

	it('has SQL panel labels', () => {
		expect(heroContent.sqlPanel.prompt.en).toContain('yesid@transit');
		expect(heroContent.sqlPanel.liveLabel.en).toBe('LIVE');
	});

	it('has refresh button labels', () => {
		expect(heroContent.refreshButton.label.en).toContain('PULL');
		expect(heroContent.refreshButton.helper.en.length).toBeGreaterThan(0);
	});
});

describe('manifestoContent', () => {
	it('has statement lines as LocalizedString', () => {
		expect(manifestoContent.statement.line1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.lineHuge.en).toBe('INFRASTRUCTURE');
		expect(manifestoContent.statement.line3Part1.en.length).toBeGreaterThan(0);
		expect(manifestoContent.statement.line3Highlight.en).toBe('OPERATIONS');
		expect(manifestoContent.statement.line3Part2.en.length).toBeGreaterThan(0);
	});

	it('has terminal prompt as LocalizedString', () => {
		expect(manifestoContent.terminal.user.en).toContain('yesid');
		expect(manifestoContent.terminal.command.en).toContain('cat');
	});

	it('has exactly 5 capability pills', () => {
		expect(manifestoContent.pills).toHaveLength(5);
	});

	it('every pill has an English label and a serviceId', () => {
		for (const pill of manifestoContent.pills) {
			expect(pill.label.en.length).toBeGreaterThan(0);
			expect(pill.serviceId.length).toBeGreaterThan(0);
		}
	});

	it('pills map to expected service IDs', () => {
		const serviceIds = manifestoContent.pills.map((p) => p.serviceId);
		expect(serviceIds).toEqual([
			'data-pipeline',
			'database-engineering',
			'analytics-reporting',
			'internal-tooling',
			'web-development',
		]);
	});

	it('has edge decoration text as LocalizedString', () => {
		expect(manifestoContent.edgeLeft.sectionNumber.en).toContain('SEC');
		expect(manifestoContent.edgeLeft.sectionName.en).toBe('MANIFESTO');
		expect(manifestoContent.edgeLeft.location.en).toContain('MTL');
	});

	it('has right edge with easter egg locations', () => {
		expect(manifestoContent.edgeRight.src.en).toContain('Sherbrooke');
		expect(manifestoContent.edgeRight.via.en).toContain('Lennoxville');
		expect(manifestoContent.edgeRight.dst.en).toContain('Montréal');
	});

	it('has bottom status bar text', () => {
		expect(manifestoContent.edgeBottom.connected.en.length).toBeGreaterThan(0);
		expect(manifestoContent.edgeBottom.line.en).toContain('ORANGE');
	});

	it('has transit element text', () => {
		expect(manifestoContent.transit.arrivalLabel.en).toContain('PROCHAIN');
		expect(manifestoContent.transit.platformBadge.en).toContain('QUAI');
		expect(manifestoContent.transit.directionBadge.en).toContain('CENTRE-VILLE');
	});

	it('has measurement tick labels', () => {
		expect(manifestoContent.ticks.length).toBeGreaterThanOrEqual(5);
		expect(manifestoContent.ticks[0]).toBe('0');
	});

	it('has 9 hidden transit line easter eggs with name and color', () => {
		expect(manifestoContent.hiddenTransitLines).toHaveLength(9);
		for (const line of manifestoContent.hiddenTransitLines) {
			expect(line.name.en.length).toBeGreaterThan(0);
			expect(line.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});

	it('includes STM, REM, and Exo transit lines', () => {
		const names = manifestoContent.hiddenTransitLines.map((l) => l.name.en);
		expect(names).toContain('LIGNE BLEUE');
		expect(names).toContain('LIGNE VERTE');
		expect(names).toContain('LIGNE JAUNE');
		expect(names).toContain('REM');
		expect(names.some((n) => n.includes('VAUDREUIL'))).toBe(true);
		expect(names.some((n) => n.includes('MASCOUCHE'))).toBe(true);
	});
});

describe('aboutContent', () => {
	it('has non-empty English strings', () => {
		expect(aboutContent.name.en).toBe('Yesid O.');
		expect(aboutContent.title.en.length).toBeGreaterThan(0);
		expect(aboutContent.bio.en.length).toBeGreaterThan(0);
		expect(aboutContent.interests.en.length).toBeGreaterThan(0);
	});

	it('has at least 3 stack items', () => {
		expect(aboutContent.stackItems.length).toBeGreaterThanOrEqual(3);
	});

	it('has location data', () => {
		expect(aboutContent.location.city.en).toBe('Montreal');
		expect(aboutContent.location.region.en.length).toBeGreaterThan(0);
	});
});

describe('ctaContent', () => {
	it('has non-empty English strings', () => {
		expect(ctaContent.heading.en).toContain('build something');
		expect(ctaContent.subtitle.en.length).toBeGreaterThan(0);
		expect(ctaContent.ctaContact.en.length).toBeGreaterThan(0);
		expect(ctaContent.ctaGithub.en.length).toBeGreaterThan(0);
	});
});

describe('skillsJourneyPanels', () => {
	it('has at least 1 panel', () => {
		expect(skillsJourneyPanels.length).toBeGreaterThanOrEqual(1);
	});

	it('every panel has a unique id', () => {
		const ids = skillsJourneyPanels.map((p) => p.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('every panel has at least one skill', () => {
		for (const panel of skillsJourneyPanels) {
			expect(panel.skills.length).toBeGreaterThanOrEqual(1);
		}
	});

	it('every panel has at least one highlight word', () => {
		for (const panel of skillsJourneyPanels) {
			expect(panel.highlightWords.length).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('skillsJourneyCta', () => {
	it('has prompt and button text', () => {
		expect(skillsJourneyCta.prompt.en).toBeTruthy();
		expect(skillsJourneyCta.button.en).toBeTruthy();
	});
});

describe('proofReelContent', () => {
	it('has section label and view-all link', () => {
		expect(proofReelContent.sectionLabel.en).toBe('// PROOF');
		expect(proofReelContent.viewAllLabel.en).toContain('View all projects');
		expect(proofReelContent.viewAllHref).toBe('/projects');
	});

	it('has exactly 3 featured project slugs', () => {
		expect(proofReelContent.slugs).toHaveLength(3);
	});

	it('slugs match existing projects', () => {
		for (const slug of proofReelContent.slugs) {
			const project = getProjectBySlug(slug);
			expect(project).toBeDefined();
			expect(project?.impactMetric).toBeDefined();
		}
	});

	it('slugs are in expected order', () => {
		expect(proofReelContent.slugs).toEqual([
			'transit-data-pipeline',
			'lorem-analytics-dashboard',
			'lorem-database-migration',
		]);
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
	it('has heading and subheading', () => {
		expect(closerContent.heading.en).toBe('TERMINUS');
		expect(closerContent.headingDot.en).toBe('.');
		expect(closerContent.subheading.en).toContain('END OF LINE');
	});

	it('has contact row with label, description, and action', () => {
		expect(closerContent.rows.contact.label.en).toBe('CONTACT');
		expect(closerContent.rows.contact.description.en.length).toBeGreaterThan(0);
		expect(closerContent.rows.contact.action.en).toContain('GO');
	});

	it('has connect row with label, description, and action', () => {
		expect(closerContent.rows.connect.label.en).toBe('EXPLORE');
		expect(closerContent.rows.connect.description.en).toContain('GitHub');
		expect(closerContent.rows.connect.action.en).toContain('GO');
	});

	it('has read row with label and action', () => {
		expect(closerContent.rows.read.label.en).toBe('READ');
		expect(closerContent.rows.read.action.en).toBe('cd');
	});

	it('has about row with label, description, and action', () => {
		expect(closerContent.rows.about.label.en).toBe('ABOUT');
		expect(closerContent.rows.about.description.en).toContain('Yesid');
		expect(closerContent.rows.about.action.en).toBe('cd');
	});

	it('has attribution with text and URL', () => {
		expect(closerContent.attribution.text.en).toContain('Vecteezy');
		expect(closerContent.attribution.url).toContain('vecteezy.com');
	});
});
