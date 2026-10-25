import { describe, it, expect } from 'vitest';
import { contactContent } from './contact-page.js';

describe('contactContent', () => {
	describe('stationLabel', () => {
		it('has en key with station label text', () => {
			expect(contactContent.stationLabel.en).toContain('NEXT STOP');
		});
	});

	describe('infoTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.infoTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.command).toContain('yesid');
		});

		it('has the BEST FIT section: label + 3 lines, en and fr (homework #26b)', () => {
			expect(contactContent.infoTerminal.sectionLabels.bestFit?.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.sectionLabels.bestFit?.fr?.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.bestFit).toHaveLength(3);
			for (const line of contactContent.infoTerminal.bestFit ?? []) {
				expect(line.en.length).toBeGreaterThan(0);
				expect(line.fr?.length).toBeGreaterThan(0);
			}
		});
	});

	describe('formTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.formTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.formTerminal.command).toContain('yesid');
		});
	});

	describe('validation', () => {
		it('has required message with {field} placeholder', () => {
			expect(contactContent.validation.required.en).toContain('{field}');
		});

		it('has errorSummary with {count} placeholder', () => {
			expect(contactContent.validation.errorSummary.en).toContain('{count}');
		});
	});

	describe('success', () => {
		it('meanwhile contains {work} and {blog} placeholders', () => {
			expect(contactContent.success.meanwhile.en).toContain('{work}');
			expect(contactContent.success.meanwhile.en).toContain('{blog}');
		});
	});

	describe('socials', () => {
		it('has at least 2 social links', () => {
			expect(contactContent.socials.length).toBeGreaterThanOrEqual(2);
		});

		it('every social has label, href, and icon', () => {
			for (const s of contactContent.socials) {
				expect(s.label.en.length).toBeGreaterThan(0);
				expect(s.href.length).toBeGreaterThan(0);
				expect(s.icon.length).toBeGreaterThan(0);
			}
		});

		it('email social uses mailto:', () => {
			const email = contactContent.socials.find((s) => s.icon === 'email');
			expect(email?.href).toMatch(/^mailto:/);
		});
	});
});
