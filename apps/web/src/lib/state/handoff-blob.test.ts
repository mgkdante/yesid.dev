import { describe, it, expect } from 'vitest';
import {
	HANDOFF_BLOB_VERSION,
	makeBlob,
	serializeBlob,
	parseBlob,
	type HandoffBlob,
} from './handoff-blob';

const sample = (): HandoffBlob =>
	makeBlob({
		path: '/about',
		scroll: { kind: 'offset', y: 120 },
		focus: { key: 'contact-message', start: 4, end: 4 },
		ts: 1000,
	});

describe('handoff-blob', () => {
	it('makeBlob stamps the current version and carries the payload', () => {
		const b = sample();
		expect(b.v).toBe(HANDOFF_BLOB_VERSION);
		expect(b.path).toBe('/about');
		expect(b.focus?.key).toBe('contact-message');
	});

	it('round-trips through serialize/parse on a matching path', () => {
		const out = parseBlob(serializeBlob(sample()), '/about');
		expect(out).not.toBeNull();
		expect(out!.scroll).toEqual({ kind: 'offset', y: 120 });
		expect(out!.focus).toEqual({ key: 'contact-message', start: 4, end: 4 });
	});

	it('discards a version mismatch (stale blob from a prior deploy)', () => {
		const stale = JSON.stringify({ ...sample(), v: 999 });
		expect(parseBlob(stale, '/about')).toBeNull();
	});

	it('discards a path mismatch (snapshot taken on a different page)', () => {
		expect(parseBlob(serializeBlob(sample()), '/projects')).toBeNull();
	});

	it('discards malformed JSON and null', () => {
		expect(parseBlob('{not json', '/about')).toBeNull();
		expect(parseBlob(null, '/about')).toBeNull();
	});
});
