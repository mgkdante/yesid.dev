import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const evidence = readFileSync(
	join(import.meta.dir, '../ops/legal/processor-evidence-2026-07-11.md'),
	'utf8'
);
const cmsReadme = readFileSync(join(import.meta.dir, '../README.md'), 'utf8');
const envExample = readFileSync(join(import.meta.dir, '../.env.example'), 'utf8');

describe('production processor evidence', () => {
	test('tracks the five actual providers and the retained contact path', () => {
		expect(evidence).toContain('browser -> Web3Forms -> Proton Mail inbox -> operator');

		for (const heading of [
			'### Vercel',
			'### Web3Forms',
			'### Proton Mail',
			'### Cal.com',
			'### Plausible Analytics Cloud'
		]) {
			expect(evidence).toContain(heading);
		}

		expect(evidence).not.toContain('| Resend |');
		expect(evidence).not.toContain('### Resend');
	});

	test('cannot resurrect the cancelled contact cutover as an action', () => {
		expect(evidence).toContain(
			'The cancelled Resend proposal is historical only. It is not a production provider'
		);
		expect(evidence).toContain(
			'Vercel serves the public commercial services site. The current contact form does not make Vercel process form fields.'
		);

		for (const staleInstruction of [
			'forms.yesid.dev',
			'/api/contact',
			'RESEND_API_KEY',
			'after a proven contact cutover',
			'Block contact cutover',
			'revoke the Web3Forms access key'
		]) {
			expect(evidence).not.toContain(staleInstruction);
		}
	});

	test('keeps operator and licensed-advisor gates explicit', () => {
		expect(evidence).toContain('No adequate-protection conclusion is recorded here.');
		expect(evidence).toContain('licensed Québec legal advisor');
		expect(evidence).toContain('operator approval');
		expect(evidence).toContain('zero recorded incidents is not proof that no earlier incident occurred');
	});

	test('records the current Plausible goals and later Vercel upgrade without stale gates', () => {
		for (const goal of [
			'404',
			'contact_form_success',
			'booking_click',
			'direct_contact_click',
			'project_proof_click'
		]) {
			expect(evidence).toContain(`\`${goal}\``);
		}

		expect(evidence).toContain('property-free event goals');
		expect(evidence).toContain('not a technical publication or deployment gate');
		expect(evidence).not.toContain('before the next deployment');
		expect(evidence).not.toContain('Working target: 2026-07-25');
		expect(evidence).not.toContain('They did not return `contact_form_success`');
		expect(evidence).not.toContain('accidentally created `contact_form_success`');
	});

	test('records the unresolved Web3Forms retention contradiction', () => {
		expect(evidence).toContain('30 days of form-submission history');
		expect(evidence).toContain('lists Free as up to three years');
		expect(evidence).toContain('logs containing personally identifiable information are deleted every two months');
		expect(evidence).toContain('These first-party statements are inconsistent');
		expect(evidence).toContain('30-day history must not be treated as a deletion period');
	});

	test('does not present unconfigured Directus Resend SMTP as live production truth', () => {
		expect(cmsReadme).not.toContain('| Email | Resend (SMTP transport) |');
		expect(envExample).not.toContain('SMTP_HOST=smtp.resend.com');
		expect(envExample).not.toContain('EMAIL_SMTP_USER=resend');
		expect(evidence).toContain(
			'neither live CMS service configures an SMTP transport, host, or user'
		);
	});
});
