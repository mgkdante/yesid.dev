import { describe, expect, it } from 'vitest';
import { takeEarlyLocalePosition } from './early-locale-position';

const href = 'https://yesid.dev/fr/projects/translated-slug';
const saved = { v: 1, to: href, ts: 1_000, measurement: {
	sections: [{ top: -100, bottom: 500, height: 600 }], viewportHeight: 800, y: 900, bulkExpanded: true,
} };
function storage(value: unknown) {
	const values = new Map([['yesid:early-locale', JSON.stringify(value)]]);
	return { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => { values.delete(key); } };
}

describe('early locale reading position', () => {
	it('maps captured geometry through the normal reading strategy and consumes it once', () => {
		const store = storage(saved);
		expect(takeEarlyLocalePosition(() => store, href, 2_000)).toMatchObject({ kind: 'detail-section', index: 0, progress: 0.5 });
		expect(takeEarlyLocalePosition(() => store, href, 2_000)).toBeNull();
	});
	it.each([
		{ ...saved, to: 'https://yesid.dev/fr/projects/another-project' },
		{ ...saved, v: 2 }, { ...saved, ts: -200_000 }, { ...saved, ts: 3_000 },
		{ ...saved, measurement: { ...saved.measurement, viewportHeight: 0 } },
		{ ...saved, measurement: { ...saved.measurement, sections: [null] } },
		{ ...saved, measurement: { ...saved.measurement, sections: [{ height: 600 }] } },
	])('discards stale, unrelated or invalid captures', (value) => {
		const store = storage(value);
		expect(takeEarlyLocalePosition(() => store, href, 2_000)).toBeNull();
		expect(store.getItem('yesid:early-locale')).toBeNull();
	});
	it('leaves navigation usable when storage is unavailable', () => {
		expect(takeEarlyLocalePosition(() => ({ getItem() { throw new Error('denied'); }, removeItem() {} }), href, 2_000)).toBeNull();
	});
	it('catches browser storage getter denial before any storage method runs', () => {
		expect(takeEarlyLocalePosition(() => { throw new DOMException('denied', 'SecurityError'); }, href, 2_000)).toBeNull();
	});
});
