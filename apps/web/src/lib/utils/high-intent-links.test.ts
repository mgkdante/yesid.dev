import { describe, expect, it } from 'vitest';
import { isDirectContactHref, isProjectProofHref } from './high-intent-links';

describe('isDirectContactHref', () => {
	it.each([
		'mailto:contact@yesid.dev',
		'tel:+18194465594',
		'https://wa.me/18194465594',
	])('accepts the approved direct-contact URL %s', (href) => {
		expect(isDirectContactHref(href)).toBe(true);
	});

	it.each([
		'',
		'not a url',
		'mailto:',
		'mailto:contact',
		'tel:',
		'tel:+',
		'https://wa.me/',
		'http://wa.me/18194465594',
		'https://wa.me:8443/18194465594',
		'https://wa.me.evil.example/18194465594',
		'https://github.com/mgkdante',
		'https://www.linkedin.com/in/otaloray/',
		'https://cal.com/yesid-dev',
		'https://example.com/contact',
	])('rejects the ineligible direct-contact URL %s', (href) => {
		expect(isDirectContactHref(href)).toBe(false);
	});
});

describe('isProjectProofHref', () => {
	it.each([
		'https://yesid.dev',
		'https://github.com/mgkdante/yesid.dev',
		'http://localhost:4173/demo',
	])('accepts the absolute web proof URL %s', (href) => {
		expect(isProjectProofHref(href)).toBe(true);
	});

	it.each([
		'',
		'not a url',
		'/projects/yesid-dev',
		'mailto:contact@yesid.dev',
		'tel:+18194465594',
		'javascript:alert(1)',
		'https://user:password@example.com/private',
	])('rejects the ineligible project-proof URL %s', (href) => {
		expect(isProjectProofHref(href)).toBe(false);
	});
});
