import { describe, expect, it } from 'bun:test';
import fixture from '../../fixtures/export-data.json';
import { ContactContentSchema } from './contact-page';

describe('ContactContentSchema web3formsKey', () => {
	it.each(['', '   ', '\t\r\n', '\u00a0\u2003'])('rejects blank contact key %j', (web3formsKey) => {
		const result = ContactContentSchema.safeParse({
			...fixture.data.contactPage,
			web3formsKey,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map(({ path }) => path)).toEqual([['web3formsKey']]);
		}
	});

	it.each(['synthetic-contact-key', '  synthetic-contact-key  '])('preserves non-blank contact key %j', (web3formsKey) => {
		const result = ContactContentSchema.parse({
			...fixture.data.contactPage,
			web3formsKey,
		});

		expect(result.web3formsKey).toBe(web3formsKey);
	});
});
