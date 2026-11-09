import { describe, expect, it } from 'vitest';
import { alignTarget, measurePosition, planRestore, type SectionBox } from './reading-position-plan';

const saved = {
	kind: 'detail-section', index: 1, count: 2, progress: 0.5, y: 800,
	insideBody: true, bulkExpanded: true,
};
const current = { sectionCount: 2, bulkExpanded: true, canReveal: true };
const section = { kind: 'section', index: 1, progress: 0.5, reveal: true };

// All geometry is viewport-relative; the reading line is at 200.
describe('measurePosition', () => {
	it.each([
		{ name: 'inside an open body', top: 100, bottom: 500, open: true, insideBody: true },
		{ name: 'inside a closed (inert) body', top: 100, bottom: 500, open: false, insideBody: false },
		{ name: 'before the body', top: 201, bottom: 500, open: true, insideBody: false },
		{ name: 'at the body bottom', top: 100, bottom: 200, open: true, insideBody: false },
	])('$name', ({ top, bottom, open, insideBody }) => {
		const sections = [
			{ top: -200, bottom: 0, height: 200 },
			{ top: 0, bottom: 800, height: 800, body: { top, bottom, open } },
		];
		expect(measurePosition({ sections, viewportHeight: 800, y: 900, bulkExpanded: true }))
			.toEqual({ ...saved, progress: 0.25, y: 900, insideBody });
	});

	it.each([
		{ name: 'above the article', sections: [{ top: 300, bottom: 800, height: 500 }] },
		{ name: 'after the article', sections: [{ top: -400, bottom: 200, height: 600 }] },
		{ name: 'between sections', sections: [{ top: 0, bottom: 150, height: 150 }, { top: 250, bottom: 800, height: 550 }] },
		{ name: 'without sections', sections: [] },
	])('keeps the offset $name', ({ sections }) => {
		expect(measurePosition({ sections, viewportHeight: 800, y: 75, bulkExpanded: false }))
			.toEqual({ kind: 'offset', y: 75 });
	});

	it.each([false, true])('captures bulkExpanded=%s and the first matching section', (bulkExpanded) => {
		const sections: SectionBox[] = [{ top: 200, bottom: 400, height: 200 }, { top: 0, bottom: 800, height: 800 }];
		expect(measurePosition({ sections, viewportHeight: 800, y: 0, bulkExpanded })).toEqual({
			kind: 'detail-section', index: 0, count: 2, progress: 0, y: 0, insideBody: false, bulkExpanded,
		});
	});
});

describe('planRestore', () => {
	it('history keeps the captured offset when the reader is expanded (24f684d)', () => {
		expect(planRestore(saved, current, 'history')).toEqual({ kind: 'offset', y: 800 });
	});

	it.each([
		{ name: 'history reveals an expanded snapshot in a collapsed view', reason: 'history', now: { bulkExpanded: false }, expected: section },
		{ name: 'locale always maps expanded progress', reason: 'locale', now: {}, expected: section },
		{ name: 'locale maps collapsed progress', reason: 'locale', now: { bulkExpanded: false }, expected: section },
		{ name: 'no reveal capability', reason: 'locale', now: { canReveal: false }, expected: { ...section, reveal: false } },
		{ name: 'count mismatch', reason: 'locale', now: { sectionCount: 3 }, expected: { kind: 'offset', y: 800 } },
	] as const)('$name', ({ reason, now, expected }) => {
		expect(planRestore(saved, { ...current, ...now }, reason)).toEqual(expected);
	});

	it.each([
		{ kind: 'heading-index' },
		{ ...saved, progress: NaN, y: NaN },
		{ kind: 'offset', y: NaN }, null, undefined, 42, 'old',
		{ ...saved, index: -1, y: NaN }, { ...saved, index: 2, y: NaN },
		{ ...saved, index: 0.5, y: NaN }, { ...saved, progress: Infinity, y: Infinity },
	])('degrades invalid locale snapshot %j to a finite offset', (snapshot) => {
		expect(planRestore(snapshot, current, 'locale')).toEqual({ kind: 'offset', y: 0 });
	});

	it.each([null, { kind: 'offset', y: 100 }, { ...saved, insideBody: false }])(
		'leaves history outside a body native: %j', (snapshot) => {
			expect(planRestore(snapshot, current, 'history')).toEqual({ kind: 'native' });
		},
	);

	it.each([NaN, Infinity, undefined])('stays after cancelling expanded history with y=%s', (y) => {
		expect(planRestore({ ...saved, y }, current, 'history')).toEqual({ kind: 'stay' });
	});

	it.each([-0.5, 1.5])('clamps section progress %s', (progress) => {
		expect(planRestore({ ...saved, progress, insideBody: false }, current, 'locale'))
			.toEqual({ ...section, progress: progress < 0 ? 0 : 1, reveal: false });
	});

	it.each(['history', 'locale'] as const)('clamps negative offsets for %s', (reason) => {
		expect(planRestore({ ...saved, y: -10 }, current, reason)).toEqual(
			reason === 'history' ? { kind: 'offset', y: 0 } : section,
		);
		expect(planRestore({ kind: 'heading-index', insideBody: true, y: -10 }, current, reason))
			.toEqual({ kind: 'offset', y: 0 });
	});
});

describe('alignTarget', () => {
	it.each([
		{ top: -200, height: 1800, progress: 0.5, scrollY: 800, expected: 1300 },
		{ top: 0, height: 100, progress: 0, scrollY: 0, expected: 0 },
		{ top: 200, height: 400, progress: 1, scrollY: 0, expected: 400 },
	])('aligns viewport geometry %j', ({ top, height, progress, scrollY, expected }) => {
		expect(alignTarget({ top, height }, progress, scrollY, 800)).toBe(expected);
	});
});
