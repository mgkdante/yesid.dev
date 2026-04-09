import { describe, it, expect } from 'vitest';
import { heroContent, aboutContent, ctaContent, skillsJourneyPanels, skillsJourneyCta } from './content.js';

describe('heroContent', () => {
	it('has non-empty English strings', () => {
		expect(heroContent.badge.en.length).toBeGreaterThan(0);
		expect(heroContent.headline.line1.en).toBe('DIGITAL');
		expect(heroContent.headline.line2.en).toBe('INFRA');
		expect(heroContent.headline.line3.en).toBe('BUILT RIGHT.');
		expect(heroContent.subtitle.en.length).toBeGreaterThan(0);
		expect(heroContent.ctaWork.en.length).toBeGreaterThan(0);
		expect(heroContent.ctaContact.en.length).toBeGreaterThan(0);
		expect(heroContent.sqlDecoration.line1.en.length).toBeGreaterThan(0);
		expect(heroContent.sqlDecoration.line2.en.length).toBeGreaterThan(0);
		expect(heroContent.sqlDecoration.line3.en.length).toBeGreaterThan(0);
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
