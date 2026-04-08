import { describe, it, expect } from 'vitest';
import { contactContent } from './contact-page.js';

describe('contactContent', () => {
	describe('stationLabel', () => {
		it('has en key with CONTACT text', () => {
			expect(contactContent.stationLabel.en).toContain('CONTACT');
		});
	});

	describe('infoTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.infoTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.command).toContain('yesid');
		});

		it('has all LocalizedString fields with en key', () => {
			expect(contactContent.infoTerminal.status.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.availability.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.location.en.length).toBeGreaterThan(0);
			expect(contactContent.infoTerminal.responseTime.en.length).toBeGreaterThan(0);
		});
	});

	describe('formTerminal', () => {
		it('has terminal title and command', () => {
			expect(contactContent.formTerminal.title.length).toBeGreaterThan(0);
			expect(contactContent.formTerminal.command).toContain('yesid');
		});

		it('has commandOutput with en key', () => {
			expect(contactContent.formTerminal.commandOutput.en.length).toBeGreaterThan(0);
		});

		it('has all three form fields with label and placeholder', () => {
			for (const key of ['name', 'email', 'message'] as const) {
				const field = contactContent.formTerminal.fields[key];
				expect(field.label.length).toBeGreaterThan(0);
				expect(field.placeholder.en.length).toBeGreaterThan(0);
			}
		});

		it('has submit label', () => {
			expect(contactContent.formTerminal.submitLabel.en.length).toBeGreaterThan(0);
		});
	});

	describe('validation', () => {
		it('has required message with {field} placeholder', () => {
			expect(contactContent.validation.required.en).toContain('{field}');
		});

		it('has invalidEmail message', () => {
			expect(contactContent.validation.invalidEmail.en.length).toBeGreaterThan(0);
		});

		it('has errorSummary with {count} placeholder', () => {
			expect(contactContent.validation.errorSummary.en).toContain('{count}');
		});
	});

	describe('success', () => {
		it('has all success messages with en key', () => {
			expect(contactContent.success.validating.en.length).toBeGreaterThan(0);
			expect(contactContent.success.sending.en.length).toBeGreaterThan(0);
			expect(contactContent.success.sent.en.length).toBeGreaterThan(0);
			expect(contactContent.success.responseTime.en.length).toBeGreaterThan(0);
			expect(contactContent.success.meanwhile.en.length).toBeGreaterThan(0);
			expect(contactContent.success.resetLabel.en.length).toBeGreaterThan(0);
		});

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
				expect(s.label.length).toBeGreaterThan(0);
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
