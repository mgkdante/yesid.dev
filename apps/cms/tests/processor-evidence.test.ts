import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const evidence = readFileSync(
	join(import.meta.dir, '../ops/legal/processor-evidence-2026-07-11.md'),
	'utf8'
);

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
});
